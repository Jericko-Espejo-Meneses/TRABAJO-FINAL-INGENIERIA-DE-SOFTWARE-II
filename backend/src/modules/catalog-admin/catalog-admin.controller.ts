import { Transform } from 'class-transformer';
import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsBoolean, IsInt, IsLatitude, IsLongitude, IsNumber, IsPositive, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

// Preserve JSON types before global implicit conversion validates inputs.
const JsonValue = () => Transform(({ obj, key }) => obj[key]);

class RestaurantInput {
  @JsonValue() @IsString() @Matches(/\S/) @MaxLength(150) ownerId: string;
  @JsonValue() @IsString() @Matches(/\S/) @MaxLength(120) name: string;
  @JsonValue() @IsString() @Matches(/\S/) @MaxLength(250) address: string;
  @JsonValue() @IsString() @Matches(/\S/) @MaxLength(80) foodType: string;
  @JsonValue() @IsNumber() @IsLatitude() latitude: number;
  @JsonValue() @IsNumber() @IsLongitude() longitude: number;
}

class DishInput {
  @JsonValue() @IsString() @Matches(/\S/) @MaxLength(120) name: string;
  @JsonValue() @IsString() @Matches(/\S/) @MaxLength(80) category: string;
  @JsonValue() @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() price: number;
  @JsonValue() @IsInt() @Min(0) @Max(2147483647) stock: number;
  @JsonValue() @IsBoolean() isAvailable: boolean;
}

type CatalogRequest = { user: { id: string; catalogPasswordLogin?: boolean } };

@Controller('admin/catalog')
@UseGuards(JwtAuthGuard)
export class CatalogAdminController {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  private passwordSession(req: CatalogRequest): boolean {
    const key = this.config.get<string>('JWT_SECRET') || '';
    return key.length >= 32 && key !== 'healthexpress-super-secure-jwt-secret-key-2026' && req.user.catalogPasswordLogin === true;
  }

  private isAdmin(req: CatalogRequest): boolean {
    const ids = (this.config.get<string>('CATALOG_ADMIN_USER_IDS') || '').split(',').map(id => id.trim());
    return this.passwordSession(req) && ids.includes(req.user.id);
  }

  @Get('access')
  async access(@Req() req: CatalogRequest) {
    const canRegister = this.isAdmin(req);
    const restaurants = this.passwordSession(req)
      ? await this.prisma.restaurant.findMany({ where: { ownerId: req.user.id }, select: { id: true, name: true }, orderBy: { name: 'asc' } })
      : [];
    return { canRegister, restaurants };
  }

  @Get('accounts')
  accounts(@Req() req: CatalogRequest) {
    if (!this.isAdmin(req)) throw new ForbiddenException();
    return this.prisma.user.findMany({
      where: { passwordHash: { not: null } }, select: { id: true, email: true, fullName: true }, orderBy: { email: 'asc' },
    });
  }

  @Post('restaurants')
  async createRestaurant(@Req() req: CatalogRequest, @Body() input: RestaurantInput) {
    if (!this.isAdmin(req)) throw new ForbiddenException();
    const owner = await this.prisma.user.findFirst({
      where: { id: input.ownerId, passwordHash: { not: null } }, select: { id: true },
    });
    if (!owner) throw new NotFoundException('Selecciona una cuenta registrada con contraseña.');
    return this.prisma.restaurant.create({ data: {
      name: input.name.trim(), address: input.address.trim(), foodType: input.foodType.trim(),
      ownerId: owner.id, latitude: input.latitude, longitude: input.longitude, description: '', logoUrl: '', bannerUrl: '',
      phone: '', rating: 0,
    }, select: { id: true, name: true } });
  }

  @Post('restaurants/:id/dishes')
  async createDish(@Req() req: CatalogRequest, @Param('id') restaurantId: string, @Body() input: DishInput) {
    if (!this.passwordSession(req)) throw new ForbiddenException();
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { ownerId: true } });
    if (!restaurant) throw new NotFoundException('Restaurante inexistente.');
    if (restaurant.ownerId !== req.user.id) throw new ForbiddenException('Solo puedes publicar en tus restaurantes.');
    return this.prisma.menuItem.create({ data: {
      restaurantId, name: input.name.trim(), category: input.category.trim(), price: input.price,
      stock: input.stock, isAvailable: input.isAvailable, description: '', imageUrl: '',
    }, select: { id: true, restaurantId: true, name: true } });
  }
}
