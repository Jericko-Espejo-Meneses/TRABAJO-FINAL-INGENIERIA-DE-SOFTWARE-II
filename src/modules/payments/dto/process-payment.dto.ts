import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';
import { PaymentMethodType } from '../entities/payment.entity';

export class ProcessPaymentDto {
  @ApiProperty({ example: 'order-123456', description: 'ID de la orden a pagar' })
  @IsString()
  @IsNotEmpty({ message: 'El ID de la orden es obligatorio' })
  orderId: string;

  @ApiProperty({
    example: 'credit_card',
    enum: ['credit_card', 'debit_card', 'yape', 'plin', 'cash'],
    description: 'Método de pago seleccionado por el usuario',
  })
  @IsIn(['credit_card', 'debit_card', 'yape', 'plin', 'cash'], {
    message: 'Método de pago no válido (debe ser credit_card, debit_card, yape, plin o cash)',
  })
  paymentMethod: PaymentMethodType;

  // Campos para Tarjeta de Crédito / Débito
  @ApiPropertyOptional({ example: '4242424242424242', description: 'Número de tarjeta (simulación)' })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiPropertyOptional({ example: 'Juan Pérez', description: 'Nombre del titular de la tarjeta' })
  @IsOptional()
  @IsString()
  cardHolderName?: string;

  @ApiPropertyOptional({ example: '12/28', description: 'Fecha de expiración MM/AA' })
  @IsOptional()
  @IsString()
  cardExpiration?: string;

  @ApiPropertyOptional({ example: '123', description: 'Código de seguridad CVV' })
  @IsOptional()
  @IsString()
  cardCvv?: string;

  // Campos para Billeteras Digitales (Yape / Plin)
  @ApiPropertyOptional({ example: '987654321', description: 'Número de teléfono de la billetera digital' })
  @IsOptional()
  @IsString()
  walletPhone?: string;

  @ApiPropertyOptional({ example: '123456', description: 'Código de aprobación de la billetera' })
  @IsOptional()
  @IsString()
  walletOtpCode?: string;

  @ApiPropertyOptional({
    example: 'found-1',
    description: 'ID de la fundación para la donación automática del 3%',
  })
  @IsOptional()
  @IsString()
  preferredFoundationId?: string;
}
