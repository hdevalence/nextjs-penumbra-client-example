import { ViewService } from '@penumbra-zone/protobuf';
import { createPenumbraClient } from '@penumbra-zone/client/create';
import { bech32mAddress } from '@penumbra-zone/bech32m/penumbra';
import { getMetadataFromBalancesResponseOptional, getAmount } from '@penumbra-zone/getters/balances-response';

const createFetchClient = (wallet: string) => {
  return createPenumbraClient<typeof ViewService>(ViewService, wallet);
};

export const fetchAddress = async (wallet: string, account: number): Promise<string | undefined> => {
  const client = await createFetchClient(wallet);
  const res = await client.addressByIndex({ addressIndex: { account } });
  return res?.address && bech32mAddress(res.address);
};

export const fetchBalances = async (wallet: string, account: number): Promise<string[]> => {
  const client = await createFetchClient(wallet);
  const iterable = client.balances({ accountFilter: { account: account } });
  const balances = await Array.fromAsync(iterable);

  return balances.map((balance) => {
    const metadata = getMetadataFromBalancesResponseOptional(balance);
    const metadataSymbol = metadata?.symbol;
    const amount = getAmount(balance);

    // Filter out assets with low priority score and leave only native and registered assets
    if (metadataSymbol && amount && metadata.priorityScore >= 40n) {
      const joinedAmount = (amount.hi << 64n) + amount.lo;
      return `${metadataSymbol}: ${joinedAmount}`;
    }
    return '';
  });
};
