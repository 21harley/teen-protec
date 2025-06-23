/*
  Warnings:

  - You are about to drop the column `codigo_sesion` on the `Test` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Test_codigo_sesion_idx";

-- DropIndex
DROP INDEX "Test_codigo_sesion_key";

-- AlterTable
ALTER TABLE "Test" DROP COLUMN "codigo_sesion",
ADD COLUMN     "nombre" VARCHAR(50);

-- CreateIndex
CREATE INDEX "Test_nombre_idx" ON "Test"("nombre");
