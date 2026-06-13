#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _, storage::Instance as _}, token, Address, Env,
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

fn setup_test_env(env: &Env) -> (Address, Address, Address, Address, Address, Address, LikhaEscrowClient<'static>) {
    env.mock_all_auths();
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
    let treasury = Address::generate(env);

    (freelancer, client_addr, token, oracle, mediator, treasury, client)
}

#[test]
fn test_initialization() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, treasury, client) = setup_test_env(&env);
    
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
        &treasury,
        &1000, // revision $10
        &milestones,
    );

    let config = client.get_config();
    assert_eq!(config.freelancer, freelancer);
    assert_eq!(config.client, client_addr);
    assert_eq!(client.get_status(), EscrowStatus::Unfunded);
}

#[test]
fn test_cancel_unfunded() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, treasury, client) = setup_test_env(&env);
    
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
        &treasury,
        &1000,
        &milestones,
    );

    // Cancel by client
    env.mock_all_auths();
    client.cancel_unfunded(&client_addr);
    assert_eq!(client.get_status(), EscrowStatus::Cancelled);
}

#[test]
fn test_cancel_unfunded_by_freelancer() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, treasury, client) = setup_test_env(&env);
    
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
        &treasury,
        &1000,
        &milestones,
    );

    // Cancel by freelancer
    env.mock_all_auths();
    client.cancel_unfunded(&freelancer);
    assert_eq!(client.get_status(), EscrowStatus::Cancelled);
}

#[test]
fn test_client_cancel_with_kill_fee() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, treasury, client) = setup_test_env(&env);
    
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
        &treasury,
        &1000,
        &milestones,
    );

    // Mint tokens to client: 40,000_000_000 stroops (4,000 XLM)
    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);

    // Fund the contract. Total required = 25000 cents * 100_000_000 = 25_000_000_000 stroops
    client.fund(&client_addr, &30_000_000_000i128);

    // Verify token transfers
    let token_client = token::Client::new(&env, &token);
    assert_eq!(token_client.balance(&freelancer), 0i128);
    assert_eq!(token_client.balance(&client_addr), 15_000_000_000i128); // 40 - 25 = 15
    assert_eq!(client.get_locked_balance(), 25_000_000_000i128); // 25B locked
    assert_eq!(client.get_status(), EscrowStatus::Funded);

    // Client cancels -> freelancer gets 75% of M1 (7,500,000,000), client gets the rest (17,500,000,000)
    client.client_cancel_with_kill_fee(&client_addr);

    // Verify status and balances
    assert_eq!(client.get_status(), EscrowStatus::Cancelled);
    assert_eq!(token_client.balance(&freelancer), 7_500_000_000i128); 
    assert_eq!(token_client.balance(&client_addr), 32_500_000_000i128); // 15B + 17.5B = 32.5B
    assert_eq!(client.get_locked_balance(), 0i128);
}

#[test]
fn test_freelancer_cancel() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, treasury, client) = setup_test_env(&env);
    
    let milestones = soroban_sdk::vec![&env, 
        Milestone {
            payout_amount_usd: 10000, // $100 -> 1,000 XLM
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
        &treasury,
        &1000,
        &milestones,
    );

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);
    let token_client = token::Client::new(&env, &token);

    // Freelancer cancels -> freelancer gets 0, client gets full refund (10,000_000_000)
    client.freelancer_cancel(&freelancer);

    assert_eq!(client.get_status(), EscrowStatus::Cancelled);
    assert_eq!(token_client.balance(&freelancer), 0i128);
    assert_eq!(token_client.balance(&client_addr), 40_000_000_000i128);
    assert_eq!(client.get_locked_balance(), 0i128);
}

