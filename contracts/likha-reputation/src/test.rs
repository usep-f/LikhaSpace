#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, String};

#[test]
fn test_initialize_and_set_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, LikhaReputation);
    let client = LikhaReputationClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let escrow = Address::generate(&env);

    client.initialize(&admin);
    client.set_escrow_contract(&admin, &escrow);

    // Verify initializing twice fails
    assert!(client.try_initialize(&admin).is_err());
}

#[test]
fn test_record_project() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, LikhaReputation);
    let client = LikhaReputationClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let escrow = Address::generate(&env);
    let freelancer = Address::generate(&env);

    client.initialize(&admin);
    client.set_escrow_contract(&admin, &escrow);

    client.record_project(&escrow, &freelancer, &1000);

    let rep = client.get_reputation(&freelancer);
    assert_eq!(rep.projects_completed, 1);
    assert_eq!(rep.total_earned_stroops, 1000);
}

#[test]
fn test_add_review() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, LikhaReputation);
    let client = LikhaReputationClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let client_addr = Address::generate(&env);

    client.initialize(&admin);

    let review_text = String::from_str(&env, "Great work!");
    client.add_review(&client_addr, &freelancer, &5, &review_text);

    let rep = client.get_reputation(&freelancer);
    assert_eq!(rep.rating_sum, 5);
    assert_eq!(rep.rating_count, 1);
    assert_eq!(rep.reviews.len(), 1);
    
    let review = rep.reviews.get(0).unwrap();
    assert_eq!(review.rating, 5);
    assert_eq!(review.text, review_text);
    assert_eq!(review.client, client_addr);
}

#[test]
fn test_unauthorized_record_project() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, LikhaReputation);
    let client = LikhaReputationClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let escrow = Address::generate(&env);
    let malicious = Address::generate(&env);
    let freelancer = Address::generate(&env);

    client.initialize(&admin);
    client.set_escrow_contract(&admin, &escrow);

    let res = client.try_record_project(&malicious, &freelancer, &1000);
    assert!(res.is_err());
}
