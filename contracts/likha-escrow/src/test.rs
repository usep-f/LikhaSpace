#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_initialization() {
    let env = Env::default();
    let contract_id = env.register(LikhaEscrow, ());
    let client = LikhaEscrowClient::new(&env, &contract_id);

    let freelancer = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let token = Address::generate(&env);
    let oracle = Address::generate(&env);
    let mediator = Address::generate(&env);
    
    let milestones = soroban_sdk::vec![&env, Milestone {
        payout_amount_usd: 10000,
        max_revisions: 2,
        revisions_used: 0,
        state: MilestoneState::Locked,
    }];

    client.initialize(
        &freelancer,
        &client_addr,
        &token,
        &oracle,
        &mediator,
        &5000, // upfront $50
        &1000, // revision $10
        &milestones,
        &1209600,
        &2592000,
    );

    let config = client.get_config();
    assert_eq!(config.freelancer, freelancer);
    assert_eq!(config.client, client_addr);
    assert_eq!(client.get_status(), EscrowStatus::Unfunded);
}
