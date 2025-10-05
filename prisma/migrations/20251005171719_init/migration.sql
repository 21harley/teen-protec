-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "password_iv" TEXT NOT NULL,
    "fecha_nacimiento" DATETIME NOT NULL,
    "sexo" TEXT,
    "id_tipo_usuario" INTEGER NOT NULL,
    "id_psicologo" INTEGER,
    "authToken" TEXT,
    "authTokenExpiry" DATETIME,
    "resetPasswordToken" TEXT,
    "resetPasswordTokenExpiry" DATETIME,
    CONSTRAINT "Usuario_id_tipo_usuario_fkey" FOREIGN KEY ("id_tipo_usuario") REFERENCES "TipoUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Usuario_id_psicologo_fkey" FOREIGN KEY ("id_psicologo") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tutor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cedula_tutor" TEXT NOT NULL,
    "nombre_tutor" TEXT NOT NULL,
    "profesion_tutor" TEXT,
    "telefono_contacto" TEXT,
    "correo_contacto" TEXT,
    "sexo" TEXT,
    "parentesco" TEXT
);

-- CreateTable
CREATE TABLE "Test" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'NO_INICIADO',
    "peso_preguntas" TEXT NOT NULL DEFAULT 'SIN_VALOR',
    "config_baremo" JSONB,
    "valor_total" REAL,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ultima_respuesta" DATETIME,
    "id_psicologo" INTEGER,
    "id_usuario" INTEGER,
    "evaluado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_evaluacion" DATETIME,
    "ponderacion_final" REAL,
    "comentarios_psicologo" TEXT,
    "interp_resul_sis" TEXT,
    CONSTRAINT "Test_id_psicologo_fkey" FOREIGN KEY ("id_psicologo") REFERENCES "Psicologo" ("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Test_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pregunta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_test" INTEGER NOT NULL,
    "id_tipo" INTEGER NOT NULL,
    "id_gru_pre" INTEGER,
    "texto_pregunta" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "obligatoria" BOOLEAN NOT NULL DEFAULT false,
    "peso" REAL,
    "baremo_detalle" JSONB,
    "placeholder" TEXT,
    "min" INTEGER,
    "max" INTEGER,
    "paso" INTEGER,
    "eva_psi" INTEGER,
    CONSTRAINT "Pregunta_id_test_fkey" FOREIGN KEY ("id_test") REFERENCES "Test" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pregunta_id_tipo_fkey" FOREIGN KEY ("id_tipo") REFERENCES "TipoPregunta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pregunta_id_gru_pre_fkey" FOREIGN KEY ("id_gru_pre") REFERENCES "GrupoPregunta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrupoPregunta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "total_resp_valida" INTEGER,
    "total_resp" INTEGER,
    "interpretacion" TEXT
);

-- CreateTable
CREATE TABLE "TestPlantilla" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_psicologo" INTEGER,
    "nombre" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'NO_INICIADO',
    "peso_preguntas" TEXT NOT NULL DEFAULT 'SIN_VALOR',
    "config_baremo" JSONB,
    "valor_total" REAL,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "es_global" BOOLEAN DEFAULT false,
    CONSTRAINT "TestPlantilla_id_psicologo_fkey" FOREIGN KEY ("id_psicologo") REFERENCES "Psicologo" ("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PreguntaPlantilla" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_test" INTEGER NOT NULL,
    "id_tipo" INTEGER NOT NULL,
    "id_gru_pre" INTEGER,
    "texto_pregunta" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "obligatoria" BOOLEAN NOT NULL DEFAULT false,
    "peso" REAL,
    "baremo_detalle" JSONB,
    "placeholder" TEXT,
    "min" INTEGER,
    "max" INTEGER,
    "paso" INTEGER,
    "eva_psi" INTEGER,
    CONSTRAINT "PreguntaPlantilla_id_test_fkey" FOREIGN KEY ("id_test") REFERENCES "TestPlantilla" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PreguntaPlantilla_id_tipo_fkey" FOREIGN KEY ("id_tipo") REFERENCES "TipoPregunta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PreguntaPlantilla_id_gru_pre_fkey" FOREIGN KEY ("id_gru_pre") REFERENCES "GrupoPreguntaPlantilla" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrupoPreguntaPlantilla" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "total_resp_valida" INTEGER,
    "total_resp" INTEGER,
    "interpretacion" TEXT
);

