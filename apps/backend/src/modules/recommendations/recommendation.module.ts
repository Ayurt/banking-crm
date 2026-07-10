import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { CustomerRepository } from '../customers/customer.repository';
import { TransactionRepository } from '../transactions/transaction.repository';
import { CrmRepository } from '../crm/crm.repository';
import { LoanRepository } from '../loans/loan.repository';
import { CampaignRepository } from '../campaigns/campaign.repository';
import { ProductRepository } from '../products/product.repository';

@Module({
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    CustomerRepository,
    TransactionRepository,
    CrmRepository,
    LoanRepository,
    CampaignRepository,
    ProductRepository,
  ],
})
export class RecommendationModule {}
