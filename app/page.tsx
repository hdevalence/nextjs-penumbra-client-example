'use client';
import { useConnect, useWalletManifests } from '@/app/hooks';
import { useInfo } from '@/app/fetchers';
import { PenumbraUIProvider } from '@penumbra-zone/ui/PenumbraUIProvider';
import { Density } from '@penumbra-zone/ui/Density';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
import { WalletBalance } from '@penumbra-zone/ui/WalletBalance';
import { AddressViewComponent } from '@penumbra-zone/ui/AddressViewComponent';

export default function Home() {
  const { data: wallets, loading } = useWalletManifests();
  const { connectionLoading, connected, onConnect, onDisconnect } = useConnect();
  const { address, balances } = useInfo(connected);

  return (
    <PenumbraUIProvider>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        {loading && <Text body>Wallets loading...</Text>}

        {!loading && !connected && (
          <ul className='flex flex-col gap-2'>
            {!Object.keys(wallets).length && (
              <Text body>
                No injected wallets found. Try{' '}
                <a className='underline'
                   href='https://chromewebstore.google.com/detail/prax-wallet/lkpmkhpnhknhmibgnmmhdhgdilepfghe'
                   target='_blank'>
                  installing Prax
                </a>
              </Text>
            )}

            {Object.entries(wallets).map(([origin, manifest]) => (
              <Button
                key={origin}
                onClick={() => onConnect(origin)}
                disabled={connectionLoading}
              >
                {connectionLoading ? 'Connecting...' : `Connect to ${manifest.name}`}
              </Button>
            ))}
          </ul>
        )}

        {connected && (
          <section className='flex flex-col gap-2'>
            <Text h3>Connected!</Text>
            <Density compact>
              <Button actionType='destructive' onClick={onDisconnect}>Disconnect</Button>
            </Density>

            <Text body>
              Your address is
              <AddressViewComponent addressView={address} />
            </Text>
            <Text h4>
              Balances
            </Text>
            <ul>
              {balances.map((balance, index) => (
                <WalletBalance key={index} balance={balance} />
              ))}
            </ul>
          </section>
        )}
      </main>
    </PenumbraUIProvider>
  );
}
