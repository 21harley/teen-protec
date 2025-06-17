/*
  Warnings:

  - You are about to drop the column `tipo` on the `Alarma` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Alarma" DROP COLUMN "tipo",
ADD COLUMN     "id_tipo_alerta" INTEGER;

-- CreateTable
CREATE TABLE "TipoAlerta" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "TipoAlerta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoAlerta_nombre_key" ON "TipoAlerta"("nombre");

-- AddForeignKey
ALTER TABLE "Alarma" ADD CONSTRAINT "Alarma_id_tipo_alerta_fkey" FOREIGN KEY ("id_tipo_alerta") REFERENCES "TipoAlerta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
