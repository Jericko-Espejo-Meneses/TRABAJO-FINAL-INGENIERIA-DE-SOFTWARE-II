-- Safe, repeatable catalog repair for the IDs used by the application demo.
-- It does not delete orders, users, payments, donations, or existing stock.
BEGIN;

INSERT INTO menu_items (
  id, "restaurantId", name, description, price, "imageUrl", category,
  "dietaryTags", allergens, ingredients, "nutriScore", "glycemicIndex",
  "createdAt", "updatedAt"
)
VALUES
  (
    'menu-6', 'rest-3', 'Curry Verde Tailandés de Lentejas y Vegetales',
    'Guiso de lentejas, leche de coco ligera, curry verde, vegetales y arroz integral.',
    29.0, 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500',
    'Platos Principales', '["vegano","vegetariano","sin gluten","sin lactosa"]',
    '[]', '["Lentejas pardinas","Leche de coco","Curry verde","Calabacín","Champiñones","Arroz jazmín integral"]',
    'A', 'Medio', NOW(), NOW()
  ),
  (
    'menu-7', 'rest-4', 'Smoothie Verde Detox Alcalinizante (500ml)',
    'Espinaca, pepino, apio, manzana verde, jengibre y espirulina orgánica.',
    16.0, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500',
    'Bebidas & Detox', '["vegano","detox","sin gluten","bajo en calorias","organico"]',
    '[]', '["Espinaca","Pepino","Apio","Manzana verde","Jengibre","Espirulina"]',
    'A', 'Bajo', NOW(), NOW()
  ),
  (
    'menu-8', 'rest-4', 'Bowl Açai Silvestre con Granola Keto',
    'Açai orgánico con plátano, fresas, semillas de cáñamo y granola keto.',
    26.0, 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=500',
    'Bowls', '["vegano","sin gluten","antioxidante","organico"]',
    '["Frutos secos (Almendras)"]', '["Açai","Plátano","Fresas","Semillas de cáñamo","Granola de coco y almendras"]',
    'A', 'Bajo', NOW(), NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  "restaurantId" = EXCLUDED."restaurantId",
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  "imageUrl" = EXCLUDED."imageUrl",
  category = EXCLUDED.category,
  "dietaryTags" = EXCLUDED."dietaryTags",
  allergens = EXCLUDED.allergens,
  ingredients = EXCLUDED.ingredients,
  "nutriScore" = EXCLUDED."nutriScore",
  "glycemicIndex" = EXCLUDED."glycemicIndex",
  "updatedAt" = NOW();

COMMIT;
