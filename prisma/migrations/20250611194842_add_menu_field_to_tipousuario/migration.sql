-- AlterTable
ALTER TABLE "TipoUsuario" ADD COLUMN     "menu" JSONB[] DEFAULT ARRAY[]::JSONB[];
