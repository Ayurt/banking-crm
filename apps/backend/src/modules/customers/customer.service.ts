import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerRepository } from './customer.repository';
import { CrmRepository } from '../crm/crm.repository';
import { LoanRepository } from '../loans/loan.repository';
import { TransactionRepository } from '../transactions/transaction.repository';
import { CampaignRepository } from '../campaigns/campaign.repository';
import { ProductRepository } from '../products/product.repository';
import { ResponseBuilder } from '../../common/utils/response.builder';
import type { CustomerQueryDto } from './dto/customer-query.dto';

@Injectable()
export class CustomerService {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly crmRepo: CrmRepository,
    private readonly loanRepo: LoanRepository,
    private readonly transactionRepo: TransactionRepository,
    private readonly campaignRepo: CampaignRepository,
    private readonly productRepo: ProductRepository,
    private readonly response: ResponseBuilder,
  ) {}

  async findAll(query: CustomerQueryDto) {
    const result = await this.customerRepo.search(query.page, query.pageSize, {
      q: query.q,
      city: query.city,
      minCreditScore: query.minCreditScore,
      minIncome: query.minIncome,
      sort: query.sort,
      order: query.order,
    });
    return this.response.paginated(result.data, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  }

  async findOne(id: string) {
    const customer = await this.customerRepo.findById(id);
    if (!customer) {
      throw new NotFoundException({ message: 'Customer not found', errorCode: 'CUSTOMER_NOT_FOUND' });
    }
    return this.response.success(customer, 'Customer retrieved successfully');
  }

  async getProfile(id: string) {
    const customer = await this.customerRepo.findById(id);
    if (!customer) {
      throw new NotFoundException({ message: 'Customer not found', errorCode: 'CUSTOMER_NOT_FOUND' });
    }

    const [transactions, loans, crmNotes, campaigns, products] = await Promise.all([
      this.transactionRepo.findByCustomerIds([id]),
      this.loanRepo.findByCustomerIds([id]),
      this.crmRepo.findByCustomerIds([id]),
      this.campaignRepo.findByCustomerIds([id]),
      this.productRepo.findAll(),
    ]);

    return this.response.success(
      { customer, transactions, loans, crmNotes, campaigns, products },
      'Customer profile retrieved successfully',
    );
  }
}
