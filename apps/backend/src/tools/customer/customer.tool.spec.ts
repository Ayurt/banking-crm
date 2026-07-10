import type { Customer, ProductType } from '@banking-crm/shared-types';
import { CustomerNotFoundException } from '@banking-crm/shared-types';
import { CustomerTool } from '../customer/customer.tool';

const mockCustomer: Customer = {
  id: 'c1',
  customerCode: 'C001',
  name: 'Rahul',
  monthlyIncome: 120000,
  creditScore: 780,
  avgMonthlyBalance: 200000,
  relationshipYears: 5,
  preferredLanguage: 'en',
  riskProfile: 'LOW',
  existingProducts: ['Savings'],
};

describe('CustomerTool', () => {
  const repo = {
    findHighValueCandidates: jest.fn().mockResolvedValue([mockCustomer]),
    findByIds: jest.fn().mockResolvedValue([mockCustomer]),
  };

  it('execute returns customers for product filter', async () => {
    const tool = new CustomerTool(repo);
    const result = await tool.execute({ filters: { productType: 'PERSONAL_LOAN', limit: 10 } });
    expect(result.customers).toHaveLength(1);
    expect(repo.findHighValueCandidates).toHaveBeenCalledWith('PERSONAL_LOAN', 10);
  });

  it('execute throws CustomerNotFoundException when no ids match', async () => {
    const tool = new CustomerTool({ ...repo, findByIds: jest.fn().mockResolvedValue([]) });
    await expect(tool.execute({ customerIds: ['missing'] })).rejects.toThrow(CustomerNotFoundException);
  });

  it('safeExecute returns failure result without throwing', async () => {
    const tool = new CustomerTool({ ...repo, findByIds: jest.fn().mockResolvedValue([]) });
    const result = await tool.safeExecute({ customerIds: ['missing'] });
    expect(result.success).toBe(false);
  });

  it('retrieve adapter returns ToolResult for agents', async () => {
    const tool = new CustomerTool(repo);
    const result = await tool.retrieve('PERSONAL_LOAN' as ProductType);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('tracks execution metrics', async () => {
    const tool = new CustomerTool(repo);
    await tool.execute({ filters: { productType: 'PERSONAL_LOAN' } });
    expect(tool.getMetrics().calls).toBe(1);
    expect(tool.getMetrics().failures).toBe(0);
  });
});
