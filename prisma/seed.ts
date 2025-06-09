import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

const tipeUserData = [
  {
    nombre: "Administrador",
  },
  {
    nombre: "psicologo",
  },
  {
    nombre: "Usuario",
  },
];



async function main() {
  for (const u of tipeUserData) {
    await prisma.tipoUsuario.create({data:u});
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });