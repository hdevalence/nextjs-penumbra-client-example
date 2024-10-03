import prisma from '../lib/prisma'
import BlockDetails from './components/BlockDetails'

async function getLatestBlockDetails() {
  const latestBlock = await prisma.block_details.findFirst({
    orderBy: {
      height: 'desc'
    }
  })
  return latestBlock
}

export default async function Home() {
  const latestBlock = await getLatestBlockDetails()

  // Convert Date and Buffer to serializable formats
  const serializedBlock = latestBlock ? {
    ...latestBlock,
    timestamp: latestBlock.timestamp.toISOString(),
    root: latestBlock.root.toString('hex'),
  } : null;

  return <BlockDetails latestBlock={serializedBlock} />
}
