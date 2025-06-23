-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('no_iniciado', 'en_progreso', 'completado');

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "estado" "TestStatus" NOT NULL DEFAULT 'no_iniciado',
ADD COLUMN     "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fecha_ultima_respuesta" TIMESTAMP(3),
ADD COLUMN     "progreso" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Test_id_psicologo_idx" ON "Test"("id_psicologo");

-- CreateIndex
CREATE INDEX "Test_id_usuario_idx" ON "Test"("id_usuario");

-- CreateIndex
CREATE INDEX "Test_codigo_sesion_idx" ON "Test"("codigo_sesion");

-- CreateIndex
CREATE INDEX "Test_fecha_creacion_idx" ON "Test"("fecha_creacion");

-- CreateIndex
CREATE INDEX "Test_estado_idx" ON "Test"("estado");
