import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Pizzas
  const pizzas = [
    {
      name: "Margherita",
      description: "Molho de tomate, mussarela, manjericão fresco e azeite",
      price: 35.9,
      category: "PIZZA",
    },
    {
      name: "Calabresa",
      description: "Molho de tomate, mussarela, calabresa fatiada e cebola",
      price: 38.9,
      category: "PIZZA",
    },
    {
      name: "Portuguesa",
      description:
        "Molho de tomate, mussarela, presunto, ovos, cebola, azeitona e orégano",
      price: 42.9,
      category: "PIZZA",
    },
    {
      name: "Quatro Queijos",
      description: "Molho de tomate, mussarela, provolone, catupiry e parmesão",
      price: 45.9,
      category: "PIZZA",
    },
    {
      name: "Frango com Catupiry",
      description: "Molho de tomate, mussarela, frango desfiado e catupiry",
      price: 41.9,
      category: "PIZZA",
    },
    {
      name: "Pepperoni",
      description: "Molho de tomate, mussarela e pepperoni",
      price: 44.9,
      category: "PIZZA",
    },
  ];

  // Bebidas
  const bebidas = [
    {
      name: "Coca-Cola 350ml",
      description: "Refrigerante de cola gelado",
      price: 5.5,
      category: "BEBIDA",
    },
    {
      name: "Coca-Cola 2L",
      description: "Refrigerante de cola 2 litros",
      price: 12.9,
      category: "BEBIDA",
    },
    {
      name: "Guaraná Antarctica 350ml",
      description: "Refrigerante de guaraná gelado",
      price: 5.5,
      category: "BEBIDA",
    },
    {
      name: "Suco de Laranja 300ml",
      description: "Suco natural de laranja",
      price: 8.9,
      category: "BEBIDA",
    },
    {
      name: "Água Mineral 500ml",
      description: "Água mineral sem gás",
      price: 3.5,
      category: "BEBIDA",
    },
    {
      name: "Suco de Uva 300ml",
      description: "Suco natural de uva",
      price: 8.9,
      category: "BEBIDA",
    },
  ];

  // Sobremesas
  const sobremesas = [
    {
      name: "Brownie com Calda de Chocolate",
      description:
        "Brownie quente com calda de chocolate e sorvete de baunilha",
      price: 15.9,
      category: "SOBREMESA",
    },
    {
      name: "Pudim de Leite Condensado",
      description: "Pudim cremoso feito com leite condensado",
      price: 12.9,
      category: "SOBREMESA",
    },
    {
      name: "Tiramisù",
      description: "Sobremesa italiana com café, mascarpone e cacau",
      price: 18.9,
      category: "SOBREMESA",
    },
    {
      name: "Petit Gateau",
      description: "Bolinho de chocolate quente com sorvete de baunilha",
      price: 16.9,
      category: "SOBREMESA",
    },
    {
      name: "Mousse de Maracujá",
      description: "Mousse cremoso de maracujá",
      price: 11.9,
      category: "SOBREMESA",
    },
  ];

  // Inserir todos os itens
  const allItems = [...pizzas, ...bebidas, ...sobremesas];

  for (const item of allItems) {
    await prisma.menuItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log(`📄 Created ${pizzas.length} pizzas`);
  console.log(`🥤 Created ${bebidas.length} bebidas`);
  console.log(`🍰 Created ${sobremesas.length} sobremesas`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
