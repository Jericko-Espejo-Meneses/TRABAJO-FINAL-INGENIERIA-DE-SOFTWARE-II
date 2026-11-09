import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuthProvider } from '../../users/entities/user.entity';

export class SocialAuthDto {
  @ApiProperty({
    example: 'google',
    enum: ['google', 'facebook', 'apple'],
    description: 'Proveedor de red social utilizado para autenticación',
  })
  @IsIn(['google', 'facebook', 'apple'], {
    message: 'El proveedor debe ser google, facebook o apple',
  })
  provider: AuthProvider;

  @ApiProperty({
    example: 'google-oauth2-10829384918239',
    description: 'Identificador único del usuario devuelto por la red social',
  })
  @IsString()
  @IsNotEmpty({ message: 'El ID de la red social es obligatorio' })
  providerId: string;

  @ApiProperty({ example: 'carlos.social@gmail.com', description: 'Correo obtenido del perfil social' })
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email: string;

  @ApiProperty({ example: 'Carlos Mendoza', description: 'Nombre del usuario obtenido de la red social' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  fullName: string;

  @ApiPropertyOptional({
    example: 'https://lh3.googleusercontent.com/a/default-user',
    description: 'Foto de perfil devuelta por la red social',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'ya29.a0AfH6SMB...token',
    description: 'Token de acceso de la red social emitido por el proveedor',
  })
  @IsOptional()
  @IsString()
  socialAccessToken?: string;
}
