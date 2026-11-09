import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({ example: 'usuario.demo@healthexpress.com', description: 'Correo electrónico registrado' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email?: string;

  @ApiPropertyOptional({ example: 'usuario.demo@healthexpress.com', description: 'Alias en español enviado por el frontend' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  correo?: string;

  @ApiPropertyOptional({ example: 'Password123!', description: 'Contraseña del usuario' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: 'Password123!', description: 'Alias en español enviado por el frontend' })
  @IsOptional()
  @IsString()
  contrasena?: string;
}
