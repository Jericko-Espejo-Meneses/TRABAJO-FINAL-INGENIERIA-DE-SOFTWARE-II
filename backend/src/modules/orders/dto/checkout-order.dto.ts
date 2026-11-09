import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CheckoutOrderDto {
  @ApiProperty({ example: 'Av. Primavera 1234, Dpto 402', description: 'Dirección de entrega' })
  @IsString()
  @IsNotEmpty({ message: 'La calle y número de entrega son obligatorios' })
  street: string;

  @ApiProperty({ example: 'Santiago de Surco, Lima', description: 'Distrito o ciudad' })
  @IsString()
  @IsNotEmpty({ message: 'La ciudad o distrito es obligatorio' })
  city: string;

  @ApiPropertyOptional({ example: 'Frente al parque Chacarilla', description: 'Referencia para el repartidor' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'Dejar en recepción por favor', description: 'Instrucciones especiales de entrega' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: '+51987654321', description: 'Teléfono de contacto del cliente' })
  @IsString()
  @IsNotEmpty({ message: 'El teléfono de contacto es obligatorio' })
  contactPhone: string;

  @ApiPropertyOptional({
    example: 'found-1',
    description: 'ID de la fundación preferida para destinar la donación automática del 3%',
  })
  @IsOptional()
  @IsString()
  preferredFoundationId?: string;
}
