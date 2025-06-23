/*
  Warnings:

  - You are about to drop the column `id_tipo_input` on the `Pregunta` table. All the data in the column will be lost.
  - You are about to drop the `RespuestaTest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TipoInput` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `id_tipo` to the `Pregunta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orden` to the `Pregunta` table without a default value. This is not possible if the table is not empty.
  - Made the column `id_test` on table `Pregunta` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Pregunta" DROP CONSTRAINT "Pregunta_id_test_fkey";

-- DropForeignKey
ALTER TABLE "Pregunta" DROP CONSTRAINT "Pregunta_id_tipo_input_fkey";

-- DropForeignKey
ALTER TABLE "RespuestaTest" DROP CONSTRAINT "RespuestaTest_id_pregunta_fkey";

-- DropForeignKey
ALTER TABLE "RespuestaTest" DROP CONSTRAINT "RespuestaTest_id_test_fkey";

-- DropForeignKey
ALTER TABLE "RespuestaTest" DROP CONSTRAINT "RespuestaTest_id_usuario_fkey";

-- AlterTable
ALTER TABLE "Pregunta" DROP COLUMN "id_tipo_input",
ADD COLUMN     "id_tipo" INTEGER NOT NULL,
ADD COLUMN     "max" INTEGER,
ADD COLUMN     "min" INTEGER,
ADD COLUMN     "obligatoria" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orden" INTEGER NOT NULL,
ADD COLUMN     "paso" INTEGER,
ADD COLUMN     "placeholder" VARCHAR(255),
ALTER COLUMN "id_test" SET NOT NULL;

-- DropTable
DROP TABLE "RespuestaTest";

-- DropTable
DROP TABLE "TipoInput";

-- CreateTable
CREATE TABLE "TipoPregunta" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,

    CONSTRAINT "TipoPregunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opcion" (
    "id" SERIAL NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "texto" VARCHAR(255) NOT NULL,
    "valor" VARCHAR(100) NOT NULL,
    "orden" INTEGER NOT NULL,
    "es_otro" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Opcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Respuesta" (
    "id" SERIAL NOT NULL,
    "id_test" INTEGER NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_opcion" INTEGER,
    "texto_respuesta" TEXT,
    "valor_rango" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Respuesta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoPregunta_nombre_key" ON "TipoPregunta"("nombre");

-- CreateIndex
CREATE INDEX "Respuesta_id_test_id_usuario_idx" ON "Respuesta"("id_test", "id_usuario");

-- CreateIndex
CREATE INDEX "Respuesta_id_pregunta_idx" ON "Respuesta"("id_pregunta");

-- AddForeignKey
ALTER TABLE "Pregunta" ADD CONSTRAINT "Pregunta_id_test_fkey" FOREIGN KEY ("id_test") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregunta" ADD CONSTRAINT "Pregunta_id_tipo_fkey" FOREIGN KEY ("id_tipo") REFERENCES "TipoPregunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opcion" ADD CONSTRAINT "Opcion_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "Pregunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respuesta" ADD CONSTRAINT "Respuesta_id_test_fkey" FOREIGN KEY ("id_test") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respuesta" ADD CONSTRAINT "Respuesta_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "Pregunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respuesta" ADD CONSTRAINT "Respuesta_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respuesta" ADD CONSTRAINT "Respuesta_id_opcion_fkey" FOREIGN KEY ("id_opcion") REFERENCES "Opcion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
