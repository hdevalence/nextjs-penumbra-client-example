import { useCallback, useEffect, useState } from 'react';
import { PenumbraInjection } from '@penumbra-zone/client';
import { assertGlobalPresent, assertProviderManifest, assertProvider } from '@penumbra-zone/client/create';
import { fetchAddress, fetchBalances } from '@/app/fetchers';

// This is not exported from Penumbra-zone or Prax
interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  icons: Record<'16' | '32' | '48' | '128' | string, string>;
  options_ui?: {
    page: string;
  };
  options_page?: string;
  homepage_url: string;
  manifest_version: number;
  key: string;
  minimum_chrome_version: string;
  action: unknown;
  content_scripts: unknown[];
  background: unknown;
  web_accessible_resources: unknown[];
  permissions: string[];
  host_permissions: string[];
  externally_connectable: unknown;
  content_security_policy: unknown;
}

interface WalletManifest extends ExtensionManifest {
  origin: string;
}

// A proposal function for @penumbra-zone/client
export const getWallets = () => {
  const injection = assertGlobalPresent();
  return Object.keys(injection);
};


// A proposal function for @penumbra-zone/react
export const useWallets = () => {
  const [wallets, setWallets] = useState<string[]>([]);

  useEffect(() => {
    setWallets(getWallets());
  }, []);

  return wallets;
};

// Right now, we can't fetch manifests from @penumbra-zone/client, especially with types
const fetchManifest = async (wallet: string): Promise<WalletManifest | undefined> => {
  try {
    const provider = assertProvider(wallet);
    const req = await fetch(provider.manifest);
    const manifest: ExtensionManifest = await req.json();
    return { ...manifest, origin: wallet };
  } catch (_) {
    return undefined;
  }
};

// Common react api for fetching wallet data to render the list of injected wallets
export const useWalletManifests = () => {
  const [manifests, setManifests] = useState<WalletManifest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchManifests = async () => {
    setLoading(true);
    const wallets = getWallets();
    const res = await Promise.all(wallets.map(fetchManifest));
    const manifests = res.filter(Boolean) as WalletManifest[];
    setManifests(manifests);
    setLoading(false);
  };

  useEffect(() => {
    fetchManifests();
  }, []);

  return { data: manifests, loading };
};

export const connectToWallet = async (origin: string) => {
  const provider = await assertProviderManifest(origin);

  return new Promise((resolve, reject) => {
    // Should use watchers and callbacks from the injection
    const interval = setInterval(() => {
      if (provider.isConnected()) {
        clearInterval(interval);
        resolve(true);
      }
    }, 10);

    setTimeout(() => {
      clearInterval(interval);
      reject(new Error('could not connect to the wallet'));
    }, 15000);

    provider.request();
  });
};

export const useConnect = () => {
  const [connectionLoading, setConnectionLoading] = useState<boolean>(false);
  const [connected, setConnected] = useState<string>();

  const [address, setAddress] = useState<string>();
  const [balances, setBalances] = useState<string[]>([]);

  // Auto connect to the wallet on page load
  useEffect(() => {
    const wallets = getWallets();
    const provider = wallets.find((wallet) => {
      try {
        const provider = assertProvider(wallet);
        return !!provider.isConnected();
      } catch (_) {
        return false;
      }
    });
    if (provider) {
      setConnected(provider);
    }
  }, []);

  const onConnect = async (origin: string) => {
    try {
      setConnectionLoading(true);
      await connectToWallet(origin);
      setConnected(origin);
    } catch (error) {
      setConnected(undefined);
    } finally {
      setConnectionLoading(false);
    }
  };

  const onDisconnect = async () => {
    if (!connected) return;
    try {
      const provider = assertProvider(connected);
      provider.disconnect;
      setConnected(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchInfo = useCallback(async () => {
    if (!connected) {
      setAddress(undefined);
      setBalances([]);
    } else {
      setAddress(await fetchAddress(connected, 0));
      setBalances(await fetchBalances(connected, 0));
    }
  }, [connected, setAddress]);

  useEffect(() => {
    fetchInfo();
  }, [connected, fetchInfo]);

  return {
    connectionLoading,
    connected,
    address,
    balances,
    onConnect,
    onDisconnect,
  }
};
