import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CampaignChannel } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiProperty({ example: 'Personal Loan Q3 Outreach' })
  @IsString()
  campaignName!: string;

  @ApiPropertyOptional({ enum: CampaignChannel, default: 'WHATSAPP' })
  @IsOptional()
  @IsEnum(CampaignChannel)
  channel?: CampaignChannel;
}
