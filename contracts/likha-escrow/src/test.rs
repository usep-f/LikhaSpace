#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _}, token, Address, Env,
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

#[test]
fn test_p2p_dispute_proposal_and_accept() {
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

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);

    // Request mediation (file dispute)
    client.request_mediation(&client_addr);
    assert_eq!(client.get_status(), EscrowStatus::Disputed);

    // Propose split (60% to freelancer, 40% to client)
    // Locked balance is 15,000_000_000 stroops (1,500 XLM)
    let f_payout = 9_000_000_000i128;
    let c_refund = 6_000_000_000i128;
    client.propose_dispute_split(&client_addr, &f_payout, &c_refund);

    // Verify stored proposal
    let opt_proposal = client.get_dispute_proposal();
    assert!(opt_proposal.is_some());
    let proposal = opt_proposal.unwrap();
    assert_eq!(proposal.proposer, client_addr);
    assert_eq!(proposal.freelancer_payout, f_payout);
    assert_eq!(proposal.client_refund, c_refund);

    // Freelancer accepts proposal
    client.accept_dispute_split(&freelancer);

    // Verify final status and balances
    assert_eq!(client.get_status(), EscrowStatus::Cancelled);
    let token_client = token::Client::new(&env, &token);
    assert_eq!(token_client.balance(&freelancer), 9_000_000_000i128); // Received 900 XLM
    assert_eq!(token_client.balance(&client_addr), 31_000_000_000i128); // Original 40,000_000_000 - 15,000_000_000 + 6,000_000_000 = 31,000_000_000
    assert_eq!(client.get_locked_balance(), 0i128);
}

#[test]
fn test_p2p_dispute_proposal_and_reject() {
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

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);

    // Request mediation (file dispute)
    client.request_mediation(&client_addr);

    // Propose split
    let f_payout = 9_000_000_000i128;
    let c_refund = 6_000_000_000i128;
    client.propose_dispute_split(&client_addr, &f_payout, &c_refund);

    // Freelancer rejects proposal (burns funds)
    client.reject_dispute_split(&freelancer);

    // Verify final status and balances - funds remain in contract (locked/burned)
    assert_eq!(client.get_status(), EscrowStatus::Cancelled);
    let token_client = token::Client::new(&env, &token);
    assert_eq!(token_client.balance(&freelancer), 0i128); // 0 payout
    assert_eq!(token_client.balance(&client_addr), 25_000_000_000i128); // 0 refund (original 40B - 15B funded)
    assert_eq!(client.get_locked_balance(), 0i128); // Balance cleared from contract balance record
    assert_eq!(token_client.balance(&client.address), 15_000_000_000i128); // Tokens still sit in contract address but are stuck
}

#[test]
fn test_p2p_dispute_timeout_50_50() {
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

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);

    // Request mediation
    client.request_mediation(&client_addr);

    // Propose split
    let f_payout = 9_000_000_000i128;
    let c_refund = 6_000_000_000i128;
    client.propose_dispute_split(&client_addr, &f_payout, &c_refund);

    // Advance 7 days
    env.ledger().set_timestamp(env.ledger().timestamp() + 604800);

    // Claim dispute timeout
    client.claim_dispute_timeout(&client_addr);

    // Verify 50/50 distribution (7,500_000_000 stroops each)
    assert_eq!(client.get_status(), EscrowStatus::Cancelled);
    let token_client = token::Client::new(&env, &token);
    assert_eq!(token_client.balance(&freelancer), 7_500_000_000i128); 
    assert_eq!(token_client.balance(&client_addr), 32_500_000_000i128); // 40B - 15B + 7.5B = 32.5B
    assert_eq!(client.get_locked_balance(), 0i128);
}

#[test]
fn test_mediator_resolve_dispute() {
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

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);

    // Request mediation
    client.request_mediation(&client_addr);
    assert_eq!(client.get_status(), EscrowStatus::Disputed);

    // Escalate to mediator
    client.escalate_to_mediator(&client_addr);
    assert_eq!(client.get_status(), EscrowStatus::Mediation);

    // Mediator resolves the dispute
    let f_payout = 10_000_000_000i128;
    let c_refund = 5_000_000_000i128;
    
    client.resolve_dispute(&mediator, &f_payout, &c_refund);

    // Verify correct split
    assert_eq!(client.get_status(), EscrowStatus::Settled);
    let token_client = token::Client::new(&env, &token);
    assert_eq!(token_client.balance(&freelancer), 10_000_000_000i128);
    assert_eq!(token_client.balance(&client_addr), 30_000_000_000i128); // 40B - 15B + 5B
    assert_eq!(client.get_locked_balance(), 0i128);
}

#[test]
#[should_panic(expected = "Invalid status")]
fn test_mediator_resolve_fails_before_escalation() {
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

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);

    // Request mediation
    client.request_mediation(&client_addr);
    assert_eq!(client.get_status(), EscrowStatus::Disputed);

    // Try resolving as mediator before escalation -> should panic
    client.resolve_dispute(&mediator, &10_000_000_000i128, &5_000_000_000i128);
}

#[test]
#[should_panic(expected = "Invalid status")]
fn test_escalation_blocks_p2p_propose() {
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

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);

    // Request mediation
    client.request_mediation(&client_addr);
    assert_eq!(client.get_status(), EscrowStatus::Disputed);

    // Escalate to mediator
    client.escalate_to_mediator(&client_addr);
    assert_eq!(client.get_status(), EscrowStatus::Mediation);

    // This should panic because contract is now in Mediation status
    client.propose_dispute_split(&client_addr, &9_000_000_000i128, &6_000_000_000i128);
}
