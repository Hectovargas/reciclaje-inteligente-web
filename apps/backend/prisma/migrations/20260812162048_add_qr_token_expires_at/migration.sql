/*
  Warnings:

  - Added the required column `expiresAt` to the `qr_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "qr_tokens" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;
