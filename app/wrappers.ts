import { useCallback, useEffect, useState } from 'react';
import { assertGlobalPresent, assertProvider, assertProviderManifest } from '@penumbra-zone/client/assert';
import { type PenumbraManifest, isPenumbraManifest } from '@penumbra-zone/client/manifest';
import { fetchAddress, fetchBalances } from '@/app/fetchers';

// Retrieve injected wallet origins
export const getWallets = () => {
  const injection = assertGlobalPresent();
  return Object.keys(injection);
};

type PenumbraManifests = Record<string, PenumbraManifest>

// Send requests to the wallet origin (browser extension URL) and retrieve the manifest
const fetchManifests = async (): Promise<PenumbraManifests> => {
  const wallets = getWallets();

  const manifests: PenumbraManifests = {};
  await Promise.all(wallets.map(async (origin) => {
    try {
      const manifest = await assertProviderManifest(origin) as PenumbraManifest;

      // Filter out non-penumbra manifests
      if (isPenumbraManifest(manifest)) {
        manifests[origin] = manifest;
      }
    } catch (_) {
      return;
    }
  }));

  return manifests;

};

// Common react api for fetching wallet data to render the list of injected wallets
export const useWalletManifests = () => {
  const [manifests, setManifests] = useState<PenumbraManifests>({});
  const [loading, setLoading] = useState<boolean>(false);

  const loadManifests = async () => {
    setLoading(true);
    setManifests(await fetchManifests());
    setLoading(false);
  };

  useEffect(() => {
    loadManifests();
  }, []);

  return { data: manifests, loading };
};

export const connectToWallet = (origin: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider = await assertProvider(origin);

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
    } catch (error) {
      reject(error);
    }
  });
};

export const useConnect = () => {
  const [connectionLoading, setConnectionLoading] = useState<boolean>(false);
  const [connected, setConnected] = useState<string>();

  const [address, setAddress] = useState<string>();
  const [balances, setBalances] = useState<string[]>([]);

  // Finds already connected wallet
  const reconnectToWallet = async () => {
    const wallets = getWallets();

    const provider = await Promise.race(wallets.map(async (wallet) => {
      try {
        const provider = await assertProvider(wallet);
        return provider.isConnected() ? provider : undefined;
      } catch (_) {
        return undefined;
      }
    }));
    setConnected(provider?.manifest);
  };

  // Auto connect to the wallet on page load
  useEffect(() => {
    reconnectToWallet();
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
      const provider = await assertProvider(connected);
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
