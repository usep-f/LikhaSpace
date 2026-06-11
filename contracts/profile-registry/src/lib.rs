#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String, Symbol, Vec, Map};

const USERS_KEY: Symbol = Symbol::short("users");

#[contract]
pub struct ProfileRegistry;

#[contractimpl]
impl ProfileRegistry {
    pub fn set_profile(env: Env, user: Address, ipfs_cid: String) {
        user.require_auth();
        env.storage().persistent().set(&user, &ipfs_cid);
        // Extend persistent storage TTL (1 day threshold, extend to ~30 days)
        env.storage().persistent().extend_ttl(&user, 17280, 518400);

        let mut users: Vec<Address> = env.storage().instance().get(&USERS_KEY).unwrap_or(Vec::new(&env));
        if !users.contains(&user) {
            users.push_back(user.clone());
            env.storage().instance().set(&USERS_KEY, &users);
        }
        env.storage().instance().extend_ttl(17280, 518400);

        // Emit event for discovery
        env.events().publish(
            (Symbol::new(&env, "profile_set"), user.clone()),
            ipfs_cid
        );
    }

    pub fn get_profile(env: Env, user: Address) -> Option<String> {
        env.storage().persistent().get(&user)
    }

    pub fn get_all_profiles(env: Env) -> Map<Address, String> {
        let mut map = Map::new(&env);
        let users: Vec<Address> = env.storage().instance().get(&USERS_KEY).unwrap_or(Vec::new(&env));
        for user in users.iter() {
            if let Some(cid) = env.storage().persistent().get::<Address, String>(&user) {
                map.set(user, cid);
            }
        }
        map
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
        
        let all = client.get_all_profiles();
        assert_eq!(all.get(user).unwrap(), ipfs_cid);
    }
}
