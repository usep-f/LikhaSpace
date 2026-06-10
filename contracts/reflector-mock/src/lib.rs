#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct ReflectorMock;

#[contractimpl]
impl ReflectorMock {
    /// Returns the number of XLM stroops equivalent to 1 USD cent.
    /// Changed for testing: 1 cent = 10,000 stroops. So 1 XLM = $10.00 USD.
    pub fn get_price(_env: Env) -> i128 {
        10_000
    }
}
