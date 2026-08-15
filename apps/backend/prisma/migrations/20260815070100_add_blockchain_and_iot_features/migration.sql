-- CreateEnum
CREATE TYPE "BlockchainEventStatus" AS ENUM ('PENDING', 'BATCHED', 'CONFIRMED', 'FAILED');

-- AlterTable
ALTER TABLE "stations" ADD COLUMN     "deviceSecret" TEXT,
ADD COLUMN     "lastPingAt" TIMESTAMP(3),
ADD COLUMN     "macAddress" TEXT,
ADD COLUMN     "provisioningToken" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authTag" TEXT,
ADD COLUMN     "encryptedPrivateKey" TEXT,
ADD COLUMN     "iv" TEXT,
ADD COLUMN     "walletAddress" TEXT,
ALTER COLUMN "role" SET DEFAULT 'USER';

-- CreateTable
CREATE TABLE "telemetrias" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "nivelPapel" DOUBLE PRECISION NOT NULL,
    "nivelPlastico" DOUBLE PRECISION NOT NULL,
    "nivelMetal" DOUBLE PRECISION NOT NULL,
    "bateria" DOUBLE PRECISION NOT NULL,
    "temperatura" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetrias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_events" (
    "id" TEXT NOT NULL,
    "txHash" TEXT,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "BlockchainEventStatus" NOT NULL DEFAULT 'PENDING',
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blockchain_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "telemetrias_stationId_idx" ON "telemetrias"("stationId");

-- CreateIndex
CREATE INDEX "telemetrias_timestamp_idx" ON "telemetrias"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_events_txHash_key" ON "blockchain_events"("txHash");

-- CreateIndex
CREATE INDEX "blockchain_events_fromAddress_idx" ON "blockchain_events"("fromAddress");

-- CreateIndex
CREATE INDEX "blockchain_events_toAddress_idx" ON "blockchain_events"("toAddress");

-- CreateIndex
CREATE INDEX "blockchain_events_batchId_idx" ON "blockchain_events"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "stations_macAddress_key" ON "stations"("macAddress");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- AddForeignKey
ALTER TABLE "telemetrias" ADD CONSTRAINT "telemetrias_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
