module.exports = class Data1671506043702 {
  name = 'Data1671506043702'

  async up(db) {
    await db.query(`CREATE TABLE "pair" ("id" character varying NOT NULL, "volume_usd" numeric NOT NULL, CONSTRAINT "PK_3eaf216329c5c50aedb94fa797e" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "swap" ("id" character varying NOT NULL, "sender" text NOT NULL, "to" text NOT NULL, "amount0_in" numeric NOT NULL, "amount1_in" numeric NOT NULL, "amount0_out" numeric NOT NULL, "amount1_out" numeric NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block" integer NOT NULL, CONSTRAINT "PK_4a10d0f359339acef77e7f986d9" PRIMARY KEY ("id"))`)
  }

  async down(db) {
    await db.query(`DROP TABLE "pair"`)
    await db.query(`DROP TABLE "swap"`)
  }
}
