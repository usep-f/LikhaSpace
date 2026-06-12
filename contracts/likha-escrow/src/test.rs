#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _, token, Address, Env,
};

#[contract]
struct LocalOracleMock;

#[contractimpl]
impl LocalOracleMock {
    pub fn decimals(_env: Env) -> u32 {
        14
    }

    pub fn lastprice(env: Env, _asset: Asset) -> Option<PriceFeed> {
        Some(PriceFeed {
            price: 10_000_000_000_000, // 1 XLM = $0.10
            timestamp: env.ledger().timestamp(),
        })
    }
}

fn setup_test_env(env: &Env) -> (Address, Address, Address, Address, Address, LikhaEscrowClient<'static>) {
    let contract_id = env.register(LikhaEscrow, ());
    let client = LikhaEscrowClient::new(env, &contract_id);

    let freelancer = Address::generate(env);
    let client_addr = Address::generate(env);
    
    // Register token contract mock (Stellar Asset Contract mock)
    let token_admin = Address::generate(env);
    let token = env.register_stellar_asset_contract(token_admin.clone());
    
    // Register oracle mock
    let oracle = env.register(LocalOracleMock, ());
    let mediator = Address::generate(env);

    (freelancer, client_addr, token, oracle, mediator, client)
}

#[test]
fn test_initialization() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, client) = setup_test_env(&env);
    
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

#[test]
fn test_cancel_unfunded() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, client) = setup_test_env(&env);
    
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
        &5000,
        &1000,
        &milestones,
        &1209600,
        &2592000,
    );

    // Cancel by client
    env.mock_all_auths();
    client.cancel_unfunded(&client_addr);
    assert_eq!(client.get_status(), EscrowStatus::Cancelled);
}

#[test]
fn test_cancel_unfunded_by_freelancer() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, client) = setup_test_env(&env);
    
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
        &5000,
        &1000,
        &milestones,
        &1209600,
        &2592000,
    );

    // Cancel by freelancer
    env.mock_all_auths();
    client.cancel_unfunded(&freelancer);
    assert_eq!(client.get_status(), EscrowStatus::Cancelled);
}

#[test]
fn test_client_cancel_with_kill_fee() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, client) = setup_test_env(&env);
    
    let milestones = soroban_sdk::vec![&env, 
        Milestone {
            payout_amount_usd: 10000, // $100 -> 1,000 XLM
            max_revisions: 2,
            revisions_used: 0,
            state: MilestoneState::Locked,
        },
        Milestone {
            payout_amount_usd: 15000, // $150 -> 1,500 XLM
            max_revisions: 2,
            revisions_used: 0,
            state: MilestoneState::Locked,
        }
    ];

    client.initialize(
        &freelancer,
        &client_addr,
        &token,
        &oracle,
        &mediator,
        &5000, // upfront $50 -> 500 XLM
        &1000,
        &milestones,
        &1209600,
        &2592000,
    );

    // Mint tokens to client: we need 30,000_000_000 stroops (3,000 XLM total)
    // plus some gas. We mint 40,000_000_000 stroops (4,000 XLM)
    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);

    // Fund the contract
    client.fund(&client_addr, &30_000_000_000i128);

    // Verify token transfers - upfront is NOT paid immediately
    let token_client = token::Client::new(&env, &token);
    assert_eq!(token_client.balance(&freelancer), 0i128); // Upfront NOT paid yet
    assert_eq!(token_client.balance(&client_addr), 10_000_000_000i128); // Client balance left
    assert_eq!(client.get_locked_balance(), 30_000_000_000i128); // Full balance locked in contract
    assert_eq!(client.get_status(), EscrowStatus::Funded);
    assert_eq!(client.is_upfront_released(), false);

    // Client cancels before upfront is released
    client.client_cancel_with_kill_fee(&client_addr);

    // Verify status and balances - client gets 100% refund
    assert_eq!(client.get_status(), EscrowStatus::Cancelled);
    assert_eq!(token_client.balance(&freelancer), 0i128); 
    assert_eq!(token_client.balance(&client_addr), 40_000_000_000i128); // Full refund
    assert_eq!(client.get_locked_balance(), 0i128);
}

#[test]
fn test_release_upfront_and_cancel() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, client) = setup_test_env(&env);
    
    let milestones = soroban_sdk::vec![&env, 
        Milestone {
            payout_amount_usd: 10000, // $100 -> 1,000 XLM
            max_revisions: 2,
            revisions_used: 0,
            state: MilestoneState::Locked,
        },
        Milestone {
            payout_amount_usd: 15000, // $150 -> 1,500 XLM
            max_revisions: 2,
            revisions_used: 0,
            state: MilestoneState::Locked,
        }
    ];

    client.initialize(
        &freelancer,
        &client_addr,
        &token,
        &oracle,
        &mediator,
        &5000, // upfront $50 -> 500 XLM
        &1000,
        &milestones,
        &1209600,
        &2592000,
    );

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);

    // Fund the contract
    client.fund(&client_addr, &30_000_000_000i128);
    let token_client = token::Client::new(&env, &token);

    // Client releases upfront
    client.release_upfront(&client_addr);
    assert_eq!(client.is_upfront_released(), true);
    assert_eq!(token_client.balance(&freelancer), 5_000_000_000i128); // Upfront paid
    assert_eq!(client.get_locked_balance(), 25_000_000_000i128); // Locked balance decremented

    // Client cancels after upfront is released
    client.client_cancel_with_kill_fee(&client_addr);

    // Verify status and balances - client gets remaining milestones refunded
    assert_eq!(client.get_status(), EscrowStatus::Cancelled);
    assert_eq!(token_client.balance(&freelancer), 5_000_000_000i128); // Freelancer keeps upfront
    assert_eq!(token_client.balance(&client_addr), 35_000_000_000i128); // Client gets back remaining 2,500 XLM
    assert_eq!(client.get_locked_balance(), 0i128);
}
