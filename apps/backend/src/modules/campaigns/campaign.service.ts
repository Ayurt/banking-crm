import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ResponseBuilder } from '../../common/utils/response.builder';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CampaignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly response: ResponseBuilder,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { deletedAt: null },
        include: { customer: { select: { firstName: true, lastName: true, customerCode: true } } },
        orderBy: { [query.sort === 'createdAt' ? 'createdAt' : 'sentDate']: query.order },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.campaign.count({ where: { deletedAt: null } }),
    ]);
    return this.response.paginated(data, { page: query.page, limit: query.pageSize, total });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, deletedAt: null },
      include: { customer: true },
    });
    if (!campaign) {
      throw new NotFoundException({ message: 'Campaign not found', errorCode: 'CAMPAIGN_NOT_FOUND' });
    }
    return this.response.success(campaign, 'Campaign retrieved successfully');
  }

  async create(dto: CreateCampaignDto) {
    const campaign = await this.prisma.campaign.create({
      data: {
        customerId: dto.customerId,
        campaignName: dto.campaignName,
        channel: dto.channel ?? 'WHATSAPP',
      },
    });
    return this.response.success(campaign, 'Campaign created successfully');
  }
}
