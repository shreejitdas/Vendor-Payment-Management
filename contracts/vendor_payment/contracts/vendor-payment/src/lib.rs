#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, String, Symbol,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Vendor {
    pub address: Address,
    pub name: String,
    pub is_active: bool,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum InvoiceStatus {
    Pending = 0,
    Approved = 1,
    Paid = 2,
    Rejected = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Invoice {
    pub id: u64,
    pub vendor: Address,
    pub amount: i128,
    pub token: Address,
    pub description: String,
    pub due_date: u64,
    pub status: InvoiceStatus,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Vendor(Address),
    Invoice(u64),
    InvoiceCount,
}

#[contract]
pub struct VendorPaymentContract;

#[contractimpl]
impl VendorPaymentContract {
    /// Initialize the contract with an administrator address
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::InvoiceCount, &0u64);
    }

    /// Retrieve the admin address
    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }

    /// Register a new vendor. Only the admin can register vendors.
    pub fn register_vendor(env: Env, vendor: Address, name: String) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let vendor_info = Vendor {
            address: vendor.clone(),
            name: name.clone(),
            is_active: true,
        };

        env.storage().persistent().set(&DataKey::Vendor(vendor.clone()), &vendor_info);

        // Emit vendor registration event
        env.events().publish(
            (symbol_short!("vendor"), symbol_short!("register")),
            (vendor, name),
        );
    }

    /// Get registered vendor info
    pub fn get_vendor(env: Env, vendor: Address) -> Option<Vendor> {
        env.storage().persistent().get(&DataKey::Vendor(vendor))
    }

    /// Create a new invoice. Called by a registered and active vendor.
    pub fn create_invoice(
        env: Env,
        vendor: Address,
        amount: i128,
        token: Address,
        description: String,
        due_date: u64,
    ) -> u64 {
        vendor.require_auth();

        // Verify vendor is registered and active
        let vendor_key = DataKey::Vendor(vendor.clone());
        if !env.storage().persistent().has(&vendor_key) {
            panic!("vendor is not registered");
        }
        let vendor_info: Vendor = env.storage().persistent().get(&vendor_key).unwrap();
        if !vendor_info.is_active {
            panic!("vendor is inactive");
        }

        if amount <= 0 {
            panic!("amount must be positive");
        }

        // Increment invoice ID
        let mut count: u64 = env.storage().instance().get(&DataKey::InvoiceCount).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&DataKey::InvoiceCount, &count);

        let invoice = Invoice {
            id: count,
            vendor: vendor.clone(),
            amount,
            token: token.clone(),
            description: description.clone(),
            due_date,
            status: InvoiceStatus::Pending,
        };

        env.storage().persistent().set(&DataKey::Invoice(count), &invoice);

        // Emit invoice created event
        env.events().publish(
            (symbol_short!("invoice"), symbol_short!("create")),
            (count, vendor, amount, token),
        );

        count
    }

    /// Get invoice details
    pub fn get_invoice(env: Env, invoice_id: u64) -> Option<Invoice> {
        env.storage().persistent().get(&DataKey::Invoice(invoice_id))
    }

    /// Get total number of invoices created
    pub fn get_invoice_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::InvoiceCount).unwrap_or(0)
    }

    /// Approve an invoice for payment. Only the admin can approve.
    pub fn approve_invoice(env: Env, invoice_id: u64) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let invoice_key = DataKey::Invoice(invoice_id);
        if !env.storage().persistent().has(&invoice_key) {
            panic!("invoice not found");
        }

        let mut invoice: Invoice = env.storage().persistent().get(&invoice_key).unwrap();
        if invoice.status != InvoiceStatus::Pending {
            panic!("invoice is not in pending state");
        }

        invoice.status = InvoiceStatus::Approved;
        env.storage().persistent().set(&invoice_key, &invoice);

        // Emit invoice approved event
        env.events().publish(
            (symbol_short!("invoice"), symbol_short!("approve")),
            invoice_id,
        );
    }

    /// Reject an invoice. Only the admin can reject.
    pub fn reject_invoice(env: Env, invoice_id: u64) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let invoice_key = DataKey::Invoice(invoice_id);
        if !env.storage().persistent().has(&invoice_key) {
            panic!("invoice not found");
        }

        let mut invoice: Invoice = env.storage().persistent().get(&invoice_key).unwrap();
        if invoice.status != InvoiceStatus::Pending {
            panic!("invoice is not in pending state");
        }

        invoice.status = InvoiceStatus::Rejected;
        env.storage().persistent().set(&invoice_key, &invoice);

        // Emit invoice rejected event
        env.events().publish(
            (symbol_short!("invoice"), symbol_short!("reject")),
            invoice_id,
        );
    }

    /// Pay an approved invoice. Payer transfers tokens to vendor.
    pub fn pay_invoice(env: Env, invoice_id: u64, payer: Address) {
        payer.require_auth();

        let invoice_key = DataKey::Invoice(invoice_id);
        if !env.storage().persistent().has(&invoice_key) {
            panic!("invoice not found");
        }

        let mut invoice: Invoice = env.storage().persistent().get(&invoice_key).unwrap();
        if invoice.status != InvoiceStatus::Approved {
            panic!("invoice must be approved before payment");
        }

        // Perform token transfer
        let token_client = token::Client::new(&env, &invoice.token);
        token_client.transfer(&payer, &invoice.vendor, &invoice.amount);

        invoice.status = InvoiceStatus::Paid;
        env.storage().persistent().set(&invoice_key, &invoice);

        // Emit invoice paid event
        env.events().publish(
            (symbol_short!("invoice"), symbol_short!("pay")),
            (invoice_id, payer),
        );
    }
}

mod test;
