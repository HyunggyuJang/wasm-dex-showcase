import { lookupArchive } from "@subsquid/archive-registry"
import * as ss58 from "@subsquid/ss58"
import {BatchContext, BatchProcessorItem, BatchBlock, SubstrateBatchProcessor} from "@subsquid/substrate-processor"
import {Store, TypeormDatabase} from "@subsquid/typeorm-store"
import * as pair from "./abi/pair_contract"
import {Swap, Pair} from "./model/generated"
import { decodeAddress } from '@polkadot/keyring';
import { In } from "typeorm"
 

function toEvmEncodedNativeAddress(userAddress: string): string {
  const pubKey = Buffer.from(
    new Uint8Array([... decodeAddress(userAddress)]),
  ).toString('hex');
  return '0x' + pubKey;
}

const contracts = [
    'X5qYnkRQqotpvmvNocsPssxio3CXbZncsBp48gjozTJM1FF',
    'XwtTDZimFantJgQeGaVeVHS5hoYon5kfnibAbSq8pEt8FwT',
    'XnfGh7yGPPcFYvb8vLhPxE4poohVFQLrLS8WncwfcboNXhW',
].map(toEvmEncodedNativeAddress)
const CONTRACT_ADDRESS_TEST = '0x5207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c72'
console.log(toEvmEncodedNativeAddress(ss58.codec(5).encode(decodeAddress(CONTRACT_ADDRESS_TEST))) === CONTRACT_ADDRESS_TEST)

 
let processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: lookupArchive("shibuya", { release: "FireSquid" })
    })

contracts.forEach((contract) =>
    processor.addContractsContractEmitted(contract, {
        data: {
            event: { args: true }
        }
    } as const)
)


type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>
 
 
processor.run(new TypeormDatabase(), async ctx => {
    const txs = extractSwapRecords(ctx)

    let pairIds = new Set<string>()

    txs.forEach(tx => pairIds.add(tx.pair))

    let pairs = await ctx.store.findBy(Pair, {
        id: In([...pairIds])
    }).then((pairs) => new Map(pairs.map((p) => [p.id, p])))

    const swaps = txs.map(tx => {
        const pair = pairs.get(tx.pair) ?? new Pair({id: tx.pair})
        pairs.set(tx.pair, pair)
        const swap = new Swap({
            id: tx.id,
            pair: pair,
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

    await ctx.store.save([...pairs.values()])
    await ctx.store.insert(swaps)
})
 
 
interface SwapRecord {
    id: string
    pair: string
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
        for (const item of block.items as unknown as Array<BatchBlock<Item> & { name: string; event: any }>) {
            if (item.name === 'Contracts.ContractEmitted' && contracts.includes(item.event.args.contract)) {
                const event = pair.decodeEvent(item.event.args.data)
                if (event.__kind === 'Swap') {
                    records.push({
                        id: item.event.id,
                        pair: ss58.codec(5).encode(decodeAddress(item.event.args.contract)),
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
