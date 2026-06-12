#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Asset {
    Stellar(Address),
    Other(Symbol),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceFeed {
    pub price: i128,
    pub timestamp: u64,
}

#[contract]
pub struct ReflectorMock;

#[contractimpl]
impl ReflectorMock {
    pub fn decimals(_env: Env) -> u32 {
        14
    }

    pub fn lastprice(env: Env, asset: Asset) -> Option<PriceFeed> {
        match asset {
            Asset::Other(sym) if sym == symbol_short!("XLM") => {
                Some(PriceFeed {
                    // Default: 1 XLM = $0.10 USD (10 cents). 
                    // Since decimals = 14, 0.10 USD is 10_000_000_000_000 (10^13)
                    price: 10_000_000_000_000,
                    timestamp: env.ledger().timestamp(),
                })
            }
            _ => None,
        }
    }
}
