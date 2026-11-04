import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class AddAddressDto {
  @ApiProperty({ example: 'Casa', description: 'Etiqueta identificativa de la dirección (Casa, Oficina, Gym)' })
  @IsString()
  @IsNotEmpty({ message: 'La etiqueta es obligatoria' })
  label: string;

  @ApiProperty({ example: 'Av. Primavera 1234, Dpto 402', description: 'Dirección exacta (calle y número)' })
  @IsString()
  @IsNotEmpty({ message: 'La calle es obligatoria' })
  street: string;

  @ApiProperty({ example: 'Santiago de Surco, Lima', description: 'Ciudad o distrito' })
  @IsString()
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  city: string;

  @ApiPropertyOptional({ example: 'Frente al parque Chacarilla', description: 'Referencia de ubicación' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: true, description: 'Establecer como dirección predeterminada' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
