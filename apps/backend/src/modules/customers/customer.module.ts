import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CustomerRepository } from './customer.repository';
import { CrmRepository } from '../crm/crm.repository';
import { LoanRepository } from '../loans/loan.repository';
import { TransactionRepository } from '../transactions/transaction.repository';
import { CampaignRepository } from '../campaigns/campaign.repository';
import { ProductRepository } from '../products/product.repository';

@Module({
  controllers: [CustomerController],
  providers: [
    CustomerService,
    CustomerRepository,
    CrmRepository,
    LoanRepository,
    TransactionRepository,
    CampaignRepository,
    ProductRepository,
  ],
  exports: [CustomerRepository],
})
export class CustomerModule {}
