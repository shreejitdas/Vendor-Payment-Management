import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { Networks } from '@creit.tech/stellar-wallets-kit/types';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import * as StellarSdk from '@stellar/stellar-sdk';

export const CONTRACT_ID = 'CCZ7V5MMCOAYACWPWW6QPCWSVMHQHUQWAQ4YMGC3MJEVIKLVOKPIOVYM';
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const RPC_URL = 'https://soroban-testnet.stellar.org';
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';

// Initialize the kit statically
if (typeof window !== 'undefined') {
  StellarWalletsKit.init({
    modules: defaultModules(),
  });
  StellarWalletsKit.setNetwork(Networks.TESTNET);
}

// Initialize Horizon and RPC Servers
export const rpcServer = new StellarSdk.rpc.Server(RPC_URL);
export const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Gets XLM balance for a given public key
 */
export async function getXlmBalance(publicKey: string): Promise<string> {
  try {
    const account = await horizonServer.loadAccount(publicKey);
    const balance = account.balances.find((b) => b.asset_type === 'native');
    return balance ? balance.balance : '0';
  } catch (error) {
    console.error('Error fetching balance:', error);
    return '0';
  }
}

/**
 * Prepares a contract call transaction
 */
export async function prepareContractCall(
  sourceAddress: string,
  functionName: string,
  args: any[]
): Promise<StellarSdk.Transaction> {
  // Fetch account sequence
  const sourceAccount = await rpcServer.getLatestLedger();
  const txSource = await horizonServer.loadAccount(sourceAddress);

  // Create transaction
  const spec = new StellarSdk.Address(sourceAddress);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(txSource, {
    fee: '10000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(functionName, ...args)
    )
    .setTimeout(30)
    .build();

  // Simulate transaction to get correct footprint & fees
  const simulated = await rpcServer.simulateTransaction(tx);
  if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  // Assemble transaction with simulation results
  const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simulated) as any as StellarSdk.Transaction;
  return assembledTx;
}

/**
 * Signs and submits a transaction using StellarWalletsKit and Soroban RPC
 */
export async function signAndSubmitTransaction(
  tx: StellarSdk.Transaction,
  walletName: string
): Promise<{ hash: string; status: string }> {
  // Sign transaction using the static StellarWalletsKit class
  const signed = await StellarWalletsKit.signTransaction(tx.toXDR(), {
    address: tx.source,
  });

  const signedXdr = signed.signedTxXdr;
  if (!signedXdr) {
    throw new Error('Failed to retrieve signed transaction from wallet');
  }

  const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE) as StellarSdk.Transaction;

  // Submit transaction
  const response = await rpcServer.sendTransaction(signedTx);
  if (response.status === 'PENDING') {
    // Poll for status
    let statusResponse = await rpcServer.getTransaction(response.hash);
    let attempts = 0;
    while (statusResponse.status === 'NOT_FOUND' || statusResponse.status === 'SUCCESS' && statusResponse.txHash !== response.hash) {
      if (attempts > 30) {
        throw new Error('Transaction polling timed out');
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      statusResponse = await rpcServer.getTransaction(response.hash);
      attempts++;
    }

    if (statusResponse.status === 'SUCCESS') {
      return { hash: response.hash, status: 'SUCCESS' };
    } else {
      throw new Error(`Transaction failed: ${statusResponse.status}`);
    }
  } else if (response.status === 'ERROR') {
    throw new Error('Transaction submission failed');
  }

  return { hash: response.hash, status: response.status };
}
