import { lookupArchive } from "@subsquid/archive-registry"
import * as ss58 from "@subsquid/ss58"
import {BatchContext, BatchProcessorItem, SubstrateBatchProcessor} from "@subsquid/substrate-processor"
import {Store, TypeormDatabase} from "@subsquid/typeorm-store"
import * as pair from "./abi/pair_contract"
import {Swap} from "./model/generated"
import { decodeAddress } from '@polkadot/keyring';
 

function toEvmEncodedNativeAddress(userAddress: string): string {
  const pubKey = Buffer.from(
    new Uint8Array([... decodeAddress(userAddress)]),
  ).toString('hex');
  return '0x' + pubKey;
}

const CONTRACT_ADDRESS = toEvmEncodedNativeAddress('XwtTDZimFantJgQeGaVeVHS5hoYon5kfnibAbSq8pEt8FwT')
const CONTRACT_ADDRESS_TEST = '0x5207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c72'
console.log(toEvmEncodedNativeAddress(ss58.codec(5).encode(decodeAddress(CONTRACT_ADDRESS_TEST))) === CONTRACT_ADDRESS_TEST)

 
const processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: lookupArchive("shibuya", { release: "FireSquid" })
    })
    .addContractsContractEmitted(CONTRACT_ADDRESS, {
        data: {
            event: {args: true}
        }
    } as const)
 
 
type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>
 
 
processor.run(new TypeormDatabase(), async ctx => {
    const txs = extractSwapRecords(ctx)

    const swaps = txs.map(tx => {
        const swap = new Swap({
            id: tx.id,
            sender: tx.sender,
            to: tx.to,
            amount0In: tx.amount0In,
            amount1In: tx.amount1In,
            amount0Out: tx.amount0Out,
            amount1Out: tx.amount1Out,
            timestamp: tx.timestamp,
            block: tx.block,
        })
        return swap
    })
 
    await ctx.store.insert(swaps)
})
 
 
interface SwapRecord {
    id: string
    sender: string
    to: string
    amount0In: bigint
    amount1In: bigint
    amount0Out: bigint
    amount1Out: bigint
    block: number
    timestamp: Date
}
 
 
function extractSwapRecords(ctx: Ctx): SwapRecord[] {
    const records: SwapRecord[] = []
    for (const block of ctx.blocks) {
        for (const item of block.items) {
            if (item.name === 'Contracts.ContractEmitted' && item.event.args.contract === CONTRACT_ADDRESS) {
                const event = pair.decodeEvent(item.event.args.data)
                if (event.__kind === 'Swap') {
                    records.push({
                        id: item.event.id,
                        sender: event.sender && ss58.codec(5).encode(event.sender),
                        to: event.to && ss58.codec(5).encode(event.to),
                        amount0In: event.amount0In,
                        amount1In: event.amount1In,
                        amount0Out: event.amount0Out,
                        amount1Out: event.amount1Out,
                        block: block.header.height,
                        timestamp: new Date(block.header.timestamp)
                    })
                }
            }
        }
    }
    return records
}
