'use client';

import { Text } from '@penumbra-zone/ui/Text'
import { PenumbraUIProvider } from '@penumbra-zone/ui/PenumbraUIProvider';

type BlockDetailsProps = {
  latestBlock: {
    height: string;
    timestamp: string;
    root: string;
  } | null;
}

export default function BlockDetails({ latestBlock }: BlockDetailsProps) {
  return (
    <PenumbraUIProvider>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <section className="mb-8">
          <Text h1>Penumbra Block Explorer</Text>
          {latestBlock ? (
            <>
              <Text h3>Latest Block Details</Text>
              <Text body>Height: {latestBlock.height}</Text>
              <Text body>Timestamp: {latestBlock.timestamp}</Text>
              <Text body>Root: {latestBlock.root}</Text>
            </>
          ) : (
            <Text body>No block details available</Text>
          )}
        </section>
      </main>
    </PenumbraUIProvider>
  );
}