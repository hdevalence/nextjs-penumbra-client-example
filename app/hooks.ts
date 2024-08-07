import { useEffect, useState } from 'react';
import { PenumbraRequestFailure, PenumbraManifest } from '@penumbra-zone/client';
import { client } from './penumbra';

// Common react api for fetching wallet data to render the list of injected wallets
export const useWalletManifests = () => {
  const [manifests, setManifests] = useState<Record<string, PenumbraManifest>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const loadManifests = async () => {
    setLoading(true);
    const res = client.getProviderManifests();
    const resolvedManifests = await Promise.all(
      Object.entries(res).map(async ([key, promise]) => {
        const value = await promise;
        return [key, value];
      })
    );
    setManifests(Object.fromEntries(resolvedManifests));
    setLoading(false);
  };

  useEffect(() => {
    loadManifests();
  }, []);

  return { data: manifests, loading };
};

export const useConnect = () => {
  const [connectionLoading, setConnectionLoading] = useState<boolean>(false);
  const [connected, setConnected] = useState<string>();

  const reconnect = async () => {
    const providers = client.getProviders();
    const connected = providers.find((origin) => client.getProviderIsConnected(origin));
    if (!connected) return;
    try {
      await client.connect(connected);
      setConnected(connected);
    } catch (error) {
      /* no-op */
    }
  };

  const onConnect = async (origin: string) => {
    try {
      setConnectionLoading(true);
      await client.connect(origin);
    } catch (error) {
      if (error instanceof Error && error.cause) {
        if (error.cause === PenumbraRequestFailure.Denied) {
          alert('Connection denied: you may need to un-ignore this site in your extension settings.');
        }
        if (error.cause === PenumbraRequestFailure.NeedsLogin) {
          alert('Not logged in: please login into the extension and try again');
        }
      }
    } finally {
      setConnectionLoading(false);
    }
  };

  const onDisconnect = async () => {
    if (!client.isConnected()) return;
    try {
      await client.disconnect();
    } catch (error) {
      console.error(error);
    }
  };

  // Monitors the connection
  useEffect(() => {
    // If Prax is connected on page load, reconnect to ensure the connection is still active
    reconnect();
    client.onConnectionChange((event) => {
      if (event.connected) {
        setConnected(event.origin);
      } else {
        setConnected(undefined);
      }
    });
  }, []);

  return {
    connectionLoading,
    connected,
    onConnect,
    onDisconnect,
  }
};
