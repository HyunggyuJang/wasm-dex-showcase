import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Pair} from "./pair.model"

@Entity_()
export class Swap {
  constructor(props?: Partial<Swap>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Index_()
  @ManyToOne_(() => Pair, {nullable: true})
  pair!: Pair

  @Column_("text", {nullable: false})
  sender!: string

  @Column_("text", {nullable: false})
  to!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  amount0In!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  amount1In!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  amount0Out!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  amount1Out!: bigint

  @Column_("timestamp with time zone", {nullable: false})
  timestamp!: Date

  @Column_("int4", {nullable: false})
  block!: number
}
