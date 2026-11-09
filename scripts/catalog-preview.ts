/** Backend HTTP real con datos QA deterministas; no conecta ni modifica Supabase. */
import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { DatabaseService } from '../src/database/database.service';

async function main() {
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue({ connected: false }).compile();
  const app = module.createNestApplication();
  app.enableCors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  await app.init();
  const db = app.get(DatabaseService);
  // Punto de referencia de la demo del frontend: Miraflores (-12.1211, -77.0297).
  const fixtures = [
    ['rest-1', 0.5, '$', ['vegano', 'bajo en calorias', 'alto en proteina']],
    ['rest-2', 1.5, '$$', ['alto en proteina']],
    ['rest-3', 2.5, '$$', ['vegano']],
    ['rest-4', 0.8, '$', ['vegano', 'bajo en calorias']],
  ] as const;
  for (const [id, km, price, tags] of fixtures) {
    const restaurant = db.restaurants.get(id)!;
    restaurant.name = `QA ${restaurant.name}`;
    restaurant.latitude = -12.1211 + km / 6371 * 180 / Math.PI;
    restaurant.longitude = -77.0297;
    restaurant.priceLevel = price;
    restaurant.dietaryTags = [...tags];
  }
  await app.listen(3000, '127.0.0.1');
  console.log('QA catálogo listo en http://localhost:3000/api. Datos locales de prueba; PostgreSQL desactivado.');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
