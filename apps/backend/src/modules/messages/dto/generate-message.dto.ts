import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import type { ProductType } from '@banking-crm/shared-types';

export class GenerateMessageDto {
  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiProperty({ enum: ['PERSONAL_LOAN', 'FIXED_DEPOSIT', 'CREDIT_CARD', 'HOME_LOAN'] })
  @IsEnum(['PERSONAL_LOAN', 'FIXED_DEPOSIT', 'CREDIT_CARD', 'HOME_LOAN'])
  productType!: ProductType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