#[test]
fn test_p2p_dispute_proposal_and_accept() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, treasury, client) = setup_test_env(&env);
    
    let milestones = soroban_sdk::vec![&env, Milestone {
        payout_amount_usd: 15000, // Changed to 15000 so locked balance matches old test (15B stroops)
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
        &treasury,
        &1000,
        &milestones,
    );

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);

    // Submit deliverable to unlock dispute logic
    client.submit_deliverable(&freelancer);

    // Request mediation (file dispute)
    client.request_mediation(&client_addr);
    assert_eq!(client.get_status(), EscrowStatus::Disputed);

    // Propose split (60% to freelancer, 40% to client)
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
    let (freelancer, client_addr, token, oracle, mediator, treasury, client) = setup_test_env(&env);
    
    let milestones = soroban_sdk::vec![&env, Milestone {
        payout_amount_usd: 15000,
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
        &treasury,
        &1000,
        &milestones,
    );

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);

    // Submit deliverable to unlock dispute logic
    client.submit_deliverable(&freelancer);

    // Request mediation
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
    assert_eq!(token_client.balance(&treasury), 15_000_000_000i128); // Funds transferred to treasury penalty
}

#[test]
fn test_p2p_dispute_timeout_50_50() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, treasury, client) = setup_test_env(&env);
    
    let milestones = soroban_sdk::vec![&env, Milestone {
        payout_amount_usd: 15000,
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
        &treasury,
        &1000,
        &milestones,
    );

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);

    // Submit deliverable to unlock dispute logic
    client.submit_deliverable(&freelancer);

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
    let (freelancer, client_addr, token, oracle, mediator, treasury, client) = setup_test_env(&env);
    
    let milestones = soroban_sdk::vec![&env, Milestone {
        payout_amount_usd: 15000,
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
        &treasury,
        &1000,
        &milestones,
    );

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);

    // Submit deliverable to unlock dispute logic
    client.submit_deliverable(&freelancer);

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
    let (freelancer, client_addr, token, oracle, mediator, treasury, client) = setup_test_env(&env);
    
    let milestones = soroban_sdk::vec![&env, Milestone {
        payout_amount_usd: 15000,
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
        &treasury,
        &1000,
        &milestones,
    );

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);

    // Submit deliverable to unlock dispute logic
    client.submit_deliverable(&freelancer);

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
    let (freelancer, client_addr, token, oracle, mediator, treasury, client) = setup_test_env(&env);
    
    let milestones = soroban_sdk::vec![&env, Milestone {
        payout_amount_usd: 15000,
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
        &treasury,
        &1000,
        &milestones,
    );

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);

    // Submit deliverable to unlock dispute logic
    client.submit_deliverable(&freelancer);

    // Request mediation
    client.request_mediation(&client_addr);
    assert_eq!(client.get_status(), EscrowStatus::Disputed);

    // Escalate to mediator
    client.escalate_to_mediator(&client_addr);
    assert_eq!(client.get_status(), EscrowStatus::Mediation);

    // This should panic because contract is now in Mediation status
    client.propose_dispute_split(&client_addr, &9_000_000_000i128, &6_000_000_000i128);
}

#[test]
fn test_ttl_extension() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, treasury, client) = setup_test_env(&env);
    
    let milestones = soroban_sdk::vec![&env, Milestone {
        payout_amount_usd: 15000,
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
        &treasury,
        &1000, // revision $10
        &milestones,
    );

    // Get the TTL of the instance inside the contract environment
    let ttl = env.as_contract(&client.address, || {
        env.storage().instance().get_ttl()
    });

    // Verify it was bumped to INSTANCE_BUMP_AMOUNT (518,400)
    assert_eq!(ttl, INSTANCE_BUMP_AMOUNT);
}

#[test]
#[should_panic(expected = "Cannot dispute before the first submission")]
fn test_request_mediation_fails_before_submission() {
    let env = Env::default();
    let (freelancer, client_addr, token, oracle, mediator, treasury, client) = setup_test_env(&env);
    
    let milestones = soroban_sdk::vec![&env, Milestone {
        payout_amount_usd: 15000,
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
        &treasury,
        &1000,
        &milestones,
    );

    let stellar_asset_client = token::StellarAssetClient::new(&env, &token);
    env.mock_all_auths();
    stellar_asset_client.mint(&client_addr, &40_000_000_000i128);
    client.fund(&client_addr, &30_000_000_000i128);

    // Try to request mediation before any submission - should panic
    client.request_mediation(&client_addr);
}
