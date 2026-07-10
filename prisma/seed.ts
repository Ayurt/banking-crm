import {
  PrismaClient,
  ProductCategory,
  LoanStatus,
  Sentiment,
  NotePriority,
  MessageStatus,
  UserRole,
  CustomerRiskProfile,
  CampaignChannel,
  CampaignStatus,
  TransactionType,
  AuditStatus,
  RecommendationStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const FIRST_NAMES = [
  'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Arjun', 'Kavya',
  'Rohan', 'Divya', 'Karan', 'Meera', 'Aditya', 'Pooja', 'Sanjay', 'Neha',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Nair', 'Iyer',
  'Joshi', 'Mehta', 'Verma', 'Rao',
];

const OCCUPATIONS = [
  'Software Engineer', 'Doctor', 'Business Owner', 'CA', 'Marketing Manager',
  'Architect', 'Professor', 'Sales Director',
];

const CITIES = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Pune', state: 'Maharashtra' },
];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - randomBetween(0, daysBack));
  return d;
}

async function main() {
  console.log('🌱 Seeding database per 07-schema-prisma-spec...\n');

  const passwordHash = await bcrypt.hash('password123', 10);
  const rm = await prisma.user.upsert({
    where: { email: 'rm@bank.com' },
    update: {},
    create: {
      firstName: 'Ayush',
      lastName: 'Rawat',
      email: 'rm@bank.com',
      passwordHash,
      role: UserRole.RELATIONSHIP_MANAGER,
    },
  });
  console.log(`✓ User: ${rm.email}`);

  const flags = [
    { key: 'ENABLE_MEMORY', enabled: true, description: 'Session memory' },
    { key: 'ENABLE_STREAMING', enabled: true, description: 'SSE streaming' },
    { key: 'ENABLE_AUDIT', enabled: true, description: 'Audit logging' },
    { key: 'ENABLE_CACHE', enabled: true, description: 'Redis cache' },
    { key: 'ENABLE_EXPLAINABILITY', enabled: true, description: 'Explainability' },
  ];
  for (const f of flags) await prisma.featureFlag.upsert({ where: { key: f.key }, update: f, create: f });

  const promptDefs = [
    { name: 'Planner Prompt', version: 'v1.0.0', description: 'Planner v1' },
    { name: 'Messaging Prompt', version: 'v1.0.0', description: 'Messaging v1' },
    { name: 'Messaging Prompt', version: 'v2.0.0', description: 'Messaging v2' },
    { name: 'Summary Prompt', version: 'v1.0.0', description: 'Summary v1' },
  ];
  const promptVersions = [];
  for (const p of promptDefs) {
    promptVersions.push(
      await prisma.promptVersion.upsert({
        where: { name_version: { name: p.name, version: p.version } },
        update: {},
        create: p,
      }),
    );
  }

  const productDefs = [
    { name: 'Personal Loan Gold', category: ProductCategory.PERSONAL_LOAN, minimumIncome: 50000, minimumCreditScore: 650, minimumRelationshipYears: 1, interestRate: 10.5, maximumLoanAmount: 5000000 },
    { name: 'Credit Card Platinum', category: ProductCategory.CREDIT_CARD, minimumIncome: 40000, minimumCreditScore: 700, minimumRelationshipYears: 0.5, interestRate: 3.5, maximumLoanAmount: 500000 },
    { name: 'FD Plus', category: ProductCategory.FIXED_DEPOSIT, minimumIncome: 25000, minimumCreditScore: 600, minimumRelationshipYears: 0, interestRate: 7.25, maximumLoanAmount: 10000000 },
    { name: 'Home Loan Premium', category: ProductCategory.HOME_LOAN, minimumIncome: 80000, minimumCreditScore: 700, minimumRelationshipYears: 2, interestRate: 8.5, maximumLoanAmount: 50000000 },
    { name: 'Life Insurance Shield', category: ProductCategory.INSURANCE, minimumIncome: 30000, minimumCreditScore: 600, minimumRelationshipYears: 0, maximumLoanAmount: 10000000 },
  ];
  const products = [];
  for (const p of productDefs) {
    products.push(await prisma.product.upsert({ where: { category: p.category }, update: p, create: p }));
  }

  console.log('⏳ Creating 1000 customers...');
  const BATCH = 100;
  for (let batch = 0; batch < 10; batch++) {
    const rows = [];
    for (let i = 0; i < BATCH; i++) {
      const idx = batch * BATCH + i + 1;
      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);
      const monthlyIncome = randomBetween(25000, 250000);
      const creditScore = randomBetween(550, 850);
      const loc = pick(CITIES);
      rows.push({
        customerCode: `CUST${String(idx).padStart(6, '0')}`,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${idx}@email.com`,
        phone: `+91${randomBetween(7000000000, 9999999999)}`,
        occupation: pick(OCCUPATIONS),
        annualIncome: monthlyIncome * 12,
        monthlyIncome,
        avgMonthlyBalance: monthlyIncome * randomBetween(1, 6),
        creditScore,
        relationshipYears: randomBetween(0, 15) + Math.random(),
        preferredLanguage: Math.random() > 0.75 ? 'hi' : 'en',
        preferredChannel: pick([CampaignChannel.WHATSAPP, CampaignChannel.EMAIL, CampaignChannel.SMS]),
        city: loc.city,
        state: loc.state,
        riskProfile: creditScore > 750 ? CustomerRiskProfile.LOW : creditScore > 650 ? CustomerRiskProfile.MEDIUM : CustomerRiskProfile.HIGH,
      });
    }
    await prisma.customer.createMany({ data: rows });
  }

  const customers = await prisma.customer.findMany({ select: { id: true, monthlyIncome: true } });
  const customerIds = customers.map((c) => c.id);
  console.log(`✓ ${customerIds.length} customers`);

  const savings = products[0];
  const creditCard = products.find((p) => p.category === ProductCategory.CREDIT_CARD)!;
  const cpRows = customerIds.flatMap((cid) => {
    const rows = [{
      customerId: cid,
      productId: savings.id,
      accountNumber: `SA${randomBetween(100000, 999999)}`,
      openedDate: randomDate(365 * 10),
      status: 'ACTIVE',
    }];
    if (Math.random() > 0.5) {
      rows.push({
        customerId: cid,
        productId: creditCard.id,
        accountNumber: `CC${randomBetween(100000, 999999)}`,
        openedDate: randomDate(365 * 5),
        status: 'ACTIVE',
      });
    }
    return rows;
  });
  for (let i = 0; i < cpRows.length; i += 500) await prisma.customerProduct.createMany({ data: cpRows.slice(i, i + 500) });

  console.log('⏳ Creating transactions (100k target via batch)...');
  const TXN_TARGET = 100000;
  const txnBatch = [];
  for (let i = 0; i < TXN_TARGET; i++) {
    const cid = pick(customerIds);
    const cust = customers.find((c) => c.id === cid)!;
    txnBatch.push({
      customerId: cid,
      transactionDate: randomDate(365),
      amount: randomBetween(500, cust.monthlyIncome * 2),
      balance: cust.monthlyIncome * randomBetween(1, 5),
      merchant: pick(['Amazon', 'Flipkart', 'IRCTC', 'Hospital']),
      category: pick(['Salary', 'Shopping', 'EMI', 'Transfer']),
      transactionType: pick([TransactionType.CREDIT, TransactionType.DEBIT]),
      description: 'Transaction',
    });
    if (txnBatch.length >= 5000) {
      await prisma.transaction.createMany({ data: txnBatch });
      txnBatch.length = 0;
    }
  }
  if (txnBatch.length) await prisma.transaction.createMany({ data: txnBatch });
  console.log('✓ 100000 transactions');

  console.log('⏳ CRM notes, loans, campaigns...');
  const noteBatch = Array.from({ length: 5000 }, () => ({
    customerId: pick(customerIds),
    createdById: rm.id,
    note: pick(['Inquired about personal loan', 'Interested in credit card upgrade', 'Requested home loan callback']),
    sentiment: pick([Sentiment.POSITIVE, Sentiment.NEUTRAL, Sentiment.NEGATIVE]),
    priority: pick([NotePriority.LOW, NotePriority.MEDIUM, NotePriority.HIGH]),
    followUpDate: Math.random() > 0.5 ? randomDate(30) : null,
  }));
  for (let i = 0; i < noteBatch.length; i += 500) await prisma.crmNote.createMany({ data: noteBatch.slice(i, i + 500) });

  const loanBatch = Array.from({ length: 1500 }, () => ({
    customerId: pick(customerIds),
    loanType: pick([ProductCategory.PERSONAL_LOAN, ProductCategory.HOME_LOAN]),
    loanAmount: randomBetween(100000, 5000000),
    interestRate: randomBetween(8, 14),
    remainingAmount: randomBetween(50000, 2000000),
    emiAmount: randomBetween(5000, 50000),
    status: pick([LoanStatus.ACTIVE, LoanStatus.CLOSED, LoanStatus.ACTIVE]),
    missedPayments: randomBetween(0, 2),
    startDate: randomDate(1000),
    endDate: Math.random() > 0.3 ? randomDate(365) : null,
  }));
  for (let i = 0; i < loanBatch.length; i += 500) await prisma.loan.createMany({ data: loanBatch.slice(i, i + 500) });

  const campaignBatch = Array.from({ length: 4000 }, () => ({
    customerId: pick(customerIds),
    campaignName: pick(['Personal Loan Offer', 'Credit Card Upgrade', 'FD Festival']),
    channel: pick([CampaignChannel.WHATSAPP, CampaignChannel.EMAIL, CampaignChannel.SMS, CampaignChannel.PHONE]),
    status: pick([CampaignStatus.SENT, CampaignStatus.DRAFT, CampaignStatus.SCHEDULED]),
    opened: Math.random() > 0.6,
    clicked: Math.random() > 0.7,
    converted: Math.random() > 0.85,
    sentDate: randomDate(180),
  }));
  for (let i = 0; i < campaignBatch.length; i += 500) await prisma.campaign.createMany({ data: campaignBatch.slice(i, i + 500) });

  const recBatch = Array.from({ length: 1000 }, () => ({
    customerId: pick(customerIds),
    productId: pick(products).id,
    conversionScore: randomBetween(55, 98),
    confidence: randomBetween(70, 99),
    reason: [pick(['High income', 'Excellent credit', 'Long relationship'])],
    status: pick([RecommendationStatus.DRAFT, RecommendationStatus.APPROVED]),
  }));
  for (let i = 0; i < recBatch.length; i += 500) await prisma.productRecommendation.createMany({ data: recBatch.slice(i, i + 500) });

  const msgPrompt = promptVersions.find((p) => p.name === 'Messaging Prompt')!;
  const msgBatch = Array.from({ length: 1000 }, () => ({
    customerId: pick(customerIds),
    promptVersionId: msgPrompt.id,
    channel: CampaignChannel.WHATSAPP,
    message: 'Hi, based on your banking relationship, you may qualify for an exclusive offer. Reply YES to learn more.',
    status: pick([MessageStatus.DRAFT, MessageStatus.APPROVED, MessageStatus.SENT]),
  }));
  for (let i = 0; i < msgBatch.length; i += 500) await prisma.generatedMessage.createMany({ data: msgBatch.slice(i, i + 500) });

  const auditBatch = Array.from({ length: 10000 }, () => ({
    requestId: `req-${randomBetween(1000, 9999)}`,
    userId: rm.id,
    agent: pick(['Planner', 'Scoring', 'Recommendation', 'Messaging']),
    tool: pick(['CustomerTool', 'ScoringEngine', 'ProductTool', null]),
    action: pick(['login', 'customer_search', 'scoring_completed', 'message_generated']),
    executionTime: randomBetween(10, 2000),
    status: pick([AuditStatus.SUCCESS, AuditStatus.SUCCESS, AuditStatus.FAILED]),
  }));
  for (let i = 0; i < auditBatch.length; i += 1000) await prisma.auditLog.createMany({ data: auditBatch.slice(i, i + 1000) });

  console.log('\n✅ Seed complete!');
  console.log('Login: rm@bank.com / password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
