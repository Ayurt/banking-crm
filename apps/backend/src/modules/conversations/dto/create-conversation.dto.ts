import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional({ example: 'Personal loan outreach Q3' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