-- CreateTable
CREATE TABLE "TipoUsuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "menu" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "TipoPregunta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo_respuesta" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TipoAlerta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "url_destino" TEXT,
    "id_tipo_usuario" INTEGER,
    CONSTRAINT "TipoAlerta_id_tipo_usuario_fkey" FOREIGN KEY ("id_tipo_usuario") REFERENCES "TipoUsuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Adolecente" (
    "id_usuario" INTEGER NOT NULL,
    "id_tutor" INTEGER,
    CONSTRAINT "Adolecente_id_tutor_fkey" FOREIGN KEY ("id_tutor") REFERENCES "Tutor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Adolecente_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alarma" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_usuario" INTEGER,
    "id_tipo_alerta" INTEGER,
    "mensaje" TEXT NOT NULL,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vista" DATETIME,
    "vista" BOOLEAN NOT NULL DEFAULT false,
    "correo_enviado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Alarma_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Alarma_id_tipo_alerta_fkey" FOREIGN KEY ("id_tipo_alerta") REFERENCES "TipoAlerta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Psicologo" (
    "id_usuario" INTEGER NOT NULL,
    "numero_de_titulo" TEXT,
    "nombre_universidad" TEXT,
    "monto_consulta" REAL,
    "telefono_trabajo" TEXT,
    CONSTRAINT "Psicologo_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Opcion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_pregunta" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "es_otro" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Opcion_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "Pregunta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Respuesta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_test" INTEGER NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_opcion" INTEGER,
    "texto_respuesta" TEXT,
    "valor_rango" INTEGER,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Respuesta_id_test_fkey" FOREIGN KEY ("id_test") REFERENCES "Test" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Respuesta_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "Pregunta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Respuesta_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Respuesta_id_opcion_fkey" FOREIGN KEY ("id_opcion") REFERENCES "Opcion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RedSocialPsicologo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_psicologo" INTEGER NOT NULL,
    "nombre_red" TEXT NOT NULL,
    "url_perfil" TEXT NOT NULL,
    CONSTRAINT "RedSocialPsicologo_id_psicologo_fkey" FOREIGN KEY ("id_psicologo") REFERENCES "Psicologo" ("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpcionPlantilla" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_pregunta" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "es_otro" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "OpcionPlantilla_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "PreguntaPlantilla" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" DATETIME NOT NULL,
    "fecha_fin" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" DATETIME NOT NULL,
    "id_psicologo" INTEGER NOT NULL,
    "id_paciente" INTEGER,
    "id_tipo_cita" INTEGER,
    "duracion_real" INTEGER,
    "notas_psicologo" TEXT,
    CONSTRAINT "Cita_id_psicologo_fkey" FOREIGN KEY ("id_psicologo") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cita_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cita_id_tipo_cita_fkey" FOREIGN KEY ("id_tipo_cita") REFERENCES "TipoCita" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TipoCita" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracion" INTEGER NOT NULL DEFAULT 30,
    "color_calendario" TEXT
);

-- CreateTable
CREATE TABLE "RecordatorioCita" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_cita" INTEGER NOT NULL,
    "metodo" TEXT NOT NULL,
    "fecha_envio" DATETIME NOT NULL,
    "estado" TEXT NOT NULL,
    CONSTRAINT "RecordatorioCita_id_cita_fkey" FOREIGN KEY ("id_cita") REFERENCES "Cita" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroUsuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "fecha_registro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sexo" TEXT NOT NULL,
    "fecha_nacimiento" DATETIME,
    "tipo_usuario" TEXT NOT NULL,
    "psicologo_id" INTEGER,
    "tests_ids" JSONB,
    "total_tests" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "RegistroTrazabilidad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "registro_usuario_id" INTEGER NOT NULL,
    "psicologo_id" INTEGER NOT NULL,
    "fecha_inicio" DATETIME NOT NULL,
    "fecha_fin" DATETIME,
    "secuencia" INTEGER NOT NULL,
    CONSTRAINT "RegistroTrazabilidad_registro_usuario_id_fkey" FOREIGN KEY ("registro_usuario_id") REFERENCES "RegistroUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroSesion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "registro_usuario_id" INTEGER NOT NULL,
    "fecha_inicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" DATETIME,
    "duracion" INTEGER,
    "ip_address" TEXT,
    "user_agent" TEXT,
    CONSTRAINT "RegistroSesion_registro_usuario_id_fkey" FOREIGN KEY ("registro_usuario_id") REFERENCES "RegistroUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroMetricaUsuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "registro_usuario_id" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tests_asignados" INTEGER NOT NULL,
    "tests_completados" INTEGER NOT NULL,
    "tests_evaluados" INTEGER NOT NULL,
    "sesiones_totales" INTEGER NOT NULL,
    CONSTRAINT "RegistroMetricaUsuario_registro_usuario_id_fkey" FOREIGN KEY ("registro_usuario_id") REFERENCES "RegistroUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroTest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "test_id" INTEGER NOT NULL,
    "usuario_id" INTEGER,
    "psicologo_id" INTEGER,
    "fecha_creacion" DATETIME NOT NULL,
    "fecha_completado" DATETIME,
    "estado" TEXT NOT NULL,
    "nombre_test" TEXT,
    "valor_total" REAL,
    "nota_psicologo" REAL,
    "evaluado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_evaluacion" DATETIME,
    "interp_resul_sis" TEXT
);

-- CreateTable
CREATE TABLE "RegistroReporte" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "parametros" JSONB NOT NULL,
    "fecha_generacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generado_por_id" INTEGER,
    "formato" TEXT NOT NULL,
    "ruta_almacenamiento" TEXT
);

