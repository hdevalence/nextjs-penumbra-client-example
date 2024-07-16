import { ViewService } from '@penumbra-zone/protobuf';
import { createPenumbraClient } from '@penumbra-zone/client/create';
import { bech32mAddress } from '@penumbra-zone/bech32m/penumbra';
import { getMetadataFromBalancesResponseOptional, getAmount } from '@penumbra-zone/getters/balances-response';
import { useCallback, useEffect, useState } from 'react';

const createFetchClient = (wallet: string) => {
  return createPenumbraClient<typeof ViewService>(ViewService, wallet);
};

export const fetchAddress = async (wallet: string, account: number): Promise<string | undefined> => {
  const client = await createFetchClient(wallet);
  const res = await client.addressByIndex({ addressIndex: { account } });
  return res?.address && bech32mAddress(res.address);
};

// TODO: use the function from the types package – rn has an error in Next.js
const joinLoHi = (lo = 0n, hi = 0n): bigint => {
  return (hi << 64n) + lo;
};

export const fetchBalances = async (wallet: string, account: number): Promise<string[]> => {
  const client = await createFetchClient(wallet);
  const iterable = client.balances({ accountFilter: { account: account } });
  const balances = await Array.fromAsync(iterable);

  return balances.map((balance) => {
    const metadata = getMetadataFromBalancesResponseOptional(balance);
    const metadataSymbol = metadata?.symbol;
    const amount = getAmount(balance);

    if (metadataSymbol && amount) {
      const joinedAmount = joinLoHi(amount.lo, amount.hi).toString();
      return `${metadataSymbol}: ${joinedAmount}`;
    }
    return '';
  }).filter(Boolean);
};

export const useInfo = (connectedWallet?: string) => {
  const [address, setAddress] = useState<string>();
  const [balances, setBalances] = useState<string[]>([]);

  const fetchInfo = useCallback(async () => {
    if (!connectedWallet) {
      setAddress(undefined);
      setBalances([]);
    } else {
      setAddress(await fetchAddress(connectedWallet, 0));
      setBalances(await fetchBalances(connectedWallet, 0));
    }
  }, [connectedWallet, setAddress]);

  useEffect(() => {
    fetchInfo();
  }, [connectedWallet, fetchInfo]);

  return { address, balances };
};
