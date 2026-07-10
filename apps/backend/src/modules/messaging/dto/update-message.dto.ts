import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageStatus } from '@prisma/client';

export class UpdateMessageDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ enum: MessageStatus })
  @IsEnum(MessageStatus)
  status!: MessageStatus;
}
