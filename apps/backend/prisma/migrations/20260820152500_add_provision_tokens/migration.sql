-- CreateTable
CREATE TABLE "provision_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "mac_asociada" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provision_tokens_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "stations" ALTER COLUMN "status" SET DEFAULT 'PENDING_ACTIVATION';

-- CreateIndex
CREATE UNIQUE INDEX "provision_tokens_token_key" ON "provision_tokens"("token");

-- CreateIndex
CREATE INDEX "provision_tokens_token_idx" ON "provision_tokens"("token");

-- CreateIndex
CREATE INDEX "provision_tokens_station_id_idx" ON "provision_tokens"("station_id");

-- AddForeignKey
ALTER TABLE "provision_tokens" ADD CONSTRAINT "provision_tokens_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
