import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '../modules/users/entities/user.entity';
import { Restaurant } from '../modules/restaurants/entities/restaurant.entity';
import { MenuItem } from '../modules/menus/entities/menu-item.entity';
import { Cart } from '../modules/cart/entities/cart.entity';
import { Order, OrderStatus } from '../modules/orders/entities/order.entity';
import { Payment } from '../modules/payments/entities/payment.entity';
import { Donation, Foundation } from '../modules/donations/entities/donation.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { Achievement, UserAchievementProgress } from '../modules/achievements/entities/achievement.entity';
import { Favorite } from '../modules/favorites/entities/favorite.entity';

@Injectable()
export class DatabaseService implements OnModuleInit {
  public users: Map<string, User> = new Map();
  public restaurants: Map<string, Restaurant> = new Map();
  public menuItems: Map<string, MenuItem> = new Map();
  public carts: Map<string, Cart> = new Map();
  public orders: Map<string, Order> = new Map();
  public payments: Map<string, Payment> = new Map();
  public donations: Map<string, Donation> = new Map();
  public foundations: Map<string, Foundation> = new Map();
  public notifications: Map<string, Notification> = new Map();
  public achievements: Map<string, Achievement> = new Map();
  public userAchievements: Map<string, Map<string, UserAchievementProgress>> = new Map();
  public favorites: Map<string, Favorite> = new Map();

  async onModuleInit() {
    await this.seedData();
  }

