import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { CustomerRepository } from '../customers/customer.repository';
import { CrmRepository } from '../crm/crm.repository';
import { ProductRepository } from '../products/product.repository';

@Module({
  controllers: [MessagingController],
  providers: [MessagingService, CustomerRepository, CrmRepository, ProductRepository],
  exports: [MessagingService],
})
export class MessagingModule {}
