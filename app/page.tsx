'use client';
import { useConnect, useWalletManifests } from '@/app/wrappers';

export default function Home() {
  const { data: wallets, loading } = useWalletManifests();
  const { address, balances, connectionLoading, connected, onConnect, onDisconnect } = useConnect();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {loading && <p>Wallets loading...</p>}

      {!loading && !connected && (
        <ul>
          {wallets.map((wallet) => (
            <button
              type="button"
              key={wallet.origin}
              disabled={connectionLoading}
              className='border rounded cursor-pointer border-gray-300 px-4 py-2 hover:bg-gray-800 transition'
              onClick={() => onConnect(wallet.origin)}
            >
              {connectionLoading ? 'Connecting...' : `Connect to ${wallet.name}`}
            </button>
          ))}
        </ul>
      )}

      {connected && (
        <section>
          <h3 className='text-lg font-bold'>Connected!</h3>
          <button
            type="button"
            className='mt-2 mb-4 border rounded cursor-pointer border-gray-300 px-4 py-2 hover:bg-gray-800 transition'
            onClick={onDisconnect}
          >
            Disconnect
          </button>

          <p className='mb-4'>Your address is {address}</p>
          <p>Balances</p>
          <ul>
            {balances.map((balance, index) => (
              <li key={index}>{balance}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