  private async seedData() {
    // 1. Seed demo user
    const demoPasswordHash = await bcrypt.hash('Password123!', 10);
    const demoUser: User = {
      id: 'user-demo-1',
      email: 'usuario.demo@healthexpress.com',
      passwordHash: demoPasswordHash,
      fullName: 'Carlos Mendoza',
      phone: '+51987654321',
      provider: 'email',
      dietaryPreferences: ['vegetariano', 'alto en proteina'],
      healthGoals: ['muscle_gain', 'balanced'],
      addresses: [
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
      createdAt: new Date('2026-01-10T10:00:00Z'),
      updatedAt: new Date('2026-01-10T10:00:00Z'),
    };
    this.users.set(demoUser.id, demoUser);

    // 2. Seed healthy restaurants
    const restaurantsList: Restaurant[] = [
      {
        id: 'rest-1',
        name: 'GreenBowl Healthy Bar',
        description: 'Especialistas en bowls nutritivos, ensaladas de estación e ingredientes orgánicos certificados.',
        logoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150',
        bannerUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
        rating: 4.9,
        reviewsCount: 320,
        deliveryTimeMinutes: 25,
        deliveryFee: 4.5,
        priceLevel: '$$',
        category: 'Bowls & Ensaladas',
        dietaryTags: ['vegano', 'vegetariano', 'sin gluten', 'bajo en calorias', 'organico'],
        address: 'Av. Primavera 450, Santiago de Surco',
        phone: '+51 1 456-7890',
        isHealthyCertified: true,
        isOpen: true,
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 'rest-2',
        name: 'NutriVida Fit Kitchen',
        description: 'Comida fitness balanceada, alta en proteínas y opciones keto diseñada por nutricionistas.',
        logoUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150',
        bannerUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
        rating: 4.8,
        reviewsCount: 245,
        deliveryTimeMinutes: 30,
        deliveryFee: 5.0,
        priceLevel: '$$',
        category: 'Keto & Fitness',
        dietaryTags: ['keto', 'alto en proteina', 'sin gluten', 'fitness'],
        address: 'Calle Los Pinos 182, Miraflores',
        phone: '+51 1 332-1144',
        isHealthyCertified: true,
        isOpen: true,
        createdAt: new Date('2026-01-02'),
      },
      {
        id: 'rest-3',
        name: 'SanaTentación Veggie Bistro',
        description: 'Platos 100% vegetales, libres de ultraprocesados y con el mejor sabor natural.',
        logoUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=150',
        bannerUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800',
        rating: 4.7,
        reviewsCount: 180,
        deliveryTimeMinutes: 35,
        deliveryFee: 4.0,
        priceLevel: '$$',
        category: 'Comida Vegana',
        dietaryTags: ['vegano', 'organico', 'vegetariano', 'detox', 'sin lactosa'],
        address: 'Av. Larco 810, Miraflores',
        phone: '+51 1 224-5588',
        isHealthyCertified: true,
        isOpen: true,
        createdAt: new Date('2026-01-05'),
      },
      {
        id: 'rest-4',
        name: 'PureJuice & Smoothies Lab',
        description: 'Prensado en frío, shots inmunológicos, bowls de açaí y superalimentos sin azúcar añadida.',
        logoUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=150',
        bannerUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800',
        rating: 4.9,
        reviewsCount: 410,
        deliveryTimeMinutes: 20,
        deliveryFee: 3.5,
        priceLevel: '$',
        category: 'Smoothies & Detox',
        dietaryTags: ['detox', 'sin gluten', 'organico', 'bajo en calorias', 'vegano'],
        address: 'Av. Conquistadores 740, San Isidro',
        phone: '+51 1 678-9900',
        isHealthyCertified: true,
        isOpen: true,
        createdAt: new Date('2026-01-07'),
      },
    ];

    for (const r of restaurantsList) {
      this.restaurants.set(r.id, r);
    }

    // 3. Seed menu items with deep nutritional facts (Sprint 8: HE-HU14-014)
    const menusList: MenuItem[] = [
      {
        id: 'menu-1',
        restaurantId: 'rest-1',
        restaurantName: 'GreenBowl Healthy Bar',
        name: 'Bowl Quinoa & Pollo Grill Proteico',
        description: 'Base de quinoa tricolor, pechuga de pollo a la plancha, palta hass, tomate cherry, garbanzos crocantes y vinagreta de limón y chía.',
        detailedDescription: 'Plato balanceado diseñado para deportistas y personas con alto requerimiento proteico. Combina carbohidratos complejos de absorción lenta provenientes de la quinoa andina orgánica con proteína magra de pechuga de pollo de libre pastoreo.',
        price: 28.5,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
        category: 'Bowls',
        portionSizeGrams: 420,
        ingredients: [
          'Quinoa perlada orgánica',
          'Pechuga de pollo a la plancha (sin hormonas)',
          'Palta Hass fresca',
          'Tomates cherry orgánicos',
          'Garbanzos tostados al horno',
          'Semillas de chía',
          'Aceite de oliva extra virgen prensado en frío',
          'Jugo de limón natural',
        ],
        allergens: [],
        preparationMethod: 'Pollo cocinado al grill sin aceites añadidos; quinoa cocida al vapor suave.',
        dietaryCertifications: ['Sin Gluten', 'Alto en Proteína', 'Sin Lácteos', 'Ingredientes Orgánicos'],
        nutritionalInfo: {
          calories: 450,
          proteinGrams: 35,
          carbsGrams: 42,
          fatGrams: 14,
          fiberGrams: 9,
          saturatedFatGrams: 2.2,
          sugarGrams: 3.5,
          sodiumMg: 340,
          glycemicIndex: 'Bajo',
          nutriScore: 'A',
          vitaminsAndMinerals: {
            'Hierro': '25% VD',
            'Magnesio': '30% VD',
            'Vitamina C': '45% VD',
            'Potasio': '18% VD',
          },
        },
        dietaryTags: ['alto en proteina', 'sin gluten', 'balanceado'],
        healthGoals: ['muscle_gain', 'balanced'],
        isPopular: true,
        isAvailable: true,
        rating: 4.9,
        createdAt: new Date('2026-01-10'),
      },
      {
        id: 'menu-2',
        restaurantId: 'rest-1',
        restaurantName: 'GreenBowl Healthy Bar',
        name: 'Ensalada Salmón Fresco & Kale Crunch',
        description: 'Filete de salmón fresco horneado, kale masajeado con oliva extra virgen, nueces tostadas, arándanos secos y aderezo tahini ligero.',
        detailedDescription: 'Rica en ácidos grasos Omega-3 y antioxidantes. El kale fresco se masajea para ablandar su fibra y maximizar la biodisponibilidad de sus carotenoides.',
        price: 34.0,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500',
        category: 'Ensaladas',
        portionSizeGrams: 380,
        ingredients: [
          'Filete de salmón atlántico silvestre',
          'Hojas de kale toscano',
          'Nueces pecana tostadas',
          'Arándanos deshidratados sin azúcar',
          'Semillas de sésamo',
          'Tahini artesanal',
          'Vinagre de manzana con madre',
        ],
        allergens: ['Pescado', 'Frutos secos (Nueces)', 'Sésamo'],
        preparationMethod: 'Salmón cocinado a baja temperatura para preservar ácidos grasos esenciales EPA y DHA.',
        dietaryCertifications: ['Keto Certified', 'Sin Gluten', 'Sin Lácteos', 'Rico en Omega 3'],
        nutritionalInfo: {
          calories: 390,
          proteinGrams: 32,
          carbsGrams: 14,
          fatGrams: 22,
          fiberGrams: 6,
          saturatedFatGrams: 3.1,
          sugarGrams: 4.0,
          sodiumMg: 280,
          glycemicIndex: 'Bajo',
          nutriScore: 'A',
          vitaminsAndMinerals: {
            'Omega 3 (EPA/DHA)': '2.2g',
            'Vitamina K': '120% VD',
            'Vitamina D': '60% VD',
            'Calcio': '15% VD',
          },
        },
        dietaryTags: ['keto', 'sin gluten', 'bajo en calorias', 'rico en omega 3'],
        healthGoals: ['weight_loss', 'keto', 'balanced'],
        isPopular: true,
        isAvailable: true,
        rating: 4.8,
        createdAt: new Date('2026-01-10'),
      },
      {
        id: 'menu-3',
        restaurantId: 'rest-2',
        restaurantName: 'NutriVida Fit Kitchen',
        name: 'Keto Power Burger (Pan de Almendras)',
        description: '200g de carne magra de pastoreo, queso cheddar artesanal, tocino crujiente de pavo, espinaca baby y alioli de palta en pan keto de harina de almendras.',
        detailedDescription: 'Hamburguesa cetogénica gourmet con tan solo 5g de carbohidratos netos. El pan keto se elabora a mano diariamente con harina de almendras y semillas de linaza molidas.',
        price: 36.5,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
        category: 'Platos Principales',
        portionSizeGrams: 360,
        ingredients: [
          'Carne de res magra 100% pastoreo',
          'Harina de almendras extra fina',
          'Queso cheddar curado maduro',
          'Tocino artesanal de pavo',
          'Hojas tiernas de espinaca baby',
          'Palta Hass y aceite de oliva',
        ],
        allergens: ['Frutos secos (Almendras)', 'Lácteos (Queso)', 'Huevo'],
        preparationMethod: 'Horneado de pan artesanal sin cereales; carne asada a la parrilla de piedra volcánica.',
        dietaryCertifications: ['Keto Certified', 'Sin Gluten', 'Low Carb'],
        nutritionalInfo: {
          calories: 520,
          proteinGrams: 42,
          carbsGrams: 5,
          fatGrams: 36,
          fiberGrams: 5,
          saturatedFatGrams: 8.5,
          sugarGrams: 1.2,
          sodiumMg: 450,
          glycemicIndex: 'Bajo',
          nutriScore: 'B',
          vitaminsAndMinerals: {
            'Zinc': '40% VD',
            'Vitamina B12': '80% VD',
            'Hierro Hemo': '30% VD',
          },
        },
        dietaryTags: ['keto', 'alto en proteina', 'sin gluten'],
        healthGoals: ['keto', 'muscle_gain'],
        isPopular: true,
        isAvailable: true,
        rating: 4.9,
        createdAt: new Date('2026-01-11'),
      },
      {
        id: 'menu-4',
        restaurantId: 'rest-2',
        restaurantName: 'NutriVida Fit Kitchen',
        name: 'Pechuga Grill con Puré de Camote y Espárragos',
        description: 'Pechuga marinada con finas hierbas al grill, acompañada de suave puré de camote amarillo asado y espárragos salteados en ghee.',
        detailedDescription: 'Clásico fitness para construcción muscular magra. El camote asado aporta betacarotenos y carbohidratos de bajo índice glucémico.',
        price: 31.0,
        imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500',
        category: 'Platos Principales',
        portionSizeGrams: 400,
        ingredients: [
          'Pechuga de pollo desgrasada',
          'Camote amarillo asado',
          'Espárragos verdes frescos',
          'Mantequilla clarificada Ghee',
          'Romero y tomillo fresco',
        ],
        allergens: [],
        preparationMethod: 'Cocción al vapor y terminado al grill con sal marina.',
        dietaryCertifications: ['Alto en Proteína', 'Bajo en Grasa', 'Sin Gluten'],
        nutritionalInfo: {
          calories: 410,
          proteinGrams: 45,
          carbsGrams: 32,
          fatGrams: 8,
          fiberGrams: 7,
          saturatedFatGrams: 1.8,
          sugarGrams: 6.0,
          sodiumMg: 310,
          glycemicIndex: 'Bajo',
          nutriScore: 'A',
          vitaminsAndMinerals: {
            'Vitamina A': '110% VD',
            'Ácido Fólico': '35% VD',
            'Potasio': '22% VD',
          },
        },
        dietaryTags: ['alto en proteina', 'bajo en grasa', 'sin gluten', 'fitness'],
        healthGoals: ['muscle_gain', 'weight_loss', 'balanced'],
        isPopular: true,
        isAvailable: true,
        rating: 4.8,
        createdAt: new Date('2026-01-11'),
      },
      {
        id: 'menu-5',
        restaurantId: 'rest-3',
        restaurantName: 'SanaTentación Veggie Bistro',
        name: 'Wrap Vegano de Tofu Crocante y Hummus',
        description: 'Tortilla integral de masa madre rellena de tofu crocante al pimentón, hummus casero de remolacha, pepino persa y brotes tiernos.',
        detailedDescription: 'Opción 100% basada en plantas, rica en fibra prebiótica y proteínas completas gracias al tofu no transgénico y garbanzos.',
        price: 24.0,
        imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=500',
        category: 'Wraps',
        portionSizeGrams: 350,
        ingredients: [
          'Tofu orgánico firme no GMO',
          'Tortilla integral artesanal de masa madre',
          'Hummus casero de garbanzo y remolacha',
          'Pepino persa en rodajas',
          'Brotes de alfalfa y rúcula',
          'Pimentón de la Vera ahumado',
        ],
        allergens: ['Soja (Tofu)', 'Gluten (Masa madre)'],
        preparationMethod: 'Tofu horneado en cubos crocantes sin freír; hummus preparado en frío.',
        dietaryCertifications: ['100% Vegano', 'Libre de Colesterol', 'Sin Lácteos'],
        nutritionalInfo: {
          calories: 340,
          proteinGrams: 20,
          carbsGrams: 36,
          fatGrams: 12,
          fiberGrams: 8,
          saturatedFatGrams: 1.5,
          sugarGrams: 3.0,
          sodiumMg: 290,
          glycemicIndex: 'Bajo',
          nutriScore: 'A',
          vitaminsAndMinerals: {
            'Calcio vegetal': '20% VD',
            'Hierro': '18% VD',
            'Folatos': '25% VD',
          },
        },
        dietaryTags: ['vegano', 'vegetariano', 'organico', 'bajo en calorias', 'sin lactosa'],
        healthGoals: ['weight_loss', 'detox', 'balanced'],
        isPopular: true,
        isAvailable: true,
        rating: 4.7,
        createdAt: new Date('2026-01-12'),
      },
      {
        id: 'menu-6',
        restaurantId: 'rest-3',
        restaurantName: 'SanaTentación Veggie Bistro',
        name: 'Curry Verde Tailandés de Lentejas y Vegetales',
        description: 'Guiso aromático con leche de coco ligera, curry verde artesanal, lentejas pardinas, calabacín, champiñones y arroz jazmín integral.',
        detailedDescription: 'Plato reconfortante antiinflamatorio con cúrcuma fresca, jengibre y leche de coco ligera. Ayuda al bienestar digestivo y refuerza el sistema inmune.',
        price: 29.0,
        imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500',
        category: 'Platos Principales',
        portionSizeGrams: 420,
        ingredients: [
          'Lentejas pardinas bio',
          'Leche de coco light sin conservantes',
          'Pasta casera de curry verde y hierba luisa',
          'Calabacín tierno',
          'Champiñones portobello',
          'Arroz jazmín integral',
        ],
        allergens: [],
        preparationMethod: 'Fuego lento en cocción al vapor para preservar los antioxidantes del jengibre y cúrcuma.',
        dietaryCertifications: ['100% Vegano', 'Sin Gluten', 'Sin Lácteos'],
        nutritionalInfo: {
          calories: 420,
          proteinGrams: 18,
          carbsGrams: 54,
          fatGrams: 14,
          fiberGrams: 11,
          saturatedFatGrams: 4.2,
          sugarGrams: 4.5,
          sodiumMg: 350,
          glycemicIndex: 'Medio',
          nutriScore: 'A',
          vitaminsAndMinerals: {
            'Hierro': '35% VD',
            'Zinc': '20% VD',
            'Magnesio': '25% VD',
          },
        },
        dietaryTags: ['vegano', 'vegetariano', 'sin gluten', 'sin lactosa'],
        healthGoals: ['balanced', 'detox'],
        isPopular: false,
        isAvailable: true,
        rating: 4.6,
        createdAt: new Date('2026-01-12'),
      },
      {
        id: 'menu-7',
        restaurantId: 'rest-4',
        restaurantName: 'PureJuice & Smoothies Lab',
        name: 'Smoothie Verde Detox Alcalinizante (500ml)',
        description: 'Espinaca baby, pepino, apio, manzana verde, jengibre fresco y espirulina orgánica sin endulzantes artificiales.',
        detailedDescription: 'Elixir desintoxicante prensado en frío con clorofila pura y superalimento espirulina azul-verde. Alcaliniza el organismo y favorece la digestión.',
        price: 16.0,
        imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500',
        category: 'Bebidas & Detox',
        portionSizeGrams: 500,
        ingredients: [
          'Espinaca baby fresca',
          'Pepino persa con cáscara',
          'Apio criollo',
          'Manzana verde Granny Smith',
          'Jengibre fresco prensado',
          'Espirulina pura en polvo',
        ],
        allergens: [],
        preparationMethod: 'Prensado en frío (Cold-pressed) en prensa hidráulica a 4°C sin pasteurización térmica.',
        dietaryCertifications: ['100% Crudo', 'Sin Azúcar Añadida', 'Sin Gluten', '100% Vegano'],
        nutritionalInfo: {
          calories: 140,
          proteinGrams: 4,
          carbsGrams: 28,
          fatGrams: 1,
          fiberGrams: 5,
          saturatedFatGrams: 0.1,
          sugarGrams: 18.0,
          sodiumMg: 75,
          glycemicIndex: 'Bajo',
          nutriScore: 'A',
          vitaminsAndMinerals: {
            'Vitamina C': '85% VD',
            'Vitamina A': '90% VD',
            'Clorofila': '100mg',
          },
        },
        dietaryTags: ['vegano', 'detox', 'sin gluten', 'bajo en calorias', 'organico'],
        healthGoals: ['weight_loss', 'detox'],
        isPopular: true,
        isAvailable: true,
        rating: 4.9,
        createdAt: new Date('2026-01-13'),
      },
      {
        id: 'menu-8',
        restaurantId: 'rest-4',
        restaurantName: 'PureJuice & Smoothies Lab',
        name: 'Bowl Açai Silvestre con Granola Keto',
        description: 'Pulpa pura de açaí orgánico batida con plátano congelado, cubierta con fresas frescas, semillas de cáñamo y granola sin gluten de almendras y coco.',
        detailedDescription: 'Superbowl antioxidante de açaí silvestre del Amazonas. Contiene antocianinas protectoras celulares y grasas saludables provenientes de frutos secos y semillas de cáñamo.',
        price: 26.0,
        imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=500',
        category: 'Bowls',
        portionSizeGrams: 360,
        ingredients: [
          'Pulpa pura de açaí orgánico del Amazonas (sin endulzar)',
          'Plátano orgánico congelado',
          'Fresas frescas locales',
          'Semillas de cáñamo (hemp seeds)',
          'Granola keto de coco tostado y almendras',
        ],
        allergens: ['Frutos secos (Almendras)'],
        preparationMethod: 'Batido en licuadora de alta potencia a baja temperatura para textura suave.',
        dietaryCertifications: ['Sin Gluten', 'Superfood Certified', '100% Vegano'],
        nutritionalInfo: {
          calories: 310,
          proteinGrams: 9,
          carbsGrams: 46,
          fatGrams: 10,
          fiberGrams: 8,
          saturatedFatGrams: 3.5,
          sugarGrams: 16.0,
          sodiumMg: 45,
          glycemicIndex: 'Bajo',
          nutriScore: 'A',
          vitaminsAndMinerals: {
            'Antioxidantes (ORAC)': '12,000 unidades',
            'Vitamina C': '50% VD',
            'Hierro': '15% VD',
          },
        },
        dietaryTags: ['vegano', 'sin gluten', 'antioxidante', 'organico'],
        healthGoals: ['detox', 'balanced'],
        isPopular: true,
        isAvailable: true,
        rating: 4.9,
        createdAt: new Date('2026-01-13'),
      },
    ];

    for (const m of menusList) {
      this.menuItems.set(m.id, m);
    }

    // 4. Seed Foundations for Automatic Donation (Sprint 4: HE-HU5-005)
    const foundationsList: Foundation[] = [
      {
        id: 'found-wfp',
        name: 'World Food Programme (WFP)',
        cause: 'Lucha contra el hambre',
        description: 'Programa Mundial de Alimentos de las Naciones Unidas.',
        logoUrl: '',
        totalRaised: 0,
      },
      {
        id: 'found-1',
        name: 'Banco de Alimentos Perú',
        cause: 'Rescate de alimentos y lucha contra la desnutrición infantil',
        description: 'Organización que rescata alimentos aptos para consumo y los distribuye a comedores populares y albergues.',
        logoUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=150',
        totalRaised: 14250.0,
      },
      {
        id: 'found-2',
        name: 'Comedores Saludables Comunitarios',
        cause: 'Nutrición balanceada en zonas de escasos recursos',
        description: 'Impulsa huertos comunitarios y menús saludables en ollas comunes de Lima y provincias.',
        logoUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=150',
        totalRaised: 8900.0,
      },
      {
        id: 'found-3',
        name: 'NutriAcción Infantil',
        cause: 'Erradicación de la anemia en infantes',
        description: 'Provee suplementos alimenticios y alimentos ricos en hierro para niños menores de 5 años.',
        logoUrl: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=150',
        totalRaised: 11200.0,
      },
    ];

    for (const f of foundationsList) {
      this.foundations.set(f.id, f);
    }

    // 5. Seed Gamification Achievements (Sprint 6: HE-HU7-007)
    const achievementsList: Achievement[] = [
      {
        id: 'ach-1',
        title: 'Primer Paso Saludable',
        description: 'Realiza tu primer pedido de comida nutritiva en HealthExpress.',
        badgeIcon: '🥗',
        category: 'ORDERS',
        targetCount: 1,
      },
      {
        id: 'ach-2',
        title: 'Héroe del Impacto Social',
        description: 'Genera donaciones automáticas para alimentar a más de 5 familias.',
        badgeIcon: '🤝',
        category: 'COMMUNITY',
        targetCount: 5,
      },
      {
        id: 'ach-3',
        title: 'Gourmet Veggie',
        description: 'Pide 3 platos veganos o vegetarianos.',
        badgeIcon: '🌱',
        category: 'HEALTH',
        targetCount: 3,
      },
      {
        id: 'ach-4',
        title: 'Constancia Fit',
        description: 'Mantén una racha saludable completando 5 pedidos.',
        badgeIcon: '💪',
        category: 'HEALTH',
        targetCount: 5,
      },
    ];

    for (const a of achievementsList) {
      this.achievements.set(a.id, a);
    }

    // Initialize achievements for demo user
    const userAchMap = new Map<string, UserAchievementProgress>();
    for (const a of achievementsList) {
      userAchMap.set(a.id, {
        achievementId: a.id,
        achievement: a,
        currentCount: a.id === 'ach-1' ? 1 : 0,
        isUnlocked: a.id === 'ach-1',
        unlockedAt: a.id === 'ach-1' ? new Date('2026-01-15T12:00:00Z') : undefined,
      });
    }
    this.userAchievements.set('user-demo-1', userAchMap);

    // 6. Seed Demo Notifications (Sprint 6: HE-HU7-007)
    const notificationsList: Notification[] = [
      {
        id: 'notif-1',
        userId: 'user-demo-1',
        title: '🎉 ¡Bienvenido a HealthExpress!',
        message: 'Disfruta de 20% de descuento en tu primer pedido usando el cupón SALUDABLE20.',
        type: 'PROMOTION',
        isRead: false,
        createdAt: new Date('2026-01-10T10:05:00Z'),
      },
      {
        id: 'notif-2',
        userId: 'user-demo-1',
        title: '🏆 ¡Logro desbloqueado: Primer Paso Saludable!',
        message: 'Has dado el primer paso hacia una vida más saludable. Revisa tus insignias en tu perfil.',
        type: 'ACHIEVEMENT',
        isRead: true,
        createdAt: new Date('2026-01-15T12:00:00Z'),
      },
      {
        id: 'notif-3',
        userId: 'user-demo-1',
        title: '💚 Tu compra generó impacto',
        message: 'Con tu último pedido se donaron S/ 1.71 automáticamente al Banco de Alimentos Perú.',
        type: 'DONATION',
        isRead: false,
        createdAt: new Date('2026-01-15T12:01:00Z'),
      },
    ];

    for (const n of notificationsList) {
      this.notifications.set(n.id, n);
    }

    // 7. Seed Demo Order & Donation History (Sprint 5: HE-HU6-006)
    const demoOrder: Order = {
      id: 'order-demo-1001',
      userId: 'user-demo-1',
      restaurantId: 'rest-1',
      restaurantName: 'GreenBowl Healthy Bar',
      items: [
        {
          id: 'item-demo-1',
          menuItemId: 'menu-1',
          name: 'Bowl Quinoa & Pollo Grill Proteico',
          price: 28.5,
          quantity: 2,
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
          restaurantId: 'rest-1',
          restaurantName: 'GreenBowl Healthy Bar',
          specialInstructions: 'Sin cebolla',
          nutritionalInfo: {
            calories: 450,
            proteinGrams: 35,
            carbsGrams: 42,
            fatGrams: 14,
            fiberGrams: 9,
          },
          lineTotal: 57.0,
        },
      ],
      subtotal: 57.0,
      deliveryFee: 4.5,
      total: 61.5,
      totalNutrition: {
        calories: 900,
        proteinGrams: 70,
        carbsGrams: 84,
        fatGrams: 28,
        fiberGrams: 18,
      },
      deliveryAddress: {
        street: 'Av. Primavera 1234, Dpto 402',
        city: 'Santiago de Surco, Lima',
        reference: 'Frente al parque Chacarilla',
      },
      contactPhone: '+51987654321',
      status: OrderStatus.DELIVERED,
      paymentId: 'pay-demo-1001',
      donationId: 'don-demo-1001',
      tracking: {
        currentStatus: OrderStatus.DELIVERED,
        progressPercentage: 100,
        estimatedDeliveryTimeMinutes: 0,
        driverName: 'Jorge Ramírez',
        driverPhone: '+51 981 123 456',
        vehiclePlate: 'MOT-7821',
        currentCoordinates: { lat: -12.112, lng: -76.994 },
        timeline: [
          {
            status: OrderStatus.CONFIRMED,
            label: 'Pedido confirmado',
            timestamp: new Date('2026-01-15T12:00:00Z'),
            completed: true,
            description: 'El restaurante ha recibido y confirmado tu pedido.',
          },
          {
            status: OrderStatus.PREPARING,
            label: 'Preparando alimentos',
            timestamp: new Date('2026-01-15T12:05:00Z'),
            completed: true,
            description: 'El chef está preparando tus platos con ingredientes frescos.',
          },
          {
            status: OrderStatus.ON_THE_WAY,
            label: 'Repartidor en camino',
            timestamp: new Date('2026-01-15T12:20:00Z'),
            completed: true,
            description: 'Jorge va en camino con tu comida saludable.',
          },
          {
            status: OrderStatus.DELIVERED,
            label: 'Pedido entregado',
            timestamp: new Date('2026-01-15T12:35:00Z'),
            completed: true,
            description: '¡Buen provecho! Pedido entregado en tu puerta.',
          },
        ],
      },
      createdAt: new Date('2026-01-15T12:00:00Z'),
      updatedAt: new Date('2026-01-15T12:35:00Z'),
    };
    this.orders.set(demoOrder.id, demoOrder);

    const demoPayment: Payment = {
      id: 'pay-demo-1001',
      orderId: 'order-demo-1001',
      userId: 'user-demo-1',
      amount: 61.5,
      paymentMethod: 'credit_card',
      status: 'APPROVED',
      cardLast4: '4242',
      cardBrand: 'Visa',
      transactionReference: 'TXN-98234-HE',
      receiptNumber: 'REC-20260115-001',
      processedAt: new Date('2026-01-15T12:00:30Z'),
    };
    this.payments.set(demoPayment.id, demoPayment);

    const demoDonation: Donation = {
      id: 'don-demo-1001',
      orderId: 'order-demo-1001',
      userId: 'user-demo-1',
      foundationId: 'found-1',
      foundationName: 'Banco de Alimentos Perú',
      orderTotal: 61.5,
      percentage: 3,
      donationAmount: 1.85,
      mealsEquivalent: 1,
      createdAt: new Date('2026-01-15T12:00:30Z'),
    };
    this.donations.set(demoDonation.id, demoDonation);

    // 8. Seed Demo Favorites (Sprint 8: HE-HU12-012)
    const favRestaurant: Favorite = {
      id: 'fav-demo-1',
      userId: 'user-demo-1',
      type: 'RESTAURANT',
      targetId: 'rest-1',
      restaurant: this.restaurants.get('rest-1'),
      createdAt: new Date('2026-01-12T14:00:00Z'),
    };
    this.favorites.set(favRestaurant.id, favRestaurant);

    const favDish: Favorite = {
      id: 'fav-demo-2',
      userId: 'user-demo-1',
      type: 'MENU_ITEM',
      targetId: 'menu-1',
      menuItem: this.menuItems.get('menu-1'),
      createdAt: new Date('2026-01-14T16:30:00Z'),
    };
    this.favorites.set(favDish.id, favDish);
  }
}
