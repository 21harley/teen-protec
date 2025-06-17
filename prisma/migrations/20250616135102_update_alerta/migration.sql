-- AlterTable
ALTER TABLE "Alarma" ADD COLUMN     "fecha_vista" TIMESTAMP(0),
ADD COLUMN     "vista" BOOLEAN NOT NULL DEFAULT false;
