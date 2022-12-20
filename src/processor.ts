import { lookupArchive } from "@subsquid/archive-registry"
import * as ss58 from "@subsquid/ss58"
import {BatchContext, BatchProcessorItem, SubstrateBatchProcessor} from "@subsquid/substrate-processor"
import {Store, TypeormDatabase} from "@subsquid/typeorm-store"
import * as pair from "./abi/pair_contract"
import {Swap} from "./model/generated"
 
 
const CONTRACT_ADDRESS = 'XwtTDZimFantJgQeGaVeVHS5hoYon5kfnibAbSq8pEt8FwT'

 
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
