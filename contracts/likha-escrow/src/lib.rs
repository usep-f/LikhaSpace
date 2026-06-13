#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, IntoVal, Symbol, Vec,
};

pub const CLIENT_TIMEOUT: u64 = 1_209_600; // 14 days
pub const FREELANCER_TIMEOUT: u64 = 2_592_000; // 30 days

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
    pub upfront_amount_usd: i128,
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
    UpfrontReleased,
    DisputeProposal,
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
    let price_feed = price_feed_opt.unwrap();
    let scale = 10i128.pow(decimals + 5);
    scale / price_feed.price
}

#[contract]
pub struct LikhaEscrow;

fn check_status(env: &Env, expected: EscrowStatus) {
    let status: EscrowStatus = env.storage().instance().get(&DataKey::Status).unwrap();
    if status != expected {
        panic!("Invalid status");
    }
}

fn get_config(env: &Env) -> EscrowConfig {
    env.storage().instance().get(&DataKey::Config).unwrap()
}

fn set_interaction(env: &Env) {
    env.storage().instance().set(&DataKey::LastInteractionTimestamp, &env.ledger().timestamp());
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
        upfront_amount_usd: i128,
        paid_revision_price_usd: i128,
        milestones: Vec<Milestone>,
    ) {
        client.require_auth();
        assert!(!env.storage().instance().has(&DataKey::Config), "Already initialized");

        let config = EscrowConfig {
            freelancer,
            client,
            token,
            oracle,
            mediator,
            treasury,
            upfront_amount_usd,
            paid_revision_price_usd,
        };

        env.storage().instance().set(&DataKey::Config, &config);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Unfunded);
        env.storage().instance().set(&DataKey::Milestones, &milestones);
        env.storage().instance().set(&DataKey::CurrentMilestoneIdx, &0u32);
        env.storage().instance().set(&DataKey::LockedXlmBalance, &0i128);
        env.storage().instance().set(&DataKey::UpfrontReleased, &false);
    }

    pub fn fund(env: Env, client: Address, max_xlm_to_spend: i128) {
        let config = get_config(&env);
        assert_eq!(client, config.client, "Only client can fund");
        config.client.require_auth();
        check_status(&env, EscrowStatus::Unfunded);

        let milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let mut total_milestone_usd = 0;
        for m in milestones.iter() {
            total_milestone_usd += m.payout_amount_usd;
        }

        let total_usd = config.upfront_amount_usd + total_milestone_usd;

        // Oracle returns how many XLM stroops equals 1 USD cent.
        let stroops_per_cent: i128 = get_stroops_per_cent(&env, &config.oracle);
        let total_xlm_required = total_usd * stroops_per_cent;
        
        assert!(total_xlm_required <= max_xlm_to_spend, "Slippage exceeded max XLM");

        let token_client = token::Client::new(&env, &config.token);
        token_client.transfer(&client, &env.current_contract_address(), &total_xlm_required);

        let locked_xlm = total_xlm_required;
        env.storage().instance().set(&DataKey::LockedXlmBalance, &locked_xlm);
        env.storage().instance().set(&DataKey::StroopsPerCent, &stroops_per_cent);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Funded);
        env.storage().instance().set(&DataKey::UpfrontReleased, &false);
        
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
    }

    pub fn submit_deliverable(env: Env, freelancer: Address) {
        let config = get_config(&env);
        assert_eq!(freelancer, config.freelancer, "Only freelancer");
        freelancer.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let mut m = milestones.get(idx).unwrap();
        
        assert!(m.state == MilestoneState::Active, "Milestone not active");
        
        m.state = MilestoneState::Submitted;
        milestones.set(idx, m);
        env.storage().instance().set(&DataKey::Milestones, &milestones);
        
        set_interaction(&env);
    }

    pub fn accept_deliverable(env: Env, client: Address) {
        let config = get_config(&env);
        assert_eq!(client, config.client, "Only client");
        client.require_auth();
        check_status(&env, EscrowStatus::Funded);

        Self::internal_accept_deliverable(&env);
    }

    fn internal_accept_deliverable(env: &Env) {
        let config = get_config(env);
        let mut idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let mut m = milestones.get(idx).unwrap();
        
        assert!(m.state == MilestoneState::Submitted, "Deliverable not submitted");
        
        m.state = MilestoneState::Approved;
        milestones.set(idx, m.clone());
        
        let stroops_per_cent: i128 = env.storage().instance().get(&DataKey::StroopsPerCent).unwrap();
        let payout_xlm = m.payout_amount_usd * stroops_per_cent;
        
        let mut locked_xlm: i128 = env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap();
        assert!(locked_xlm >= payout_xlm, "Insufficient locked balance");
        
        let token_client = token::Client::new(env, &config.token);
        token_client.transfer(&env.current_contract_address(), &config.freelancer, &payout_xlm);
        
        locked_xlm -= payout_xlm;
        env.storage().instance().set(&DataKey::LockedXlmBalance, &locked_xlm);
        
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
    }

    pub fn deny_deliverable(env: Env, client: Address) {
        let config = get_config(&env);
        assert_eq!(client, config.client, "Only client");
        client.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let mut m = milestones.get(idx).unwrap();
        
        assert!(m.state == MilestoneState::Submitted, "Deliverable not submitted");
        assert!(m.revisions_used < m.max_revisions, "Max revisions exceeded");
        
        m.revisions_used += 1;
        m.state = MilestoneState::Active;
        milestones.set(idx, m);
        
        env.storage().instance().set(&DataKey::Milestones, &milestones);
        set_interaction(&env);
    }

    pub fn pay_for_revision(env: Env, client: Address, max_xlm_to_spend: i128) {
        let config = get_config(&env);
        assert_eq!(client, config.client, "Only client");
        client.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let stroops_per_cent: i128 = get_stroops_per_cent(&env, &config.oracle);
        let revision_xlm = config.paid_revision_price_usd * stroops_per_cent;
        assert!(revision_xlm <= max_xlm_to_spend, "Slippage exceeded");

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
    }

    pub fn refund_remaining(env: Env, freelancer: Address) {
        let config = get_config(&env);
        assert_eq!(freelancer, config.freelancer, "Only freelancer");
        freelancer.require_auth();

        let status: EscrowStatus = env.storage().instance().get(&DataKey::Status).unwrap();
        assert!(status == EscrowStatus::Funded || status == EscrowStatus::Disputed, "Invalid status");

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
    }

    pub fn request_mediation(env: Env, caller: Address) {
        let config = get_config(&env);
        assert!(caller == config.client || caller == config.freelancer, "Only client or freelancer");
        caller.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let mut m = milestones.get(idx).unwrap();
        
        m.state = MilestoneState::Disputed;
        milestones.set(idx, m);
        
        env.storage().instance().set(&DataKey::Milestones, &milestones);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Disputed);
    }

    pub fn escalate_to_mediator(env: Env, caller: Address) {
        let config = get_config(&env);
        assert!(caller == config.client || caller == config.freelancer, "Only client or freelancer");
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
        assert!(proposer == config.client || proposer == config.freelancer, "Only client or freelancer");
        proposer.require_auth();
        check_status(&env, EscrowStatus::Disputed);

        let locked_xlm: i128 = env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap();
        assert_eq!(freelancer_payout + client_refund, locked_xlm, "Must distribute exact locked balance");

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
        assert!(caller == config.client || caller == config.freelancer, "Only client or freelancer");
        caller.require_auth();
        check_status(&env, EscrowStatus::Disputed);

        let proposal: DisputeProposal = env
            .storage()
            .instance()
            .get(&DataKey::DisputeProposal)
            .expect("No active dispute proposal");

        assert_ne!(caller, proposal.proposer, "Cannot accept own proposal");

        let token_client = token::Client::new(&env, &config.token);

        if proposal.freelancer_payout > 0 {
            token_client.transfer(&env.current_contract_address(), &config.freelancer, &proposal.freelancer_payout);
        }
        if proposal.client_refund > 0 {
            token_client.transfer(&env.current_contract_address(), &config.client, &proposal.client_refund);
        }

        env.storage().instance().set(&DataKey::LockedXlmBalance, &0i128);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Cancelled);
    }

    pub fn reject_dispute_split(env: Env, caller: Address) {
        let config = get_config(&env);
        assert!(caller == config.client || caller == config.freelancer, "Only client or freelancer");
        caller.require_auth();
        check_status(&env, EscrowStatus::Disputed);

        let proposal: DisputeProposal = env
            .storage()
            .instance()
            .get(&DataKey::DisputeProposal)
            .expect("No active dispute proposal");

        assert_ne!(caller, proposal.proposer, "Cannot reject own proposal");

        let locked_xlm: i128 = env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap();
        if locked_xlm > 0 {
            let token_client = token::Client::new(&env, &config.token);
            token_client.transfer(&env.current_contract_address(), &config.treasury, &locked_xlm);
        }

        env.storage().instance().set(&DataKey::LockedXlmBalance, &0i128);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Cancelled);
    }

    pub fn claim_dispute_timeout(env: Env, caller: Address) {
        let config = get_config(&env);
        assert!(caller == config.client || caller == config.freelancer, "Only client or freelancer");
        caller.require_auth();
        check_status(&env, EscrowStatus::Disputed);

        let _proposal: DisputeProposal = env
            .storage()
            .instance()
            .get(&DataKey::DisputeProposal)
            .expect("No active dispute proposal");

        let last_time: u64 = env.storage().instance().get(&DataKey::LastInteractionTimestamp).unwrap();
        let now = env.ledger().timestamp();
        assert!(now >= last_time + 604800, "7-day dispute timeout not reached");

        let locked_xlm: i128 = env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap();
        assert!(locked_xlm > 0, "No locked funds to split");

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
    }

    pub fn resolve_dispute(
        env: Env,
        mediator: Address,
        freelancer_payout: i128,
        client_refund: i128,
    ) {
        let config = get_config(&env);
        assert_eq!(mediator, config.mediator, "Only mediator");
        mediator.require_auth();
        check_status(&env, EscrowStatus::Mediation);

        let locked_xlm: i128 = env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap();
        assert_eq!(freelancer_payout + client_refund, locked_xlm, "Must distribute exact locked balance");

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
    }

    pub fn get_dispute_proposal(env: Env) -> Option<DisputeProposal> {
        env.storage().instance().get(&DataKey::DisputeProposal)
    }

    pub fn claim_timeout(env: Env, freelancer: Address) {
        let config = get_config(&env);
        assert_eq!(freelancer, config.freelancer, "Only freelancer");
        freelancer.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let m = milestones.get(idx).unwrap();
        assert!(m.state == MilestoneState::Submitted, "Milestone not submitted");

        let last_time: u64 = env.storage().instance().get(&DataKey::LastInteractionTimestamp).unwrap();
        let now = env.ledger().timestamp();
        assert!(now >= last_time + CLIENT_TIMEOUT, "Client timeout not reached");

        Self::internal_accept_deliverable(&env);
    }

    pub fn claim_refund_timeout(env: Env, client: Address) {
        let config = get_config(&env);
        assert_eq!(client, config.client, "Only client");
        client.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let idx: u32 = env.storage().instance().get(&DataKey::CurrentMilestoneIdx).unwrap();
        let milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let m = milestones.get(idx).unwrap();
        assert!(m.state == MilestoneState::Active || m.state == MilestoneState::Locked, "Freelancer has submitted");

        let last_time: u64 = env.storage().instance().get(&DataKey::LastInteractionTimestamp).unwrap();
        let now = env.ledger().timestamp();
        assert!(now >= last_time + FREELANCER_TIMEOUT, "Freelancer timeout not reached");

        Self::internal_refund_all_to_client(&env);
    }

    pub fn cancel_unfunded(env: Env, caller: Address) {
        let config = get_config(&env);
        assert!(caller == config.client || caller == config.freelancer, "Only client or freelancer");
        caller.require_auth();
        check_status(&env, EscrowStatus::Unfunded);

        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Cancelled);
    }

    pub fn client_cancel_with_kill_fee(env: Env, client: Address) {
        let config = get_config(&env);
        assert_eq!(client, config.client, "Only client");
        client.require_auth();
        check_status(&env, EscrowStatus::Funded);

        Self::internal_refund_all_to_client(&env);
    }

    pub fn release_upfront(env: Env, client: Address) {
        let config = get_config(&env);
        assert_eq!(client, config.client, "Only client can release upfront");
        client.require_auth();
        check_status(&env, EscrowStatus::Funded);

        let upfront_released: bool = env.storage().instance().get(&DataKey::UpfrontReleased).unwrap_or(false);
        assert!(!upfront_released, "Upfront already released");

        let stroops_per_cent: i128 = env.storage().instance().get(&DataKey::StroopsPerCent).unwrap();
        let upfront_xlm = config.upfront_amount_usd * stroops_per_cent;

        if upfront_xlm > 0 {
            let mut locked_xlm: i128 = env.storage().instance().get(&DataKey::LockedXlmBalance).unwrap();
            assert!(locked_xlm >= upfront_xlm, "Insufficient locked balance");

            let token_client = token::Client::new(&env, &config.token);
            token_client.transfer(&env.current_contract_address(), &config.freelancer, &upfront_xlm);

            locked_xlm -= upfront_xlm;
            env.storage().instance().set(&DataKey::LockedXlmBalance, &locked_xlm);
        }

        env.storage().instance().set(&DataKey::UpfrontReleased, &true);
        set_interaction(&env);
    }

    pub fn is_upfront_released(env: Env) -> bool {
        env.storage().instance().get(&DataKey::UpfrontReleased).unwrap_or(false)
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
}

#[cfg(test)]
mod test;
