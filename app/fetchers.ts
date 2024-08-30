import { useCallback, useEffect, useState } from 'react';
import { BalancesResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { ViewService } from '@penumbra-zone/protobuf';
import { getAmount, getMetadataFromBalancesResponseOptional } from '@penumbra-zone/getters/balances-response';
import { client } from './penumbra';
import { AddressView } from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';


export const fetchAddress = async (account: number): Promise<AddressView | undefined> => {
  const viewService = client.service(ViewService);
  const res = await viewService.addressByIndex({ addressIndex: { account } });
  if (!res?.address) {
    return undefined;
  }
  return new AddressView({
    addressView: {
      case: 'decoded',
      value: res,
    },
  });
};

export const fetchBalances = async (account: number): Promise<BalancesResponse[]> => {
  const viewService = client.service(ViewService);
  const iterable = viewService.balances({ accountFilter: { account: account } });
  const balances = await Array.fromAsync(iterable);

  return balances.filter((balance) => {
    const metadata = getMetadataFromBalancesResponseOptional(balance);
    const metadataSymbol = metadata?.symbol;
    const amount = getAmount(balance);

    return metadataSymbol && amount;
  });
};

export const useInfo = (connectedWallet?: string) => {
  const [address, setAddress] = useState<AddressView>();
  const [balances, setBalances] = useState<BalancesResponse[]>([]);

  const fetchInfo = useCallback(async () => {
    if (!connectedWallet) {
      setAddress(undefined);
      setBalances([]);
    } else {
      setAddress(await fetchAddress(0));
      setBalances(await fetchBalances(0));
    }
  }, [connectedWallet, setAddress]);

  useEffect(() => {
    fetchInfo();
  }, [connectedWallet, fetchInfo]);

  return { address, balances };
};
