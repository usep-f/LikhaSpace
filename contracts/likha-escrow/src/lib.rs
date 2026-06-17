#![no_std]

#[cfg(test)]
extern crate std;

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, token, Address, Env, IntoVal, Symbol, Vec,
};

soroban_sdk::contractmeta!(
    key = "Description",
    val = "On-chain milestone escrow contract for LikhaSpace freelancer marketplace"
);


#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum EscrowError {
    InvalidStatus = 1,
    AlreadyInitialized = 2,
    NotAuthorizedClient = 3,
    NotAuthorizedFreelancer = 4,
    NotAuthorizedParticipant = 5,
    NotAuthorizedMediator = 6,
    SlippageExceeded = 7,
    MilestoneNotActive = 8,
    MilestoneNotSubmitted = 9,
    InsufficientLockedBalance = 10,
    MaxRevisionsExceeded = 11,
    MustDistributeExactLockedBalance = 12,
    CannotVoteOwnProposal = 13,
    DisputeTimeoutNotReached = 14,
    NoLockedFundsToSplit = 15,
    ClientTimeoutNotReached = 16,
    FreelancerTimeoutNotReached = 17,
    FreelancerHasSubmitted = 18,
    DisputeBeforeFirstSubmission = 19,
    OracleFeedNotFound = 20,
    OracleTimestampInFuture = 21,
    OraclePriceFeedStale = 22,
}

pub const CLIENT_TIMEOUT: u64 = 1_209_600; // 14 days
pub const FREELANCER_TIMEOUT: u64 = 2_592_000; // 30 days

