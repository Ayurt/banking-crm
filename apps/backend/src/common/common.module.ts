import { Global, Module } from '@nestjs/common';
import { ResponseBuilder } from './utils/response.builder';

@Global()
@Module({
  providers: [ResponseBuilder],
  exports: [ResponseBuilder],
})
export class CommonModule {}
