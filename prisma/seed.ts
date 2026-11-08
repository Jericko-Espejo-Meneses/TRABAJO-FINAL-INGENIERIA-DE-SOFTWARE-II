import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando semillero de datos de HealthExpress en PostgreSQL (Supabase)...');

  // 1. Limpieza inicial controlada (respetando restricciones de clave foránea)
  await prisma.favorite.deleteMany().catch(() => {});
  await prisma.notification.deleteMany().catch(() => {});
  await prisma.userAchievement.deleteMany().catch(() => {});
  await prisma.achievement.deleteMany().catch(() => {});
  await prisma.donation.deleteMany().catch(() => {});
  await prisma.foundation.deleteMany().catch(() => {});
  await prisma.payment.deleteMany().catch(() => {});
  await prisma.orderTracking.deleteMany().catch(() => {});
  await prisma.orderItem.deleteMany().catch(() => {});
  await prisma.order.deleteMany().catch(() => {});
  await prisma.cartItem.deleteMany().catch(() => {});
  await prisma.cart.deleteMany().catch(() => {});
  await prisma.nutritionalInfo.deleteMany().catch(() => {});
  await prisma.menuItem.deleteMany().catch(() => {});
  await prisma.restaurant.deleteMany().catch(() => {});
  await prisma.address.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});

  // 2. Usuario Demo (Sprint 1 y 7)
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const demoUser = await prisma.user.create({
    data: {
      id: 'user-demo-1',
      email: 'usuario.demo@healthexpress.com',
      passwordHash,
      fullName: 'Carlos Mendoza',
      phone: '+51987654321',
      provider: 'email',
      dietaryPreferences: JSON.stringify(['vegetariano', 'alto en proteina']),
      healthGoals: JSON.stringify(['muscle_gain', 'balanced']),
      addresses: {
        create: [
          {
            id: 'addr-1',
            label: 'Casa',
            street: 'Av. Primavera 1234, Dpto 402',
            city: 'Santiago de Surco, Lima',
            reference: 'Frente al parque Chacarilla',
            isDefault: true,
          },
          {
            id: 'addr-2',
            label: 'Oficina',
            street: 'Av. Javier Prado Este 4200, Piso 8',
            city: 'San Isidro, Lima',
            reference: 'Torre Empresarial',
            isDefault: false,
          },
        ],
      },
    },
  });
  console.log(`✅ Usuario demo creado: ${demoUser.email}`);

  // 3. Restaurantes Saludables (Sprint 2)
  const restaurants = [
    {
      id: 'rest-1',
      name: 'GreenBowl Healthy Bar',
      description: 'Especialistas en bowls nutritivos, ensaladas de estación e ingredientes orgánicos certificados.',
      logoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150',
      bannerUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
      rating: 4.9,
      totalReviews: 320,
      deliveryTimeMinutes: 25,
      deliveryFee: 4.5,
      minimumOrder: 20.0,
      priceLevel: 2,
      dietaryTags: JSON.stringify(['vegano', 'vegetariano', 'sin gluten', 'bajo en calorias', 'organico']),
      foodType: 'Bowls & Ensaladas',
      address: 'Av. Primavera 450, Santiago de Surco',
      phone: '+51 1 456-7890',
    },
    {
      id: 'rest-2',
      name: 'NutriVida Fit Kitchen',
      description: 'Comida fitness balanceada, alta en proteínas y opciones keto diseñada por nutricionistas.',
      logoUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150',
      bannerUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
      rating: 4.8,
      totalReviews: 245,
      deliveryTimeMinutes: 30,
      deliveryFee: 5.0,
      minimumOrder: 25.0,
      priceLevel: 2,
      dietaryTags: JSON.stringify(['keto', 'alto en proteina', 'sin gluten', 'fitness']),
      foodType: 'Keto & Fitness',
      address: 'Calle Los Pinos 182, Miraflores',
      phone: '+51 1 332-1144',
    },
    {
      id: 'rest-3',
      name: 'SanaTentación Veggie Bistro',
      description: 'Platos 100% vegetales, libres de ultraprocesados y con el mejor sabor natural.',
      logoUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=150',
      bannerUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800',
      rating: 4.7,
      totalReviews: 180,
      deliveryTimeMinutes: 35,
      deliveryFee: 4.0,
      minimumOrder: 18.0,
      priceLevel: 2,
      dietaryTags: JSON.stringify(['vegano', 'organico', 'vegetariano', 'detox', 'sin lactosa']),
      foodType: 'Comida Vegana',
      address: 'Av. Larco 810, Miraflores',
      phone: '+51 1 224-5588',
    },
    {
      id: 'rest-4',
      name: 'PureJuice & Smoothies Lab',
      description: 'Prensado en frío, shots inmunológicos, bowls de açaí y superalimentos sin azúcar añadida.',
      logoUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=150',
      bannerUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800',
      rating: 4.9,
      totalReviews: 410,
      deliveryTimeMinutes: 20,
      deliveryFee: 3.5,
      minimumOrder: 15.0,
      priceLevel: 1,
      dietaryTags: JSON.stringify(['detox', 'sin gluten', 'organico', 'bajo en calorias', 'vegano']),
      foodType: 'Smoothies & Detox',
      address: 'Av. Conquistadores 740, San Isidro',
      phone: '+51 1 556-9922',
    },
  ];

  for (const r of restaurants) {
    await prisma.restaurant.create({ data: r });
  }
  console.log(`✅ ${restaurants.length} restaurantes creados.`);

  // 4. Platos y fichas nutricionales completas (Sprints 2, 3 y 8)
  const menuItems = [
    {
      id: 'menu-1',
      restaurantId: 'rest-1',
      name: 'Bowl Quinoa & Pollo Grill Proteico',
      description: 'Base de quinoa tricolor, pechuga de pollo a la plancha, palta hass, tomate cherry y vinagreta de limón y chía.',
      price: 28.5,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      category: 'Bowls',
      dietaryTags: JSON.stringify(['alto en proteina', 'sin gluten', 'balanceado']),
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Quinoa perlada orgánica', 'Pechuga de pollo al grill', 'Palta Hass', 'Tomates cherry', 'Semillas de chía']),
      nutriScore: 'A',
      glycemicIndex: 'Bajo',
      nutrition: { calories: 450, proteinGrams: 35, carbsGrams: 42, fatGrams: 14, fiberGrams: 9, sodiumMg: 340 },
    },
    {
      id: 'menu-2',
      restaurantId: 'rest-1',
      name: 'Ensalada Salmón Fresco & Kale Crunch',
      description: 'Filete de salmón horneado, kale masajeado con oliva virgen, nueces tostadas, arándanos secos y tahini ligero.',
      price: 34.0,
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500',
      category: 'Ensaladas',
      dietaryTags: JSON.stringify(['keto', 'sin gluten', 'alto en proteina']),
      allergens: JSON.stringify(['Pescado', 'Nueces', 'Sésamo']),
      ingredients: JSON.stringify(['Salmón atlántico fresco', 'Kale toscano', 'Nueces tostadas', 'Arándanos secos', 'Tahini artesanal']),
      nutriScore: 'A',
      glycemicIndex: 'Bajo',
      nutrition: { calories: 390, proteinGrams: 32, carbsGrams: 14, fatGrams: 22, fiberGrams: 7, sodiumMg: 280 },
    },
    {
      id: 'menu-3',
      restaurantId: 'rest-2',
      name: 'Keto Power Burger en Pan de Almendras',
      description: 'Hamburguesa 100% res alimentada con pasto, queso cheddar artesanal, tocino crujiente y pan keto bajo en carbos.',
      price: 32.0,
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500',
      category: 'Keto',
      dietaryTags: JSON.stringify(['keto', 'alto en proteina', 'sin gluten']),
      allergens: JSON.stringify(['Lácteos', 'Almendras', 'Huevo']),
      ingredients: JSON.stringify(['Carne de res grass-fed', 'Harina de almendras', 'Queso cheddar madurado', 'Tocino ahumado artesanal']),
      nutriScore: 'B',
      glycemicIndex: 'Muy Bajo',
      nutrition: { calories: 540, proteinGrams: 42, carbsGrams: 6, fatGrams: 38, fiberGrams: 4, sodiumMg: 620 },
    },
    {
      id: 'menu-4',
      restaurantId: 'rest-3',
      name: 'Curry Verde Vegano con Tofu Orgánico',
      description: 'Tofu marinado a la plancha, leche de coco ligera, verduras salteadas, albahaca tailandesa y arroz integral jazmín.',
      price: 29.0,
      imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=500',
      category: 'Vegano',
      dietaryTags: JSON.stringify(['vegano', 'vegetariano', 'sin lactosa', 'sin gluten']),
      allergens: JSON.stringify(['Soya']),
      ingredients: JSON.stringify(['Tofu orgánico firme', 'Leche de coco light', 'Espinacas tiernas', 'Curry verde natural', 'Arroz jazmín']),
      nutriScore: 'A',
      glycemicIndex: 'Medio',
      nutrition: { calories: 380, proteinGrams: 22, carbsGrams: 45, fatGrams: 12, fiberGrams: 8, sodiumMg: 390 },
    },
    {
      id: 'menu-5',
      restaurantId: 'rest-4',
      name: 'Super Açaí Antioxidant Bowl',
      description: 'Pulpa pura de açaí silvestre orgánico batida, granola sin azúcar, fresas, plátano, coco rallado y nibs de cacao.',
      price: 24.0,
      imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=500',
      category: 'Bowls',
      dietaryTags: JSON.stringify(['vegano', 'organico', 'detox', 'sin gluten']),
      allergens: JSON.stringify([]),
      ingredients: JSON.stringify(['Açaí 100% orgánico', 'Granola de avena sin gluten', 'Plátano de seda', 'Fresas frescas', 'Nibs de cacao']),
      nutriScore: 'A',
      glycemicIndex: 'Bajo',
      nutrition: { calories: 310, proteinGrams: 8, carbsGrams: 52, fatGrams: 9, fiberGrams: 11, sodiumMg: 45 },
    },
  ];

  for (const m of menuItems) {
    const { nutrition, ...itemData } = m;
    await prisma.menuItem.create({
      data: {
        ...itemData,
        nutritionalInfo: {
          create: nutrition,
        },
      },
    });
  }
  console.log(`✅ ${menuItems.length} platos y fichas nutricionales creados.`);

  // 5. Fundaciones y ONGs Aliadas (Sprint 4 y 5)
  const foundations = [
    {
      id: 'found-wfp',
      name: 'World Food Programme (WFP)',
      description: 'La mayor organización humanitaria del mundo que salva vidas en emergencias y fomenta la nutrición sustentable.',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/WFP_logo_2016.svg/320px-WFP_logo_2016.svg.png',
      website: 'https://es.wfp.org/',
      mission: 'Hambre Cero (ODS 2 de las Naciones Unidas)',
      category: 'alimentacion_global',
    },
    {
      id: 'found-bap',
      name: 'Banco de Alimentos Perú',
      description: 'Organización benéfica que rescata alimentos aptos para consumo y los distribuye a comedores populares y ollas comunes.',
      logoUrl: 'https://bancodealimentosperu.org/wp-content/uploads/2021/04/logo-banco-de-alimentos-peru.png',
      website: 'https://bancodealimentosperu.org/',
      mission: 'Luchar contra el desperdicio de alimentos y el hambre en el Perú',
      category: 'alimentacion_local',
    },
    {
      id: 'found-aldeas',
      name: 'Aldeas Infantiles SOS Perú',
      description: 'Garantiza el derecho de niñas, niños y adolescentes a crecer en una familia con acceso a nutrición sana y educación.',
      logoUrl: 'https://www.aldeasinfantiles.org.pe/themes/custom/aldeas_infantiles/logo.svg',
      website: 'https://www.aldeasinfantiles.org.pe/',
      mission: 'Protección infantil y alimentación balanceada para la niñez vulnerable',
      category: 'ninez_nutricion',
    },
  ];

  for (const f of foundations) {
    await prisma.foundation.create({ data: f });
  }
  console.log(`✅ ${foundations.length} fundaciones aliadas creadas.`);

  // 6. Logros e Insignias Saludables (Sprint 6)
  const achievements = [
    {
      id: 'ach-first-order',
      code: 'ACH_FIRST_ORDER',
      title: 'Primer Paso Saludable',
      description: 'Realizaste tu primer pedido saludable en HealthExpress.',
      badgeIconUrl: '🥗',
      category: 'orders',
      targetCount: 1,
      pointsReward: 50,
    },
    {
      id: 'ach-veggie-lover',
      code: 'ACH_VEGGIE_LOVER',
      title: 'Amante de los Vegetales',
      description: 'Pide 3 platos vegetarianos o veganos certificados.',
      badgeIconUrl: '🥦',
      category: 'nutrition',
      targetCount: 3,
      pointsReward: 150,
    },
    {
      id: 'ach-donor-hero',
      code: 'ACH_DONOR_HERO',
      title: 'Héroe Solidario',
      description: 'Genera más de 5 raciones de comida donadas a ONGs con tus compras.',
      badgeIconUrl: '💚',
      category: 'donations',
      targetCount: 5,
      pointsReward: 200,
    },
  ];

  for (const a of achievements) {
    await prisma.achievement.create({ data: a });
  }
  console.log(`✅ ${achievements.length} logros creados.`);

  // 7. Pedido inicial y Donación vinculada (Sprints 4, 5 y 7)
  const initialOrder = await prisma.order.create({
    data: {
      id: 'HE-901245',
      userId: demoUser.id,
      restaurantId: 'rest-1',
      restaurantName: 'GreenBowl Healthy Bar',
      subtotal: 57.0,
      deliveryFee: 4.5,
      total: 61.5,
      totalCalories: 840,
      totalProtein: 67,
      totalCarbs: 56,
      totalFat: 36,
      status: 'DELIVERED',
      deliveryAddress: 'Av. Primavera 1234, Dpto 402, Santiago de Surco',
      contactPhone: '+51987654321',
      items: {
        create: [
          {
            menuItemId: 'menu-1',
            name: 'Bowl Quinoa & Pollo Grill Proteico',
            unitPrice: 28.5,
            quantity: 2,
            lineTotal: 57.0,
            calories: 450,
            proteinGrams: 35,
            carbsGrams: 42,
            fatGrams: 14,
          },
        ],
      },
      payment: {
        create: {
          userId: demoUser.id,
          amount: 61.5,
          currency: 'PEN',
          status: 'COMPLETED',
          method: 'card',
          details: JSON.stringify({ brand: 'visa', last4: '4242' }),
          transactionReference: 'TX-PAY-892110',
        },
      },
      tracking: {
        create: {
          currentStatus: 'DELIVERED',
          progressPercentage: 100,
          estimatedDeliveryMinutes: 0,
          driverName: 'Jorge Ramírez',
          driverPhone: '+51 981 123 456',
          vehiclePlate: 'MOT-7821',
          timeline: JSON.stringify([
            { status: 'CONFIRMED', label: 'Pedido confirmado', timestamp: new Date(), completed: true },
            { status: 'PREPARING', label: 'Alimentos preparados', timestamp: new Date(), completed: true },
            { status: 'ON_THE_WAY', label: 'Repartidor en camino', timestamp: new Date(), completed: true },
            { status: 'DELIVERED', label: 'Pedido entregado en tu puerta', timestamp: new Date(), completed: true },
          ]),
        },
      },
      donation: {
        create: {
          userId: demoUser.id,
          foundationId: 'found-wfp',
          amount: 1.85,
          percentage: 3.0,
          orderTotal: 61.5,
          mealsEquivalent: 0,
          status: 'COMPLETED',
        },
      },
    },
  });
  console.log(`✅ Pedido inicial e impacto social creados en PostgreSQL (Supabase): ${initialOrder.id}`);

  console.log('✨ Semillero de base de datos PostgreSQL (Supabase) completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
