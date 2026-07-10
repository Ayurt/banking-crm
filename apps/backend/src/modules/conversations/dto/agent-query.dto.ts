import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AgentQueryDto {
  @ApiProperty({
    example: 'Find high-value customers likely to convert for a personal loan this month and generate personalized WhatsApp messages.',
  })
  @IsString()
  @IsNotEmpty()
  query!: string;
}
