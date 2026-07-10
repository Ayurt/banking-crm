import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { AgentOrchestratorService } from '../../agents/orchestrator/agent-orchestrator.service';
import { CustomerRepository } from '../customers/customer.repository';
import { TransactionRepository } from '../transactions/transaction.repository';
import { CrmRepository } from '../crm/crm.repository';
import { LoanRepository } from '../loans/loan.repository';
import { ProductRepository } from '../products/product.repository';

import { CampaignRepository } from '../campaigns/campaign.repository';
import { MemoryRepository } from './memory.repository';

@Module({
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    AgentOrchestratorService,
    CustomerRepository,
    TransactionRepository,
    CrmRepository,
    LoanRepository,
    ProductRepository,
    MemoryRepository,
    CampaignRepository,
  ],
  exports: [ConversationsService],
})
export class ConversationsModule {}