-- CreateTable
CREATE TABLE "RegistroCita" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cita_id" INTEGER NOT NULL,
    "fecha_registro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_psicologo" INTEGER NOT NULL,
    "nombre_psicologo" TEXT NOT NULL,
    "id_paciente" INTEGER,
    "nombre_paciente" TEXT,
    "fecha_cita" DATETIME NOT NULL,
    "duracion_planeada" INTEGER NOT NULL,
    "duracion_real" INTEGER,
    "estado" TEXT NOT NULL,
    "tipo_cita" TEXT,
    "color_calendario" TEXT,
    "tiempo_confirmacion" INTEGER,
    "cancelado_por" TEXT,
    "motivo_cancelacion" TEXT,
    "registro_usuario_id" INTEGER
);

-- CreateTable
CREATE TABLE "RegistroMetricaCitas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodo" TEXT NOT NULL,
    "citas_totales" INTEGER NOT NULL,
    "citas_completadas" INTEGER NOT NULL,
    "citas_canceladas" INTEGER NOT NULL,
    "tasa_confirmacion" REAL NOT NULL,
    "tiempo_promedio_confirmacion" INTEGER NOT NULL,
    "duracion_promedio" REAL NOT NULL,
    "tipos_cita" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cedula_key" ON "Usuario"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_resetPasswordToken_key" ON "Usuario"("resetPasswordToken");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_cedula_idx" ON "Usuario"("cedula");

-- CreateIndex
CREATE INDEX "Usuario_id_psicologo_idx" ON "Usuario"("id_psicologo");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_cedula_tutor_key" ON "Tutor"("cedula_tutor");

-- CreateIndex
CREATE INDEX "Tutor_cedula_tutor_idx" ON "Tutor"("cedula_tutor");

-- CreateIndex
CREATE INDEX "Test_id_psicologo_idx" ON "Test"("id_psicologo");

-- CreateIndex
CREATE INDEX "Test_id_usuario_idx" ON "Test"("id_usuario");

-- CreateIndex
CREATE INDEX "Pregunta_id_test_idx" ON "Pregunta"("id_test");

-- CreateIndex
CREATE INDEX "TestPlantilla_id_psicologo_idx" ON "TestPlantilla"("id_psicologo");

-- CreateIndex
CREATE INDEX "PreguntaPlantilla_id_test_idx" ON "PreguntaPlantilla"("id_test");

-- CreateIndex
CREATE UNIQUE INDEX "TipoUsuario_nombre_key" ON "TipoUsuario"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "TipoPregunta_nombre_key" ON "TipoPregunta"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "TipoAlerta_nombre_key" ON "TipoAlerta"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Adolecente_id_usuario_key" ON "Adolecente"("id_usuario");

-- CreateIndex
CREATE INDEX "Alarma_id_usuario_idx" ON "Alarma"("id_usuario");

-- CreateIndex
CREATE INDEX "Alarma_fecha_creacion_idx" ON "Alarma"("fecha_creacion");

-- CreateIndex
CREATE INDEX "Alarma_vista_idx" ON "Alarma"("vista");

-- CreateIndex
CREATE UNIQUE INDEX "Psicologo_id_usuario_key" ON "Psicologo"("id_usuario");

