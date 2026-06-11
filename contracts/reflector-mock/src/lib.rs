#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol};

#[contract]
pub struct ReflectorMock;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Asset {
    Stellar(Address),
    Other(Symbol),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceFeedEntry {
    pub price: i128,
    pub timestamp: u64,
}

#[contractimpl]
impl ReflectorMock {
    /// Legacy method
    pub fn get_price(_env: Env) -> i128 {
        10_000
    }

    /// SEP-40 compliant method matching the real Reflector oracle.
    /// Returns the price with 8 decimals.
    /// 1 XLM = $0.10 USD, so price = 10,000,000 (0.10 * 10^8).
    pub fn lastprice(_env: Env, _asset: Asset) -> Option<PriceFeedEntry> {
        Some(PriceFeedEntry {
            price: 10_000_000,
            timestamp: 0,
        })
    }
}
