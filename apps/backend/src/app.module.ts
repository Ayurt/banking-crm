import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { CustomThrottleGuard } from './common/guards/custom-throttle.guard';
import { AuthModule } from './modules/auth/auth.module';
import { AgentModule } from './modules/agent/agent.module';
import { CustomerModule } from './modules/customers/customer.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { MessagesModule } from './modules/messages/messages.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { RecommendationModule } from './modules/recommendations/recommendation.module';
import { ProductModule } from './modules/products/product.module';
import { CampaignModule } from './modules/campaigns/campaign.module';
import { PromptModule } from './modules/prompts/prompt.module';
import { AuditModule } from './modules/audit/audit.module';
import { FeatureFlagModule } from './modules/feature-flags/feature-flag.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        genReqId: (req) =>
          (req.headers['x-request-id'] as string) ?? randomUUID(),
        customProps: (req) => ({
          userId: (req as { user?: { sub?: string } }).user?.sub,
        }),
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),
    DatabaseModule,
    CommonModule,
    AuthModule,
    AgentModule,
    CustomerModule,
    ConversationsModule,
    MessagingModule,
    MessagesModule,
    RecommendationModule,
    ProductModule,
    CampaignModule,
    PromptModule,
    AuditModule,
    FeatureFlagModule,
    MetricsModule,
    AnalyticsModule,
    EvaluationModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: CustomThrottleGuard }],
})
export class AppModule {}
