#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct ReflectorMock;

#[contractimpl]
impl ReflectorMock {
    /// Returns the number of XLM stroops equivalent to 1 USD cent.
    /// Default: 1 XLM = $0.10 USD (10 cents). So 1 cent = 0.1 XLM = 1,000,000 stroops.
    pub fn get_price(_env: Env) -> i128 {
        1_000_000
    }
}
