#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Env, String,
    Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ReputationError {
    AlreadyInitialized = 1,
    NotAuthorizedAdmin = 2,
    NotAuthorizedEscrow = 3,
    InvalidRating = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Review {
    pub client: Address,
    pub rating: u32,
    pub text: String,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationData {
    pub projects_completed: u32,
    pub total_earned_stroops: i128,
    pub rating_sum: u32,
    pub rating_count: u32,
    pub reviews: Vec<Review>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    AuthorizedEscrow,
    Reputation(Address),
}

#[contract]
pub struct LikhaReputation;

#[contractimpl]
impl LikhaReputation {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, ReputationError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .extend_ttl(120_960, 518_400); // 7 days threshold, 30 days bump
    }

    pub fn set_escrow_contract(env: Env, admin: Address, escrow_id: Address) {
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Contract not initialized");
        if admin != stored_admin {
            panic_with_error!(&env, ReputationError::NotAuthorizedAdmin);
        }
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::AuthorizedEscrow, &escrow_id);
    }

    pub fn record_project(env: Env, escrow_caller: Address, freelancer: Address, earned_amount: i128) {
        let authorized_escrow: Address = env
            .storage()
            .instance()
            .get(&DataKey::AuthorizedEscrow)
            .expect("Authorized escrow not set");

        if escrow_caller != authorized_escrow {
            panic_with_error!(&env, ReputationError::NotAuthorizedEscrow);
        }
        escrow_caller.require_auth();

        let mut rep = Self::get_reputation_internal(&env, &freelancer);
        rep.projects_completed += 1;
        rep.total_earned_stroops += earned_amount;

        env.storage()
            .persistent()
            .set(&DataKey::Reputation(freelancer.clone()), &rep);
            
        // Extend TTL for the freelancer's persistent record
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Reputation(freelancer), 120_960, 518_400);
    }

    pub fn add_review(
        env: Env,
        client: Address,
        freelancer: Address,
        rating: u32,
        text: String,
    ) {
        client.require_auth();

        if rating < 1 || rating > 5 {
            panic_with_error!(&env, ReputationError::InvalidRating);
        }

        let mut rep = Self::get_reputation_internal(&env, &freelancer);
        rep.rating_sum += rating;
        rep.rating_count += 1;

        let review = Review {
            client,
            rating,
            text,
            timestamp: env.ledger().timestamp(),
        };
        rep.reviews.push_back(review);

        env.storage()
            .persistent()
            .set(&DataKey::Reputation(freelancer.clone()), &rep);
            
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Reputation(freelancer), 120_960, 518_400);
    }

    pub fn get_reputation(env: Env, freelancer: Address) -> ReputationData {
        Self::get_reputation_internal(&env, &freelancer)
    }

    fn get_reputation_internal(env: &Env, freelancer: &Address) -> ReputationData {
        env.storage()
            .persistent()
            .get(&DataKey::Reputation(freelancer.clone()))
            .unwrap_or(ReputationData {
                projects_completed: 0,
                total_earned_stroops: 0,
                rating_sum: 0,
                rating_count: 0,
                reviews: Vec::new(env),
            })
    }
}

#[cfg(test)]
mod test;

