import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { FavoriteType } from '../entities/favorite.entity';

export class ToggleFavoriteDto {
  @ApiProperty({
    example: 'MENU_ITEM',
    enum: ['RESTAURANT', 'MENU_ITEM'],
    description: 'Tipo de elemento a añadir o remover de favoritos',
  })
  @IsIn(['RESTAURANT', 'MENU_ITEM'], {
    message: 'type debe ser RESTAURANT o MENU_ITEM',
  })
  type: FavoriteType;

  @ApiProperty({
    example: 'menu-1',
    description: 'ID del restaurante o plato a alternar en favoritos',
  })
  @IsString()
  @IsNotEmpty({ message: 'targetId es obligatorio' })
  targetId: string;
}
