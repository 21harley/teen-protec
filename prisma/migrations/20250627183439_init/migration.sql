/*
  Warnings:

  - You are about to drop the column `cedula` on the `Tutor` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `Tutor` table. All the data in the column will be lost.
  - Added the required column `cedula_tutor` to the `Tutor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre_tutor` to the `Tutor` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tutor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cedula_tutor" TEXT NOT NULL,
    "nombre_tutor" TEXT NOT NULL,
    "profesion_tutor" TEXT,
    "telefono_contacto" TEXT,
    "correo_contacto" TEXT
);
INSERT INTO "new_Tutor" ("correo_contacto", "id", "profesion_tutor", "telefono_contacto") SELECT "correo_contacto", "id", "profesion_tutor", "telefono_contacto" FROM "Tutor";
DROP TABLE "Tutor";
ALTER TABLE "new_Tutor" RENAME TO "Tutor";
CREATE UNIQUE INDEX "Tutor_cedula_tutor_key" ON "Tutor"("cedula_tutor");
CREATE INDEX "Tutor_cedula_tutor_idx" ON "Tutor"("cedula_tutor");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
