import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { MenusModule } from './modules/menus/menus.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DonationsModule } from './modules/donations/donations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { ProfileModule } from './modules/profile/profile.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    RestaurantsModule,
    MenusModule,
    RecommendationsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    DonationsModule,
    NotificationsModule,
    AchievementsModule,
    ProfileModule,
    FavoritesModule,
  ],
})
export class AppModule {}
