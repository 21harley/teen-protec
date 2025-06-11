import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

const tipoUsuarioData = [
  {
    nombre: "administrador",
    menu: [
      { path: "/alertas", name: "Alertas", icon: "notifications" },
      { path: "/perfil", name: "Perfil", icon: "person" },
      { path: "/usuarios", name: "Usuarios", icon: "people" },
      { path: "/test", name: "Test", icon: "quiz" },
      { path: "/sobre-nosotros", name: "Sobre nosotros", icon: "info" }
    ]
  },
  {
    nombre: "psicologo",
    menu: [
      { path: "/alertas", name: "Alertas", icon: "notifications" },
      { path: "/perfil", name: "Perfil", icon: "person" },
      { path: "/pacientes", name: "Pacientes", icon: "medical_services" },
      { path: "/test", name: "Test", icon: "quiz" },
      { path: "/sobre-nosotros", name: "Sobre nosotros", icon: "info" }
    ]
  },
  {
    nombre: "adolecente",
    menu: [
      { path: "/alertas", name: "Alertas", icon: "notifications" },
      { path: "/perfil", name: "Perfil", icon: "person" },
      { path: "/test", name: "Test", icon: "quiz" },
      { path: "/sobre-nosotros", name: "Sobre nosotros", icon: "info" }
    ]
  },
  {
    nombre: "usuario",
    menu: [
      { path: "/alertas", name: "Alertas", icon: "notifications" },
      { path: "/perfil", name: "Perfil", icon: "person" },
      { path: "/test", name: "Test", icon: "quiz" },
      { path: "/sobre-nosotros", name: "Sobre nosotros", icon: "info" }
    ]
  }
];

async function main() {
  // Eliminar datos existentes para evitar duplicados (opcional)
  await prisma.tipoUsuario.deleteMany({});
  
  // Crear los tipos de usuario con sus menús
  for (const tipoUsuario of tipoUsuarioData) {
    await prisma.tipoUsuario.create({
      data: {
        nombre: tipoUsuario.nombre,
        menu: tipoUsuario.menu
      }
    });
  }
  
  console.log("Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });