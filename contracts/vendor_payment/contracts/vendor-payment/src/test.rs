#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events},
    token, Address, Env, String,
};

#[test]
fn test_vendor_payment_flow() {
    let env = Env::default();
    env.mock_all_auths();

    // Deploy contract
    let contract_id = env.register_contract(None, VendorPaymentContract);
    let client = VendorPaymentContractClient::new(&env, &contract_id);

    // Define addresses
    let admin = Address::generate(&env);
    let vendor = Address::generate(&env);
    let payer = Address::generate(&env);

    // Initialize contract
    client.init(&admin);
    assert_eq!(client.get_admin(), Some(admin.clone()));
    assert_eq!(client.get_invoice_count(), 0);

    // Register vendor
    let vendor_name = String::from_str(&env, "Acme Corp");
    client.register_vendor(&vendor, &vendor_name);

    // Verify vendor details
    let saved_vendor = client.get_vendor(&vendor).unwrap();
    assert_eq!(saved_vendor.address, vendor);
    assert_eq!(saved_vendor.name, vendor_name);
    assert!(saved_vendor.is_active);

    // Deploy mock token
    let token_admin = Address::generate(&env);
    let token_contract_id = env.register_stellar_asset_contract(token_admin.clone());
    let token_client = token::StellarAssetClient::new(&env, &token_contract_id);
    let token_client_standard = token::Client::new(&env, &token_contract_id);

    // Mint tokens to payer
    token_client.mint(&payer, &1000);
    assert_eq!(token_client_standard.balance(&payer), 1000);

    // Create Invoice (called by vendor)
    let invoice_desc = String::from_str(&env, "Hardware supplies");
    let invoice_id = client.create_invoice(&vendor, &500, &token_contract_id, &invoice_desc, &1718978400);
    assert_eq!(invoice_id, 1);
    assert_eq!(client.get_invoice_count(), 1);

    // Check invoice details (Pending status)
    let invoice = client.get_invoice(&invoice_id).unwrap();
    assert_eq!(invoice.vendor, vendor);
    assert_eq!(invoice.amount, 500);
    assert_eq!(invoice.token, token_contract_id);
    assert_eq!(invoice.description, invoice_desc);
    assert_eq!(invoice.due_date, 1718978400);
    assert_eq!(invoice.status, InvoiceStatus::Pending);

    // Approve Invoice (called by admin)
    client.approve_invoice(&invoice_id);
    let invoice = client.get_invoice(&invoice_id).unwrap();
    assert_eq!(invoice.status, InvoiceStatus::Approved);

    // Pay Invoice (called by payer)
    client.pay_invoice(&invoice_id, &payer);

    // Verify invoice is Paid
    let invoice = client.get_invoice(&invoice_id).unwrap();
    assert_eq!(invoice.status, InvoiceStatus::Paid);

    // Verify balances updated
    assert_eq!(token_client_standard.balance(&payer), 500);
    assert_eq!(token_client_standard.balance(&vendor), 500);
}

#[test]
#[should_panic(expected = "invoice must be approved before payment")]
fn test_pay_unapproved_invoice_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, VendorPaymentContract);
    let client = VendorPaymentContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let vendor = Address::generate(&env);
    let payer = Address::generate(&env);

    client.init(&admin);
    client.register_vendor(&vendor, &String::from_str(&env, "Vendor"));

    let token_admin = Address::generate(&env);
    let token_contract_id = env.register_stellar_asset_contract(token_admin);
    let token_client = token::StellarAssetClient::new(&env, &token_contract_id);
    token_client.mint(&payer, &1000);

    let invoice_id = client.create_invoice(&vendor, &500, &token_contract_id, &String::from_str(&env, "Desc"), &0);
    
    // Attempt to pay before approval (should panic)
    client.pay_invoice(&invoice_id, &payer);
}

#[test]
fn test_reject_invoice() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, VendorPaymentContract);
    let client = VendorPaymentContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let vendor = Address::generate(&env);

    client.init(&admin);
    client.register_vendor(&vendor, &String::from_str(&env, "Vendor"));

    let token_contract_id = env.register_stellar_asset_contract(Address::generate(&env));
    let invoice_id = client.create_invoice(&vendor, &100, &token_contract_id, &String::from_str(&env, "Invoice"), &0);

    client.reject_invoice(&invoice_id);
    let invoice = client.get_invoice(&invoice_id).unwrap();
    assert_eq!(invoice.status, InvoiceStatus::Rejected);
}
