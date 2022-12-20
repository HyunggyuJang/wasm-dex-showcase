module.exports = class Data1671507920160 {
  name = 'Data1671507920160'

  async up(db) {
    await db.query(`CREATE TABLE "pair" ("id" character varying NOT NULL, "volume_usd" numeric, CONSTRAINT "PK_3eaf216329c5c50aedb94fa797e" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "swap" ("id" character varying NOT NULL, "sender" text NOT NULL, "to" text NOT NULL, "amount0_in" numeric NOT NULL, "amount1_in" numeric NOT NULL, "amount0_out" numeric NOT NULL, "amount1_out" numeric NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block" integer NOT NULL, "pair_id" character varying, CONSTRAINT "PK_4a10d0f359339acef77e7f986d9" PRIMARY KEY ("id"))`)
    await db.query(`CREATE INDEX "IDX_3571ab1dad7640a6b93c705b8f" ON "swap" ("pair_id") `)
    await db.query(`ALTER TABLE "swap" ADD CONSTRAINT "FK_3571ab1dad7640a6b93c705b8f7" FOREIGN KEY ("pair_id") REFERENCES "pair"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  async down(db) {
    await db.query(`DROP TABLE "pair"`)
    await db.query(`DROP TABLE "swap"`)
    await db.query(`DROP INDEX "public"."IDX_3571ab1dad7640a6b93c705b8f"`)
    await db.query(`ALTER TABLE "swap" DROP CONSTRAINT "FK_3571ab1dad7640a6b93c705b8f7"`)
  }
}
