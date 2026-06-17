#![cfg(test)]

use crate::{Asset, ReflectorMock, ReflectorMockClient};
use soroban_sdk::{symbol_short, Env, testutils::Ledger as _};

#[test]
fn test_lastprice_fluctuation() {
    let env = Env::default();
    
    // Register the contract
    let contract_id = env.register_contract(None, ReflectorMock);
    let client = ReflectorMockClient::new(&env, &contract_id);

    // Call lastprice at timestamp 0
    env.ledger().set_timestamp(0);
    let price_feed_0 = client.lastprice(&Asset::Other(symbol_short!("XLM"))).unwrap();
    
    // cycle = (0 % 600) - 300 = -300
    // variation = -300 * 6_666_666_666 = -1_999_999_999_800
    // price = 10_000_000_000_000 - 1_999_999_999_800 = 8_000_000_000_200 (~ $0.08)
    assert!(price_feed_0.price >= 8_000_000_000_000 && price_feed_0.price <= 8_000_000_000_300);

    // Call lastprice at timestamp 300
    env.ledger().set_timestamp(300);
    let price_feed_300 = client.lastprice(&Asset::Other(symbol_short!("XLM"))).unwrap();
    // cycle = (300 % 600) - 300 = 0
    // variation = 0
    // price = 10_000_000_000_000 ($0.10)
    assert_eq!(price_feed_300.price, 10_000_000_000_000);

    // Call lastprice at timestamp 599
    env.ledger().set_timestamp(599);
    let price_feed_599 = client.lastprice(&Asset::Other(symbol_short!("XLM"))).unwrap();
    // cycle = (599 % 600) - 300 = 299
    // variation = 299 * 6_666_666_666 = 1_993_333_333_134
    // price = 11_993_333_333_134
    assert!(price_feed_599.price >= 11_993_333_333_000 && price_feed_599.price <= 11_993_333_333_200);

    // Check non-XLM asset returns None
    let other_asset = client.lastprice(&Asset::Other(symbol_short!("BTC")));
    assert!(other_asset.is_none());
}