pub const INSTANCE_THRESHOLD: u32 = 120_960; // 7 days in ledgers (assuming 5s ledgers)
pub const INSTANCE_BUMP_AMOUNT: u32 = 518_400; // 30 days in ledgers (assuming 5s ledgers)

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub payout_amount_usd: i128,  // USD cents
    pub max_revisions: u32,
    pub revisions_used: u32,
    pub state: MilestoneState,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum MilestoneState {
    Locked = 0,
    Active = 1,
    Submitted = 2,
    Approved = 3,
    Disputed = 4,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum EscrowStatus {
    Unfunded = 0,
    Funded = 1,
    Completed = 2,
    Disputed = 3,
    Cancelled = 4,
    Settled = 5,
    Mediation = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowConfig {
    pub freelancer: Address,
    pub client: Address,
    pub token: Address,
    pub oracle: Address,
    pub mediator: Address,
    pub treasury: Address,
    pub reputation_contract: Address,
    pub paid_revision_price_usd: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisputeProposal {
    pub proposer: Address,
    pub freelancer_payout: i128,
    pub client_refund: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Config,
    Status,
    Milestones,
    CurrentMilestoneIdx,
    LastInteractionTimestamp,
    LockedXlmBalance, // Stroops locked
    StroopsPerCent, // Stored oracle conversion rate at funding
    DisputeProposal,
    HasSubmittedOnce,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Asset {
    Stellar(Address),
    Other(Symbol),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceFeed {
    pub price: i128,
    pub timestamp: u64,
}

fn get_stroops_per_cent(env: &Env, oracle: &Address) -> i128 {
    let decimals: u32 = env.invoke_contract(oracle, &Symbol::new(env, "decimals"), soroban_sdk::vec![env]);
    let price_feed_opt: Option<PriceFeed> = env.invoke_contract(
        oracle,
        &Symbol::new(env, "lastprice"),
        soroban_sdk::vec![env, Asset::Other(Symbol::new(env, "XLM")).into_val(env)],
    );
    if price_feed_opt.is_none() {
        panic_with_error!(env, EscrowError::OracleFeedNotFound);
    }
    let price_feed = price_feed_opt.unwrap();
    
    // Add staleness and timestamp sanity check (max 1 hour old)
    let current_time = env.ledger().timestamp();
    if current_time < price_feed.timestamp {
        panic_with_error!(env, EscrowError::OracleTimestampInFuture);
    }
    if current_time - price_feed.timestamp >= 3600 {
        panic_with_error!(env, EscrowError::OraclePriceFeedStale);
    }
    
    let scale = 10i128.pow(decimals + 5);
    scale / price_feed.price
}

#[contract]
pub struct LikhaEscrow;

fn check_status(env: &Env, expected: EscrowStatus) {
    let status: EscrowStatus = env.storage().instance().get(&DataKey::Status).unwrap();
    if status != expected {
        panic_with_error!(env, EscrowError::InvalidStatus);
    }
}

fn get_config(env: &Env) -> EscrowConfig {
    env.storage().instance().get(&DataKey::Config).unwrap()
}

fn extend_instance_ttl(env: &Env) {
    env.storage().instance().extend_ttl(INSTANCE_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

fn set_interaction(env: &Env) {
    env.storage().instance().set(&DataKey::LastInteractionTimestamp, &env.ledger().timestamp());
    extend_instance_ttl(env);
}

#[contractimpl]
impl LikhaEscrow {
    pub fn initialize(
        env: Env,
        freelancer: Address,
        client: Address,
        token: Address,
        oracle: Address,
        mediator: Address,
        treasury: Address,
        reputation_contract: Address,
        paid_revision_price_usd: i128,
        milestones: Vec<Milestone>,
    ) {
        client.require_auth();
        #[cfg(test)]
        std::println!("--- initialize called inside contract impl ---");
        if env.storage().instance().has(&DataKey::Config) {
            panic_with_error!(&env, EscrowError::AlreadyInitialized);
        }

        let config = EscrowConfig {
            freelancer,
            client,
            token,
            oracle,
            mediator,
            treasury,
            reputation_contract,
            paid_revision_price_usd,
        };

        env.storage().instance().set(&DataKey::Config, &config);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Unfunded);
        env.storage().instance().set(&DataKey::Milestones, &milestones);
        env.storage().instance().set(&DataKey::CurrentMilestoneIdx, &0u32);
        env.storage().instance().set(&DataKey::LockedXlmBalance, &0i128);
        env.storage().instance().set(&DataKey::HasSubmittedOnce, &false);
        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "escrow"), Symbol::new(&env, "initialized")),
            (config.client.clone(), config.freelancer.clone(), config.token.clone())
        );
        #[cfg(test)]
        {
            use soroban_sdk::testutils::Events;
            std::println!("Events inside contract: {:?}", env.events().all());
        }
    }

    pub fn fund(env: Env, client: Address, max_xlm_to_spend: i128) {
        let config = get_config(&env);
        if client != config.client {
            panic_with_error!(&env, EscrowError::NotAuthorizedClient);
        }
        config.client.require_auth();
        check_status(&env, EscrowStatus::Unfunded);

        let milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let mut total_usd = 0;
        for m in milestones.iter() {
            total_usd += m.payout_amount_usd;
        }

        // Oracle returns how many XLM stroops equals 1 USD cent.
        let stroops_per_cent: i128 = get_stroops_per_cent(&env, &config.oracle);
        let total_xlm_required = total_usd * stroops_per_cent;
        
        if total_xlm_required > max_xlm_to_spend {
            panic_with_error!(&env, EscrowError::SlippageExceeded);
        }

        let token_client = token::Client::new(&env, &config.token);
        token_client.transfer(&client, &env.current_contract_address(), &total_xlm_required);

        let locked_xlm = total_xlm_required;
        env.storage().instance().set(&DataKey::LockedXlmBalance, &locked_xlm);
        env.storage().instance().set(&DataKey::StroopsPerCent, &stroops_per_cent);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Funded);
        
        let mut new_milestones = milestones;
        if new_milestones.len() > 0 {
            let mut m = new_milestones.get(0).unwrap();
            m.state = MilestoneState::Active;
            new_milestones.set(0, m);
            env.storage().instance().set(&DataKey::Milestones, &new_milestones);
        } else {
            env.storage().instance().set(&DataKey::Status, &EscrowStatus::Completed);
        }

        set_interaction(&env);

        env.events().publish(
            (Symbol::new(&env, "escrow"), Symbol::new(&env, "funded")),
            (total_xlm_required, stroops_per_cent)
        );
    }

    pub fn submit_deliverable(env: Env, freelancer: Address) {
        let config = get_config(&env);
        if freelancer != config.freelancer {
            panic_with_error!(&env, EscrowError::NotAuthorizedFreelancer);
        }
        freelancer.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let mut m = milestones.get(idx).unwrap();
        
        if m.state != MilestoneState::Active {
            panic_with_error!(&env, EscrowError::MilestoneNotActive);
        }
        
        m.state = MilestoneState::Submitted;
        milestones.set(idx, m);
        env.storage().instance().set(&DataKey::Milestones, &milestones);
        env.storage().instance().set(&DataKey::HasSubmittedOnce, &true);
        
        set_interaction(&env);

        env.events().publish(
            (Symbol::new(&env, "escrow"), Symbol::new(&env, "submitted")),
            idx
        );
    }

    pub fn accept_deliverable(env: Env, client: Address) {
        let config = get_config(&env);
        if client != config.client {
            panic_with_error!(&env, EscrowError::NotAuthorizedClient);
        }
        client.require_auth();
        check_status(&env, EscrowStatus::Funded);

        Self::internal_accept_deliverable(&env);
    }

    fn internal_accept_deliverable(env: &Env) {
        let config = get_config(env);
        let mut idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let mut m = milestones.get(idx).unwrap();
        
        if m.state != MilestoneState::Submitted {
            panic_with_error!(env, EscrowError::MilestoneNotSubmitted);
        }
        
        m.state = MilestoneState::Approved;
        milestones.set(idx, m.clone());
        
        let stroops_per_cent: i128 = env.storage().instance().get(&DataKey::StroopsPerCent).unwrap();
        let payout_xlm = m.payout_amount_usd * stroops_per_cent;
        
        let mut locked_xlm: i128 = env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap();
        if locked_xlm < payout_xlm {
            panic_with_error!(env, EscrowError::InsufficientLockedBalance);
        }
        
        let token_client = token::Client::new(env, &config.token);
        token_client.transfer(&env.current_contract_address(), &config.freelancer, &payout_xlm);
        
        // Update reputation
        env.authorize_as_current_contract(soroban_sdk::vec![
            env,
            soroban_sdk::auth::InvokerContractAuthEntry::Contract(
                soroban_sdk::auth::SubContractInvocation {
                    context: soroban_sdk::auth::ContractContext {
                        contract: config.reputation_contract.clone(),
                        fn_name: Symbol::new(env, "record_project"),
                        args: soroban_sdk::vec![
                            env,
                            env.current_contract_address().into_val(env),
                            config.freelancer.clone().into_val(env),
                            payout_xlm.into_val(env),
                        ],
                    },
                    sub_invocations: soroban_sdk::vec![env],
                },
            ),
        ]);

        let _: () = env.invoke_contract(
            &config.reputation_contract,
            &Symbol::new(env, "record_project"),
            soroban_sdk::vec![
                env,
                env.current_contract_address().into_val(env),
                config.freelancer.clone().into_val(env),
                payout_xlm.into_val(env)
            ],
        );
        
        locked_xlm -= payout_xlm;
        env.storage().instance().set(&DataKey::LockedXlmBalance, &locked_xlm);
        
        let approved_idx = idx;
        idx += 1;
        if idx < milestones.len() as u32 {
            let mut next_m = milestones.get(idx).unwrap();
            next_m.state = MilestoneState::Active;
            milestones.set(idx, next_m);
            env.storage().instance().set(&DataKey::CurrentMilestoneIdx, &idx);
        } else {
            env.storage().instance().set(&DataKey::Status, &EscrowStatus::Completed);
        }
        
        env.storage().instance().set(&DataKey::Milestones, &milestones);
        set_interaction(env);

        env.events().publish(
            (Symbol::new(env, "escrow"), Symbol::new(env, "approved")),
            (approved_idx, payout_xlm)
        );
    }

    pub fn deny_deliverable(env: Env, client: Address) {
        let config = get_config(&env);
        if client != config.client {
            panic_with_error!(&env, EscrowError::NotAuthorizedClient);
        }
        client.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let mut m = milestones.get(idx).unwrap();
        
        if m.state != MilestoneState::Submitted {
            panic_with_error!(&env, EscrowError::MilestoneNotSubmitted);
        }
        if m.revisions_used >= m.max_revisions {
            panic_with_error!(&env, EscrowError::MaxRevisionsExceeded);
        }
        
        m.revisions_used += 1;
        m.state = MilestoneState::Active;
        milestones.set(idx, m);
        
        env.storage().instance().set(&DataKey::Milestones, &milestones);
        set_interaction(&env);
    }

    pub fn pay_for_revision(env: Env, client: Address, max_xlm_to_spend: i128) {
        let config = get_config(&env);
        if client != config.client {
            panic_with_error!(&env, EscrowError::NotAuthorizedClient);
        }
        client.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let stroops_per_cent: i128 = get_stroops_per_cent(&env, &config.oracle);
        let revision_xlm = config.paid_revision_price_usd * stroops_per_cent;
        if revision_xlm > max_xlm_to_spend {
            panic_with_error!(&env, EscrowError::SlippageExceeded);
        }

        let token_client = token::Client::new(&env, &config.token);
        // Direct transfer client -> freelancer
        token_client.transfer(&client, &config.freelancer, &revision_xlm);

        let idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let mut m = milestones.get(idx).unwrap();
        
        m.max_revisions += 1;
        milestones.set(idx, m);
        env.storage().instance().set(&DataKey::Milestones, &milestones);
        
        set_interaction(&env);

        env.events().publish(
            (Symbol::new(&env, "escrow"), Symbol::new(&env, "revision_paid")),
            revision_xlm
        );
    }

    pub fn refund_remaining(env: Env, freelancer: Address) {
        let config = get_config(&env);
        if freelancer != config.freelancer {
            panic_with_error!(&env, EscrowError::NotAuthorizedFreelancer);
        }
        freelancer.require_auth();

        let status: EscrowStatus = env.storage().instance().get(&DataKey::Status).unwrap();
        if status != EscrowStatus::Funded && status != EscrowStatus::Disputed {
            panic_with_error!(&env, EscrowError::InvalidStatus);
        }

        Self::internal_refund_all_to_client(&env);
    }

    fn internal_refund_all_to_client(env: &Env) {
        let config = get_config(env);
        let locked_xlm: i128 = env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap();
        
        if locked_xlm > 0 {
            let token_client = token::Client::new(env, &config.token);
            token_client.transfer(&env.current_contract_address(), &config.client, &locked_xlm);
            env.storage().instance().set(&DataKey::LockedXlmBalance, &0i128);
        }
        
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Cancelled);
        extend_instance_ttl(env);
    }

    pub fn request_mediation(env: Env, caller: Address) {
        let config = get_config(&env);
        if caller != config.client && caller != config.freelancer {
            panic_with_error!(&env, EscrowError::NotAuthorizedParticipant);
        }
        caller.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let has_submitted: bool = env.storage().instance().get(&DataKey::HasSubmittedOnce).unwrap_or(false);
        if !has_submitted {
            panic_with_error!(&env, EscrowError::DisputeBeforeFirstSubmission);
        }

        let idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let mut m = milestones.get(idx).unwrap();
        
        m.state = MilestoneState::Disputed;
        milestones.set(idx, m);
        
        env.storage().instance().set(&DataKey::Milestones, &milestones);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Disputed);
        set_interaction(&env);

        env.events().publish(
            (Symbol::new(&env, "escrow"), Symbol::new(&env, "disputed")),
            env.ledger().timestamp()
        );
    }

    pub fn escalate_to_mediator(env: Env, caller: Address) {
        let config = get_config(&env);
        if caller != config.client && caller != config.freelancer {
            panic_with_error!(&env, EscrowError::NotAuthorizedParticipant);
        }
        caller.require_auth();
        check_status(&env, EscrowStatus::Disputed);

        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Mediation);
        if env.storage().instance().has(&DataKey::DisputeProposal) {
            env.storage().instance().remove(&DataKey::DisputeProposal);
        }
        set_interaction(&env);
    }

    pub fn propose_dispute_split(
        env: Env,
        proposer: Address,
        freelancer_payout: i128,
        client_refund: i128,
    ) {
        let config = get_config(&env);
        if proposer != config.client && proposer != config.freelancer {
            panic_with_error!(&env, EscrowError::NotAuthorizedParticipant);
        }
        proposer.require_auth();
        check_status(&env, EscrowStatus::Disputed);

        let locked_xlm: i128 = env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap();
        if freelancer_payout + client_refund != locked_xlm {
            panic_with_error!(&env, EscrowError::MustDistributeExactLockedBalance);
        }

        let proposal = DisputeProposal {
            proposer,
            freelancer_payout,
            client_refund,
        };

        env.storage().instance().set(&DataKey::DisputeProposal, &proposal);
        set_interaction(&env);
    }

    pub fn accept_dispute_split(env: Env, caller: Address) {
        let config = get_config(&env);
        if caller != config.client && caller != config.freelancer {
            panic_with_error!(&env, EscrowError::NotAuthorizedParticipant);
        }
        caller.require_auth();
        check_status(&env, EscrowStatus::Disputed);

        let proposal: DisputeProposal = env
            .storage()
            .instance()
            .get(&DataKey::DisputeProposal)
            .expect("No active dispute proposal");

        if caller == proposal.proposer {
            panic_with_error!(&env, EscrowError::CannotVoteOwnProposal);
        }

        let token_client = token::Client::new(&env, &config.token);

        if proposal.freelancer_payout > 0 {
            token_client.transfer(&env.current_contract_address(), &config.freelancer, &proposal.freelancer_payout);
        }
        if proposal.client_refund > 0 {
            token_client.transfer(&env.current_contract_address(), &config.client, &proposal.client_refund);
        }

        env.storage().instance().set(&DataKey::LockedXlmBalance, &0i128);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Cancelled);
        extend_instance_ttl(&env);
    }

    pub fn reject_dispute_split(env: Env, caller: Address) {
        let config = get_config(&env);
        if caller != config.client && caller != config.freelancer {
            panic_with_error!(&env, EscrowError::NotAuthorizedParticipant);
        }
        caller.require_auth();
        check_status(&env, EscrowStatus::Disputed);

        let proposal: DisputeProposal = env
            .storage()
            .instance()
            .get(&DataKey::DisputeProposal)
            .expect("No active dispute proposal");

        if caller == proposal.proposer {
            panic_with_error!(&env, EscrowError::CannotVoteOwnProposal);
        }

        let locked_xlm: i128 = env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap();
        if locked_xlm > 0 {
            let token_client = token::Client::new(&env, &config.token);
            token_client.transfer(&env.current_contract_address(), &config.treasury, &locked_xlm);
        }

        env.storage().instance().set(&DataKey::LockedXlmBalance, &0i128);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Cancelled);
        extend_instance_ttl(&env);
    }

    pub fn claim_dispute_timeout(env: Env, caller: Address) {
        let config = get_config(&env);
        if caller != config.client && caller != config.freelancer {
            panic_with_error!(&env, EscrowError::NotAuthorizedParticipant);
        }
        caller.require_auth();
        check_status(&env, EscrowStatus::Disputed);

        let _proposal: DisputeProposal = env
            .storage()
            .instance()
            .get(&DataKey::DisputeProposal)
            .expect("No active dispute proposal");

        let last_time: u64 = env.storage().instance().get(&DataKey::LastInteractionTimestamp).unwrap();
        let now = env.ledger().timestamp();
        if now < last_time + 604800 {
            panic_with_error!(&env, EscrowError::DisputeTimeoutNotReached);
        }

        let locked_xlm: i128 = env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap();
        if locked_xlm <= 0 {
            panic_with_error!(&env, EscrowError::NoLockedFundsToSplit);
        }

        let freelancer_payout = locked_xlm / 2;
        let client_refund = locked_xlm - freelancer_payout;

        let token_client = token::Client::new(&env, &config.token);

        if freelancer_payout > 0 {
            token_client.transfer(&env.current_contract_address(), &config.freelancer, &freelancer_payout);
        }
        if client_refund > 0 {
            token_client.transfer(&env.current_contract_address(), &config.client, &client_refund);
        }

        env.storage().instance().set(&DataKey::LockedXlmBalance, &0i128);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Cancelled);
        extend_instance_ttl(&env);
    }

    pub fn resolve_dispute(
        env: Env,
        mediator: Address,
        freelancer_payout: i128,
        client_refund: i128,
    ) {
        let config = get_config(&env);
        if mediator != config.mediator {
            panic_with_error!(&env, EscrowError::NotAuthorizedMediator);
        }
        mediator.require_auth();
        check_status(&env, EscrowStatus::Mediation);

        let locked_xlm: i128 = env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap();
        if freelancer_payout + client_refund != locked_xlm {
            panic_with_error!(&env, EscrowError::MustDistributeExactLockedBalance);
        }

        let token_client = token::Client::new(&env, &config.token);

        if freelancer_payout > 0 {
            token_client.transfer(&env.current_contract_address(), &config.freelancer, &freelancer_payout);
        }
        if client_refund > 0 {
            token_client.transfer(&env.current_contract_address(), &config.client, &client_refund);
        }

        env.storage().instance().set(&DataKey::LockedXlmBalance, &0i128);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Settled);
        set_interaction(&env);

        env.events().publish(
            (Symbol::new(&env, "escrow"), Symbol::new(&env, "dispute_resolved")),
            (freelancer_payout, client_refund)
        );
    }

    pub fn get_dispute_proposal(env: Env) -> Option<DisputeProposal> {
        env.storage().instance().get(&DataKey::DisputeProposal)
    }

    pub fn claim_timeout(env: Env, freelancer: Address) {
        let config = get_config(&env);
        if freelancer != config.freelancer {
            panic_with_error!(&env, EscrowError::NotAuthorizedFreelancer);
        }
        freelancer.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let m = milestones.get(idx).unwrap();
        if m.state != MilestoneState::Submitted {
            panic_with_error!(&env, EscrowError::MilestoneNotSubmitted);
        }

        let last_time: u64 = env.storage().instance().get(&DataKey::LastInteractionTimestamp).unwrap();
        let now = env.ledger().timestamp();
        if now < last_time + CLIENT_TIMEOUT {
            panic_with_error!(&env, EscrowError::ClientTimeoutNotReached);
        }

        Self::internal_accept_deliverable(&env);
    }

    pub fn claim_refund_timeout(env: Env, client: Address) {
        let config = get_config(&env);
        if client != config.client {
            panic_with_error!(&env, EscrowError::NotAuthorizedClient);
        }
        client.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let m = milestones.get(idx).unwrap();
        if m.state != MilestoneState::Active && m.state != MilestoneState::Locked {
            panic_with_error!(&env, EscrowError::FreelancerHasSubmitted);
        }

        let last_time: u64 = env.storage().instance().get(&DataKey::LastInteractionTimestamp).unwrap();
        let now = env.ledger().timestamp();
        if now < last_time + FREELANCER_TIMEOUT {
            panic_with_error!(&env, EscrowError::FreelancerTimeoutNotReached);
        }

        Self::internal_refund_all_to_client(&env);
    }

    pub fn cancel_unfunded(env: Env, caller: Address) {
        let config = get_config(&env);
        if caller != config.client && caller != config.freelancer {
            panic_with_error!(&env, EscrowError::NotAuthorizedParticipant);
        }
        caller.require_auth();
        check_status(&env, EscrowStatus::Unfunded);

        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Cancelled);
        extend_instance_ttl(&env);

        env.events().publish(
            (Symbol::new(&env, "escrow"), Symbol::new(&env, "cancelled")),
            caller
        );
    }

    pub fn client_cancel_with_kill_fee(env: Env, client: Address) {
        let config = get_config(&env);
        if client != config.client {
            panic_with_error!(&env, EscrowError::NotAuthorizedClient);
        }
        client.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        
        let mut locked_xlm: i128 = env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap();
        let token_client = token::Client::new(&env, &config.token);

        if idx < milestones.len() as u32 {
            let m = milestones.get(idx).unwrap();
            let stroops_per_cent: i128 = env.storage().instance().get(&DataKey::StroopsPerCent).unwrap();
            let payout_xlm = m.payout_amount_usd * stroops_per_cent;
            let kill_fee_xlm = (payout_xlm * 75) / 100;

            if locked_xlm >= kill_fee_xlm && kill_fee_xlm > 0 {
                token_client.transfer(&env.current_contract_address(), &config.freelancer, &kill_fee_xlm);
                locked_xlm -= kill_fee_xlm;
            }
        }

        if locked_xlm > 0 {
            token_client.transfer(&env.current_contract_address(), &config.client, &locked_xlm);
        }

        env.storage().instance().set(&DataKey::LockedXlmBalance, &0i128);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Cancelled);
        extend_instance_ttl(&env);
    }

    pub fn freelancer_cancel(env: Env, freelancer: Address) {
        let config = get_config(&env);
        if freelancer != config.freelancer {
            panic_with_error!(&env, EscrowError::NotAuthorizedFreelancer);
        }
        freelancer.require_auth();
        check_status(&env, EscrowStatus::Funded);

        Self::internal_refund_all_to_client(&env);
    }

    pub fn get_config(env: Env) -> EscrowConfig {
        get_config(&env)
    }

    pub fn get_status(env: Env) -> EscrowStatus {
        env.storage().instance().get(&DataKey::Status).unwrap()
    }

    pub fn get_milestones(env: Env) -> Vec<Milestone> {
        env.storage().instance().get(&DataKey::Milestones).unwrap_or(soroban_sdk::vec![&env])
    }

    pub fn get_locked_balance(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap_or(0)
    }

    pub fn get_has_submitted_once(env: Env) -> bool {
        env.storage().instance().get(&DataKey::HasSubmittedOnce).unwrap_or(false)
    }
}

#[cfg(test)]
mod test;
