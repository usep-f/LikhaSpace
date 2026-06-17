#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

soroban_sdk::contractmeta!(
    key = "Description",
    val = "Testnet mockup of Reflector Oracle Network returning fluctuating XLM/USD conversion rates"
);


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

    fn mock_price(env: &Env) -> PriceFeed {
        let base_price = 10_000_000_000_000i128; // $0.10 USD
        let timestamp = env.ledger().timestamp() as i64;
        
        // Create a 10-minute (600s) cyclical wave that varies the price 
        // by +/- 20% (between $0.08 and $0.12 USD).
        // cycle range: [-300, 299]
        let cycle = (timestamp % 600) - 300; 
        // Scale factor: 300 * 6_666_666_666 = 2_000_000_000_000 ($0.02 USD)
        let variation = (cycle as i128) * 6_666_666_666;
        let price = base_price + variation;

        PriceFeed {
            price,
            timestamp: env.ledger().timestamp(),
        }
    }

    pub fn lastprice(env: Env, asset: Asset) -> Option<PriceFeed> {
        match asset {
            Asset::Other(sym) if sym == symbol_short!("XLM") => Some(Self::mock_price(&env)),
            Asset::Stellar(_) => Some(Self::mock_price(&env)),
            _ => None,
        }
    }
}

#[cfg(test)]
mod test;

