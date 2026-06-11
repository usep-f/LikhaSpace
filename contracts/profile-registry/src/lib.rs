#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String, Symbol};

#[contract]
pub struct ProfileRegistry;

#[contractimpl]
impl ProfileRegistry {
    pub fn set_profile(env: Env, user: Address, ipfs_cid: String) {
        user.require_auth();
        env.storage().persistent().set(&user, &ipfs_cid);
        // Extend persistent storage TTL (1 day threshold, extend to ~30 days)
        env.storage().persistent().extend_ttl(&user, 17280, 518400);

        // Emit event for discovery
        env.events().publish(
            (Symbol::new(&env, "profile_set"), user.clone()),
            ipfs_cid
        );
    }


    pub fn get_profile(env: Env, user: Address) -> Option<String> {
        env.storage().persistent().get(&user)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_profile_registry() {
        let env = Env::default();
        let contract_id = env.register(ProfileRegistry, ());
        let client = ProfileRegistryClient::new(&env, &contract_id);

        let user = Address::generate(&env);
        let ipfs_cid = String::from_str(&env, "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco");

        env.mock_all_auths();
        client.set_profile(&user, &ipfs_cid);

        let fetched_cid = client.get_profile(&user).unwrap();
        assert_eq!(fetched_cid, ipfs_cid);
    }
}
