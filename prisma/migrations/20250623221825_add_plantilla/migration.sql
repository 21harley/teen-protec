-- CreateTable
CREATE TABLE "TestPlantilla" (
    "id" SERIAL NOT NULL,
    "id_psicologo" INTEGER,
    "nombre" VARCHAR(50) NOT NULL,
    "estado" "TestStatus" NOT NULL DEFAULT 'no_iniciado',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestPlantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreguntaPlantilla" (
    "id" SERIAL NOT NULL,
    "id_test" INTEGER NOT NULL,
    "id_tipo" INTEGER NOT NULL,
    "texto_pregunta" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "obligatoria" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" VARCHAR(255),
    "min" INTEGER,
    "max" INTEGER,
    "paso" INTEGER,

    CONSTRAINT "PreguntaPlantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpcionPlantilla" (
    "id" SERIAL NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "texto" VARCHAR(255) NOT NULL,
    "valor" VARCHAR(100) NOT NULL,
    "orden" INTEGER NOT NULL,
    "es_otro" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OpcionPlantilla_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestPlantilla_id_psicologo_idx" ON "TestPlantilla"("id_psicologo");

-- CreateIndex
CREATE INDEX "TestPlantilla_nombre_idx" ON "TestPlantilla"("nombre");

-- AddForeignKey
ALTER TABLE "TestPlantilla" ADD CONSTRAINT "TestPlantilla_id_psicologo_fkey" FOREIGN KEY ("id_psicologo") REFERENCES "Psicologo"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreguntaPlantilla" ADD CONSTRAINT "PreguntaPlantilla_id_test_fkey" FOREIGN KEY ("id_test") REFERENCES "TestPlantilla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreguntaPlantilla" ADD CONSTRAINT "PreguntaPlantilla_id_tipo_fkey" FOREIGN KEY ("id_tipo") REFERENCES "TipoPregunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpcionPlantilla" ADD CONSTRAINT "OpcionPlantilla_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "PreguntaPlantilla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
