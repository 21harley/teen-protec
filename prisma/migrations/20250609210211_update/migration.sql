-- CreateTable
CREATE TABLE "TipoUsuario" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "TipoUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "cedula" VARCHAR(20) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "password_iv" VARCHAR(255) NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "id_tipo_usuario" INTEGER NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tutor" (
    "id" SERIAL NOT NULL,
    "cedula" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "profesion_tutor" VARCHAR(100),
    "telefono_contacto" VARCHAR(20),
    "correo_contacto" VARCHAR(255),

    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adolecente" (
    "id_usuario" INTEGER NOT NULL,
    "id_tutor" INTEGER,

    CONSTRAINT "Adolecente_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "Alarma" (
    "id" SERIAL NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "id_usuario" INTEGER,
    "mensaje" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alarma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Psicologo" (
    "id_usuario" INTEGER NOT NULL,
    "numero_de_titulo" VARCHAR(100),
    "nombre_universidad" VARCHAR(255),
    "monto_consulta" DOUBLE PRECISION,
    "telefono_trabajo" VARCHAR(20),

    CONSTRAINT "Psicologo_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" SERIAL NOT NULL,
    "id_psicologo" INTEGER,
    "id_usuario" INTEGER,
    "codigo_sesion" VARCHAR(50),

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoInput" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "valor" VARCHAR(255),

    CONSTRAINT "TipoInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pregunta" (
    "id" SERIAL NOT NULL,
    "id_test" INTEGER,
    "id_tipo_input" INTEGER,
    "texto_pregunta" TEXT NOT NULL,

    CONSTRAINT "Pregunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedSocialPsicologo" (
    "id" SERIAL NOT NULL,
    "id_psicologo" INTEGER,
    "nombre_red" VARCHAR(50) NOT NULL,
    "url_perfil" VARCHAR(255) NOT NULL,

    CONSTRAINT "RedSocialPsicologo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespuestaTest" (
    "id" SERIAL NOT NULL,
    "id_test" INTEGER,
    "id_pregunta" INTEGER,
    "id_usuario" INTEGER,
    "respuesta" TEXT,
    "fecha_respuesta" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespuestaTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoUsuario_nombre_key" ON "TipoUsuario"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cedula_key" ON "Usuario"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_cedula_key" ON "Tutor"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Test_codigo_sesion_key" ON "Test"("codigo_sesion");

-- CreateIndex
CREATE UNIQUE INDEX "TipoInput_nombre_key" ON "TipoInput"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "RedSocialPsicologo_id_psicologo_nombre_red_key" ON "RedSocialPsicologo"("id_psicologo", "nombre_red");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_id_tipo_usuario_fkey" FOREIGN KEY ("id_tipo_usuario") REFERENCES "TipoUsuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adolecente" ADD CONSTRAINT "Adolecente_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adolecente" ADD CONSTRAINT "Adolecente_id_tutor_fkey" FOREIGN KEY ("id_tutor") REFERENCES "Tutor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alarma" ADD CONSTRAINT "Alarma_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Psicologo" ADD CONSTRAINT "Psicologo_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_id_psicologo_fkey" FOREIGN KEY ("id_psicologo") REFERENCES "Psicologo"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregunta" ADD CONSTRAINT "Pregunta_id_test_fkey" FOREIGN KEY ("id_test") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregunta" ADD CONSTRAINT "Pregunta_id_tipo_input_fkey" FOREIGN KEY ("id_tipo_input") REFERENCES "TipoInput"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedSocialPsicologo" ADD CONSTRAINT "RedSocialPsicologo_id_psicologo_fkey" FOREIGN KEY ("id_psicologo") REFERENCES "Psicologo"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaTest" ADD CONSTRAINT "RespuestaTest_id_test_fkey" FOREIGN KEY ("id_test") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaTest" ADD CONSTRAINT "RespuestaTest_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "Pregunta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaTest" ADD CONSTRAINT "RespuestaTest_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
