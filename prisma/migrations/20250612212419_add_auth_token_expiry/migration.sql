/*
  Warnings:

  - A unique constraint covering the columns `[resetPasswordToken]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "authTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" VARCHAR(255),
ADD COLUMN     "resetPasswordTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_resetPasswordToken_key" ON "Usuario"("resetPasswordToken");