-- CreateIndex
CREATE INDEX "Psicologo_numero_de_titulo_idx" ON "Psicologo"("numero_de_titulo");

-- CreateIndex
CREATE INDEX "Opcion_id_pregunta_idx" ON "Opcion"("id_pregunta");

-- CreateIndex
CREATE INDEX "Respuesta_id_test_id_usuario_idx" ON "Respuesta"("id_test", "id_usuario");

-- CreateIndex
CREATE INDEX "Respuesta_id_pregunta_idx" ON "Respuesta"("id_pregunta");

-- CreateIndex
CREATE INDEX "Respuesta_fecha_idx" ON "Respuesta"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "RedSocialPsicologo_id_psicologo_nombre_red_key" ON "RedSocialPsicologo"("id_psicologo", "nombre_red");

-- CreateIndex
CREATE INDEX "OpcionPlantilla_id_pregunta_idx" ON "OpcionPlantilla"("id_pregunta");

-- CreateIndex
CREATE INDEX "Cita_id_psicologo_idx" ON "Cita"("id_psicologo");

-- CreateIndex
CREATE INDEX "Cita_id_paciente_idx" ON "Cita"("id_paciente");

-- CreateIndex
CREATE INDEX "Cita_fecha_inicio_idx" ON "Cita"("fecha_inicio");

-- CreateIndex
CREATE INDEX "Cita_estado_idx" ON "Cita"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "TipoCita_nombre_key" ON "TipoCita"("nombre");

-- CreateIndex
CREATE INDEX "RecordatorioCita_id_cita_idx" ON "RecordatorioCita"("id_cita");

-- CreateIndex
CREATE INDEX "RecordatorioCita_fecha_envio_idx" ON "RecordatorioCita"("fecha_envio");

-- CreateIndex
CREATE INDEX "RegistroUsuario_usuario_id_idx" ON "RegistroUsuario"("usuario_id");

-- CreateIndex
CREATE INDEX "RegistroUsuario_psicologo_id_idx" ON "RegistroUsuario"("psicologo_id");

-- CreateIndex
CREATE INDEX "RegistroTrazabilidad_registro_usuario_id_idx" ON "RegistroTrazabilidad"("registro_usuario_id");

-- CreateIndex
CREATE INDEX "RegistroTrazabilidad_psicologo_id_idx" ON "RegistroTrazabilidad"("psicologo_id");

-- CreateIndex
CREATE INDEX "RegistroSesion_registro_usuario_id_idx" ON "RegistroSesion"("registro_usuario_id");

-- CreateIndex
CREATE INDEX "RegistroSesion_fecha_inicio_idx" ON "RegistroSesion"("fecha_inicio");

-- CreateIndex
CREATE INDEX "RegistroMetricaUsuario_registro_usuario_id_fecha_idx" ON "RegistroMetricaUsuario"("registro_usuario_id", "fecha");

-- CreateIndex
CREATE INDEX "RegistroTest_test_id_idx" ON "RegistroTest"("test_id");

-- CreateIndex
CREATE INDEX "RegistroTest_evaluado_fecha_completado_idx" ON "RegistroTest"("evaluado", "fecha_completado");

-- CreateIndex
CREATE INDEX "RegistroReporte_fecha_generacion_idx" ON "RegistroReporte"("fecha_generacion");

-- CreateIndex
CREATE INDEX "RegistroReporte_generado_por_id_idx" ON "RegistroReporte"("generado_por_id");

-- CreateIndex
CREATE INDEX "RegistroCita_id_psicologo_idx" ON "RegistroCita"("id_psicologo");

-- CreateIndex
CREATE INDEX "RegistroCita_id_paciente_idx" ON "RegistroCita"("id_paciente");

-- CreateIndex
CREATE INDEX "RegistroCita_fecha_cita_idx" ON "RegistroCita"("fecha_cita");

-- CreateIndex
CREATE INDEX "RegistroCita_estado_idx" ON "RegistroCita"("estado");

-- CreateIndex
CREATE INDEX "RegistroCita_registro_usuario_id_idx" ON "RegistroCita"("registro_usuario_id");

-- CreateIndex
CREATE INDEX "RegistroMetricaCitas_fecha_idx" ON "RegistroMetricaCitas"("fecha");

-- CreateIndex
CREATE INDEX "RegistroMetricaCitas_periodo_idx" ON "RegistroMetricaCitas"("periodo");
