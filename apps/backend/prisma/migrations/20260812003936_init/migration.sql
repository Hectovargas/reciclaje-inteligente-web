-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('ACTIVE', 'WARNING', 'OFFLINE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" "StationStatus" NOT NULL DEFAULT 'ACTIVE',
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "token" TEXT,
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_clasificacion" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "confianza" DOUBLE PRECISION NOT NULL,
    "stationId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_clasificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_tokens" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "firma" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "zones_name_key" ON "zones"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stations_token_key" ON "stations"("token");

-- CreateIndex
CREATE INDEX "stations_zoneId_idx" ON "stations"("zoneId");

-- CreateIndex
CREATE INDEX "eventos_clasificacion_timestamp_idx" ON "eventos_clasificacion"("timestamp");

-- CreateIndex
CREATE INDEX "eventos_clasificacion_stationId_idx" ON "eventos_clasificacion"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "qr_tokens_codigo_key" ON "qr_tokens"("codigo");

-- CreateIndex
CREATE INDEX "qr_tokens_codigo_idx" ON "qr_tokens"("codigo");

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_clasificacion" ADD CONSTRAINT "eventos_clasificacion_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
