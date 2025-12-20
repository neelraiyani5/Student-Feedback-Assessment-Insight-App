import { PrismaClient } from "../generated/prisma/client.js";

const prisma = new PrismaClient({
  log: ["error", "warn"]
});

export default prisma;
