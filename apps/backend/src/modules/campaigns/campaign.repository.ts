import { Injectable } from '@nestjs/common';
import type { CampaignRecord } from '@banking-crm/shared-types';
import type { ICampaignRepository } from '@banking-crm/shared-types';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CampaignRepository implements ICampaignRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCustomerIds(customerIds: string[]): Promise<CampaignRecord[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { customerId: { in: customerIds }, deletedAt: null },
      orderBy: { sentDate: 'desc' },
      take: 1000,
    });

    return campaigns.map((c) => ({
      id: c.id,
      customerId: c.customerId,
      campaignName: c.campaignName,
      channel: c.channel,
      opened: c.opened,
      clicked: c.clicked,
      converted: c.converted,
      sentDate: c.sentDate,
    }));
  }
}
