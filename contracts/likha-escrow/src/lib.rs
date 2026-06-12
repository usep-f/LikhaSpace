
#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, IntoVal, Symbol, Vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ReflectorAsset {
    Stellar(Address),
    Other(Symbol),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceFeedEntry {
    pub price: i128,
    pub timestamp: u64,
}

fn get_stroops_per_cent(env: &Env, oracle: &Address) -> i128 {
    let asset = ReflectorAsset::Other(soroban_sdk::Symbol::new(env, "XLM"));
    
    let decimals: u32 = env.invoke_contract(
        oracle,
        &soroban_sdk::Symbol::new(env, "decimals"),
        soroban_sdk::vec![env]
    );

    let price_entry: Option<PriceFeedEntry> = env.invoke_contract(
        oracle,
        &soroban_sdk::Symbol::new(env, "lastprice"),
        soroban_sdk::vec![env, asset.into_val(env)]
    );
    
    let price = match price_entry {
        Some(entry) => entry.price,
        None => panic!("Oracle price not found"),
    };
    
    assert!(price > 0, "Oracle returned invalid price");
    // Dynamically calculate factor based on oracle decimals: 10^(5 + decimals)
    let factor = 10i128.pow(5 + decimals);
    factor / price
}

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
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowConfig {
    pub freelancer: Address,
    pub client: Address,
    pub token: Address,
    pub oracle: Address,
    pub mediator: Address,
    pub upfront_amount_usd: i128,
    pub paid_revision_price_usd: i128,
    pub client_timeout: u64,
    pub freelancer_timeout: u64,
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
        upfront_amount_usd: i128,
        paid_revision_price_usd: i128,
        milestones: Vec<Milestone>,
        client_timeout: u64,
        freelancer_timeout: u64,
    ) {
        assert!(!env.storage().instance().has(&DataKey::Config), "Already initialized");

        let config = EscrowConfig {
            freelancer,
            client,
            token,
            oracle,
            mediator,
            upfront_amount_usd,
            paid_revision_price_usd,
            client_timeout,
            freelancer_timeout,
        };

        env.storage().instance().set(&DataKey::Config, &config);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Unfunded);
        env.storage().instance().set(&DataKey::Milestones, &milestones);
        env.storage().instance().set(&DataKey::CurrentMilestoneIdx, &0u32);
        env.storage().instance().set(&DataKey::LockedXlmBalance, &0i128);
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
        let stroops_per_cent = get_stroops_per_cent(&env, &config.oracle);
        let total_xlm_required = total_usd * stroops_per_cent;
        
        assert!(total_xlm_required <= max_xlm_to_spend, "Slippage exceeded max XLM");

        let token_client = token::Client::new(&env, &config.token);
        token_client.transfer(&client, &env.current_contract_address(), &total_xlm_required);

        // Release upfront amount immediately
        let upfront_xlm = config.upfront_amount_usd * stroops_per_cent;
        if upfront_xlm > 0 {
            token_client.transfer(&env.current_contract_address(), &config.freelancer, &upfront_xlm);
        }

        let locked_xlm = total_xlm_required - upfront_xlm;
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

        let stroops_per_cent = get_stroops_per_cent(&env, &config.oracle);
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

    pub fn resolve_dispute(env: Env, mediator: Address, freelancer_payout: i128, client_refund: i128) {
        let config = get_config(&env);
        assert_eq!(mediator, config.mediator, "Only mediator");
        mediator.require_auth();
        check_status(&env, EscrowStatus::Disputed);

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
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Cancelled); // Or Resolved
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
        assert!(now >= last_time + config.client_timeout, "Client timeout not reached");

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
        assert!(now >= last_time + config.freelancer_timeout, "Freelancer timeout not reached");

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
}

#[cfg(test)]
mod test;
