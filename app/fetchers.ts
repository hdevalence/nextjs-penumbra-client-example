import { ViewService, jsonOptions } from '@penumbra-zone/protobuf';
import { createPromiseClient } from '@connectrpc/connect';
import { createChannelTransport } from '@penumbra-zone/transport-dom/create';
import { assertProvider } from '@penumbra-zone/client/create';
import { bech32mAddress } from '@penumbra-zone/bech32m/penumbra';
import { getMetadataFromBalancesResponseOptional, getAmount } from '@penumbra-zone/getters/balances-response';

const createFetchClient = (wallet: string) => {
  const provider = assertProvider(wallet);

  const getPort = () => provider.connect();

  return createPromiseClient<typeof ViewService>(ViewService, createChannelTransport({
    jsonOptions,
    getPort
  }));
};

export const fetchAddress = async (wallet: string, account: number): Promise<string | undefined> => {
  const client = createFetchClient(wallet);
  const res = await client.addressByIndex({ addressIndex: { account } });
  return res?.address && bech32mAddress(res.address);
};

export const fetchBalances = async (wallet: string, account: number): Promise<string[]> => {
  const client = createFetchClient(wallet);
  const iterable = client.balances({ accountFilter: { account: account } });
  const balances = await Array.fromAsync(iterable);
  return balances.map((balance) => {
    const metadataSymbol = getMetadataFromBalancesResponseOptional(balance)?.symbol;
    const amount = getAmount(balance);
    if (metadataSymbol && amount) {
      const joinedAmount = (amount.hi << 64n) + amount.lo;
      return `${metadataSymbol}: ${joinedAmount}`;
    }
    return '';
  });
};
