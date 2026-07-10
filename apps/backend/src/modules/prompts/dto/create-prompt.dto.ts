import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePromptDto {
  @ApiProperty({ example: 'Messaging Prompt' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: '1.1.0' })
  @IsString()
  @MaxLength(20)
  version!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
