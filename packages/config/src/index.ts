import * as dotenv from 'dotenv';

dotenv.config();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getBool(key: string, defaultValue = false): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

function getNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export const config = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: getNumber('PORT', 3000),
  databaseUrl: getEnv('DATABASE_URL', 'postgresql://banking:banking123@localhost:5432/banking_crm?schema=public'),
  redisUrl: getEnv('REDIS_URL', 'redis://localhost:6379'),
  chromaUrl: getEnv('CHROMA_URL', 'http://localhost:8000'),
  openaiApiKey: getEnv('OPENAI_API_KEY', ''),
  openaiModel: getEnv('OPENAI_MODEL', 'gpt-4.1'),
  jwtSecret: getEnv('JWT_SECRET', 'dev-secret-change-in-production'),
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '24h'),
  logLevel: getEnv('LOG_LEVEL', 'info'),
  cacheTtl: getNumber('CACHE_TTL', 300),
  frontendUrl: getEnv('FRONTEND_URL', 'http://localhost:5173'),
  features: {
    memory: getBool('ENABLE_MEMORY', true),
    streaming: getBool('ENABLE_STREAMING', true),
    audit: getBool('ENABLE_AUDIT', true),
    cache: getBool('ENABLE_CACHE', true),
  },
  businessRules: {
    minimumPersonalLoanIncome: getNumber('MIN_PERSONAL_LOAN_INCOME', 30000),
    minimumCreditScore: getNumber('MIN_CREDIT_SCORE', 700),
    premiumLoanIncome: getNumber('PREMIUM_LOAN_INCOME', 100000),
    minimumRelationshipYears: getNumber('MIN_RELATIONSHIP_YEARS', 1),
    maximumMissedPayments: getNumber('MAX_MISSED_PAYMENTS', 1),
    minAge: getNumber('MIN_AGE', 21),
    maxAge: getNumber('MAX_AGE', 60),
    personalLoanMinConversion: getNumber('PERSONAL_LOAN_MIN_CONVERSION', 70),
    premiumLoanMinConversion: getNumber('PREMIUM_LOAN_MIN_CONVERSION', 90),
    premiumLoanMinCredit: getNumber('PREMIUM_LOAN_MIN_CREDIT', 780),
    premiumLoanMinRelationship: getNumber('PREMIUM_LOAN_MIN_RELATIONSHIP', 5),
    creditCardMinCredit: getNumber('CREDIT_CARD_MIN_CREDIT', 730),
    minConversionThreshold: getNumber('MIN_CONVERSION_THRESHOLD', 40),
    inactiveCustomerMonths: getNumber('INACTIVE_CUSTOMER_MONTHS', 6),
    highBalanceThreshold: getNumber('HIGH_BALANCE_THRESHOLD', 200000),
    baseConfidence: getNumber('BASE_CONFIDENCE', 70),
  },
  /** @deprecated Use businessRules — kept for backward compatibility */
  scoring: {
    minIncomePersonalLoan: getNumber('MIN_PERSONAL_LOAN_INCOME', 30000),
    minCreditScorePersonalLoan: getNumber('MIN_CREDIT_SCORE', 700),
    minRelationshipYears: getNumber('MIN_RELATIONSHIP_YEARS', 1),
    highValueIncomeThreshold: getNumber('PREMIUM_LOAN_INCOME', 100000),
    excellentCreditThreshold: getNumber('PREMIUM_LOAN_MIN_CREDIT', 780),
  },
};

export type AppConfig = typeof config;
