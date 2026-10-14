import { prisma } from "../lib/prisma";

async function main() {
  console.log("Seeding Resto Mayo database...");

  // 1. Admin User
  await prisma.user.upsert({
    where: { email: "admin234@restomayo.com" },
    update: {
      name: "Admin",
      password: "password",
      role: "admin",
    },
    create: {
      name: "Admin",
      email: "admin234@restomayo.com",
      password: "password",
      role: "admin",
    },
  });
  console.log("✓ Admin user seeded");

  // 2. Tables (M01 to M10)
  for (let i = 1; i <= 10; i++) {
    const code = `M${i.toString().padStart(2, "0")}`;
    await prisma.table.upsert({
      where: { table_code: code },
      update: {
        table_number: i,
        status: i <= 3 ? "occupied" : "available",
      },
      create: {
        table_code: code,
        table_number: i,
        status: i <= 3 ? "occupied" : "available",
      },
    });
  }
  console.log("✓ Tables M01-M10 seeded");

  // 3. Categories
  const categoryNames = ["Makanan", "Dimsum", "Minuman"];
  const categories: Record<string, { id: number; name: string }> = {};

  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories[name] = cat;
  }
  console.log("✓ Categories seeded");

  // 4. Products
  const products = [
    {
      category: "Makanan",
      name: "Risoles Mayonise Keju Lumer",
      description:
        "Menu andalan Resto Mayo! Risoles renyah keemasan dengan isian daging asap premium, telur rebus lembut, keju lumer, dan racikan mayonise spesial yang gurih memikat.",
      price: 18000,
      image:
        "https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&q=80",
      is_available: true,
    },
    {
      category: "Makanan",
      name: "Nasi Goreng Spesial Resto Mayo",
      description:
        "Nasi goreng racikan bumbu rempah autentik dengan suwiran ayam gurih, udang segar, telur mata sapi setengah matang, kerupuk udang renyah, dan acar segar.",
      price: 32000,
      image:
        "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80",
      is_available: true,
    },
    {
      category: "Makanan",
      name: "Nasi Goreng Seafood Pedas",
      description:
        "Nasi goreng kaya aroma dengan paduan udang manis, cumi kenyal, dan bakso ikan disiram sambal terasi gurih dengan tingkat kepedasan pas.",
      price: 36000,
      image:
        "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80",
      is_available: true,
    },
    {
      category: "Makanan",
      name: "Ayam Bakar",
      description:
        "Ayam bakar dengan bumbu yang meresap dan membuat kenyang seharian.",
      price: 45000,
      image:
        "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&q=80",
      is_available: true,
    },
    {
      category: "Dimsum",
      name: "Dimsum Ayam Mayo Mentai",
      description:
        "Siomay ayam gurih lembut isi 4 pcs disajikan hangat dengan baluran saus mentai mayonise bakar yang harum menggugah selera.",
      price: 24000,
      image:
        "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&q=80",
      is_available: true,
    },
    {
      category: "Dimsum",
      name: "Udang Keju",
      description:
        "Udang Keju dengan mozarella yang lumer untuk pelanggan tercinta dari resto mayo",
      price: 10000,
      image:
        "https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80",
      is_available: true,
    },
    {
      category: "Dimsum",
      name: "Udang Mayo",
      description:
        "Udang Mayo dengan topping mayonise khas milik resto mayo",
      price: 10000,
      image:
        "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80",
      is_available: true,
    },
    {
      category: "Dimsum",
      name: "Udang Selai Kacang",
      description:
        "Udang Selai Kacang milik resto mayo dengan ini bisa membuat pelanggan terpikat",
      price: 10000,
      image:
        "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80",
      is_available: true,
    },
    {
      category: "Minuman",
      name: "Es Kopi Susu Aren Mayo",
      description:
        "Espresso robusta & arabika pilihan berpadu susu segar krimi dan sirup gula aren murni disajikan dingin menyegarkan.",
      price: 22000,
      image:
        "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=80",
      is_available: true,
    },
    {
      category: "Minuman",
      name: "Es Teh Manis Melati Segar",
      description:
        "Seduhan teh melati wangi alami pilihan khas nusantara disajikan dingin dengan es batu kristal penyejuk dahaga.",
      price: 8000,
      image:
        "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80",
      is_available: true,
    },
    {
      category: "Minuman",
      name: "Jus Alpukat Kocok Mayo",
      description:
        "Daging alpukat mentega segar kental dikocok dengan susu kental manis cokelat dan krim lembut kaya nutrisi.",
      price: 25000,
      image:
        "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=600&q=80",
      is_available: true,
    },
    {
      category: "Minuman",
      name: "Milshake Milo",
      description:
        "Milshake Milo yang segar membuat yang memesan ini pasti akan senang",
      price: 15000,
      image:
        "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80",
      is_available: true,
    },
  ];

  for (const item of products) {
    const cat = categories[item.category];
    const existing = await prisma.product.findFirst({
      where: { name: item.name },
    });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          category_id: cat.id,
          description: item.description,
          price: item.price,
          image: item.image,
          is_available: item.is_available,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          category_id: cat.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          is_available: item.is_available,
        },
      });
    }
  }
  console.log("✓ Products seeded");

  // 5. Sample Realistic Orders
  const tables = await prisma.table.findMany({ orderBy: { table_number: "asc" } });
  const allProducts = await prisma.product.findMany();
  const risol = allProducts.find((p) => p.name.includes("Risoles")) || allProducts[0];
  const nasgor = allProducts.find((p) => p.name.includes("Nasi Goreng")) || allProducts[1];
  const teh = allProducts.find((p) => p.name.includes("Teh")) || allProducts[2];

  // Order 1: Pending
  const existingOrder1 = await prisma.order.findUnique({ where: { order_number: "ORD-1001" } });
  if (!existingOrder1 && tables[0]) {
    const o1 = await prisma.order.create({
      data: {
        order_number: "ORD-1001",
        table_id: tables[0].id,
        customer_name: "Budi Santoso",
        total_amount: 68000,
        status: "pending",
        ordered_at: new Date(Date.now() - 12 * 60 * 1000),
      },
    });
    await prisma.orderItem.createMany({
      data: [
        {
          order_id: o1.id,
          product_id: risol.id,
          quantity: 2,
          price: risol.price,
          total: Number(risol.price) * 2,
          notes: "Mayonise ekstra banyak",
        },
        {
          order_id: o1.id,
          product_id: nasgor.id,
          quantity: 1,
          price: nasgor.price,
          total: Number(nasgor.price),
          notes: "Pedas sedang, telur ceplok matang",
        },
      ],
    });
    await prisma.payment.create({
      data: {
        order_id: o1.id,
        method: "qris",
        status: "paid",
        amount: 68000,
        paid_at: new Date(Date.now() - 10 * 60 * 1000),
      },
    });
  }

  // Order 2: Processing
  const existingOrder2 = await prisma.order.findUnique({ where: { order_number: "ORD-1002" } });
  if (!existingOrder2 && tables[1]) {
    const o2 = await prisma.order.create({
      data: {
        order_number: "ORD-1002",
        table_id: tables[1].id,
        customer_name: "Siti Rahma",
        total_amount: 44000,
        status: "processing",
        ordered_at: new Date(Date.now() - 25 * 60 * 1000),
      },
    });
    await prisma.orderItem.createMany({
      data: [
        {
          order_id: o2.id,
          product_id: risol.id,
          quantity: 2,
          price: risol.price,
          total: Number(risol.price) * 2,
          notes: "Goreng garing renyah",
        },
        {
          order_id: o2.id,
          product_id: teh.id,
          quantity: 1,
          price: teh.price,
          total: Number(teh.price),
          notes: "Es batu sedikit (less ice)",
        },
      ],
    });
    await prisma.payment.create({
      data: {
        order_id: o2.id,
        method: "gopay",
        status: "paid",
        amount: 44000,
        paid_at: new Date(Date.now() - 23 * 60 * 1000),
      },
    });
  }

  // Order 3: Ready
  const existingOrder3 = await prisma.order.findUnique({ where: { order_number: "ORD-1003" } });
  if (!existingOrder3 && tables[2]) {
    const o3 = await prisma.order.create({
      data: {
        order_number: "ORD-1003",
        table_id: tables[2].id,
        customer_name: "Dimas Pratama",
        total_amount: 32000,
        status: "ready",
        ordered_at: new Date(Date.now() - 35 * 60 * 1000),
      },
    });
    await prisma.orderItem.createMany({
      data: [
        {
          order_id: o3.id,
          product_id: nasgor.id,
          quantity: 1,
          price: nasgor.price,
          total: Number(nasgor.price),
          notes: "Tidak pakai daun bawang",
        },
      ],
    });
    await prisma.payment.create({
      data: {
        order_id: o3.id,
        method: "dana",
        status: "paid",
        amount: 32000,
        paid_at: new Date(Date.now() - 33 * 60 * 1000),
      },
    });
  }
  console.log("✓ Sample orders & payments seeded");

  console.log("\n🎉 Database seeded successfully for Resto Mayo!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
