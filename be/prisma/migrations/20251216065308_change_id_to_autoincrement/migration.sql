/*
  Warnings:

  - The primary key for the `apis` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `apis` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `credentials` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `credentials` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `dynamic_settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `dynamic_settings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `merchants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `merchants` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `standard_payloads` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `standard_payloads` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `merchant_id` on the `apis` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `auth_id` on the `apis` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `merchant_id` on the `credentials` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `merchant_id` on the `dynamic_settings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `merchant_id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "apis" DROP CONSTRAINT "apis_auth_id_fkey";

-- DropForeignKey
ALTER TABLE "apis" DROP CONSTRAINT "apis_merchant_id_fkey";

-- DropForeignKey
ALTER TABLE "credentials" DROP CONSTRAINT "credentials_merchant_id_fkey";

-- DropForeignKey
ALTER TABLE "dynamic_settings" DROP CONSTRAINT "dynamic_settings_merchant_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_merchant_id_fkey";

-- AlterTable
ALTER TABLE "apis" DROP CONSTRAINT "apis_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "merchant_id",
ADD COLUMN     "merchant_id" INTEGER NOT NULL,
DROP COLUMN "auth_id",
ADD COLUMN     "auth_id" INTEGER NOT NULL,
ADD CONSTRAINT "apis_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "credentials" DROP CONSTRAINT "credentials_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "merchant_id",
ADD COLUMN     "merchant_id" INTEGER NOT NULL,
ADD CONSTRAINT "credentials_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "dynamic_settings" DROP CONSTRAINT "dynamic_settings_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "merchant_id",
ADD COLUMN     "merchant_id" INTEGER NOT NULL,
ADD CONSTRAINT "dynamic_settings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "merchants" DROP CONSTRAINT "merchants_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "merchants_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "standard_payloads" DROP CONSTRAINT "standard_payloads_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "standard_payloads_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "merchant_id",
ADD COLUMN     "merchant_id" INTEGER NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "dynamic_settings_merchant_id_key" ON "dynamic_settings"("merchant_id");

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apis" ADD CONSTRAINT "apis_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apis" ADD CONSTRAINT "apis_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dynamic_settings" ADD CONSTRAINT "dynamic_settings_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
