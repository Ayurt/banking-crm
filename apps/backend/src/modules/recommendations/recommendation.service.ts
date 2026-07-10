import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ResponseBuilder } from '../../common/utils/response.builder';
import { CustomerRepository } from '../customers/customer.repository';
import { TransactionRepository } from '../transactions/transaction.repository';
import { CrmRepository } from '../crm/crm.repository';
import { LoanRepository } from '../loans/loan.repository';
import { CampaignRepository } from '../campaigns/campaign.repository';
import { ProductRepository } from '../products/product.repository';
import { ScoringTool, RecommendationTool } from '../../tools';
import { GenerateRecommendationDto } from './dto/generate-recommendation.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class RecommendationService {
  private readonly scoringTool = new ScoringTool();
  private readonly recommendationTool: RecommendationTool;

  constructor(
    private readonly prisma: PrismaService,
    private readonly customerRepo: CustomerRepository,
    private readonly transactionRepo: TransactionRepository,
    private readonly crmRepo: CrmRepository,
    private readonly loanRepo: LoanRepository,
    private readonly campaignRepo: CampaignRepository,
    productRepo: ProductRepository,
    private readonly response: ResponseBuilder,
  ) {
    this.recommendationTool = new RecommendationTool(productRepo);
  }

  async generate(dto: GenerateRecommendationDto, userId: string) {
    const customer = await this.customerRepo.findById(dto.customerId);
    if (!customer) {
      throw new NotFoundException({ message: 'Customer not found', errorCode: 'CUSTOMER_NOT_FOUND' });
    }

    const [transactions, crmNotes, loanHistory, campaigns] = await Promise.all([
      this.transactionRepo.findByCustomerIds([dto.customerId]),
      this.crmRepo.findByCustomerIds([dto.customerId]),
      this.loanRepo.findByCustomerIds([dto.customerId]),
      this.campaignRepo.findByCustomerIds([dto.customerId]),
    ]);

    const scoring = await this.scoringTool.execute({
      customers: [customer],
      productType: dto.productType,
      transactions,
      crmNotes,
      loanHistory,
      campaigns,
    });

    const score = scoring.scores[0];
    if (!score?.eligible) {
      throw new UnprocessableEntityException({
        message: score?.reasons?.join(', ') ?? 'Customer not eligible',
        errorCode: 'NOT_ELIGIBLE',
      });
    }

    const recResult = await this.recommendationTool.execute({
      customers: [customer],
      scores: scoring.scores,
      productType: dto.productType,
      transactions,
      crmNotes,
    });

    const recommendation = recResult.recommendations[0];
    if (!recommendation) {
      throw new UnprocessableEntityException({
        message: 'No recommendation generated',
        errorCode: 'NOT_ELIGIBLE',
      });
    }

    const product = await this.prisma.product.findUnique({ where: { category: dto.productType } });
    const saved = await this.prisma.productRecommendation.create({
      data: {
        customerId: dto.customerId,
        productId: product!.id,
        conversationId: dto.conversationId,
        conversionScore: recommendation.conversionScore,
        confidence: recommendation.confidence,
        reason: recommendation.reasons,
        recommendedById: userId,
      },
      include: { product: true, customer: true },
    });

    return this.response.success(
      { recommendation, persisted: saved },
      'Recommendation generated successfully',
    );
  }

  async findAll(query: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.prisma.productRecommendation.findMany({
        include: { product: true, customer: true },
        orderBy: [{ confidence: 'desc' }, { conversionScore: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.productRecommendation.count(),
    ]);
    return this.response.paginated(data, { page: query.page, limit: query.pageSize, total });
  }

  async findOne(id: string) {
    const rec = await this.prisma.productRecommendation.findUnique({
      where: { id },
      include: { product: true, customer: true, conversation: true },
    });
    if (!rec) {
      throw new NotFoundException({ message: 'Recommendation not found', errorCode: 'RECOMMENDATION_NOT_FOUND' });
    }
    return this.response.success(rec, 'Recommendation retrieved successfully');
  }
}
