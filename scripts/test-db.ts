import { prisma } from "../lib/prisma";

async function main() {
  const products = await prisma.product.findMany({
    include: { category: true },
  });
  console.log(`✓ Successfully connected! Found ${products.length} products.`);

  const admin = await prisma.user.findUnique({
    where: { email: "admin234@restomayo.com" },
  });
  console.log(`✓ Admin user exists: ${admin ? admin.email : "NOT FOUND"}`);

  const tables = await prisma.table.findMany();
  console.log(`✓ Tables exist: ${tables.length} tables found.`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Connection failed:", err);
  process.exit(1);
});
