export class ToolException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'ToolException';
  }
}

export class CustomerNotFoundException extends ToolException {
  constructor(identifier?: string) {
    super(
      identifier ? `Customer not found: ${identifier}` : 'No customers matched the query',
      'CUSTOMER_NOT_FOUND',
      false,
    );
    this.name = 'CustomerNotFoundException';
  }
}

export class LoanNotFoundException extends ToolException {
  constructor(customerId?: string) {
    super(
      customerId ? `No loans found for customer: ${customerId}` : 'No loan records found',
      'LOAN_NOT_FOUND',
      false,
    );
    this.name = 'LoanNotFoundException';
  }
}

export class CampaignUnavailableException extends ToolException {
  constructor(reason?: string) {
    super(reason ?? 'Campaign service unavailable', 'CAMPAIGN_UNAVAILABLE', true);
    this.name = 'CampaignUnavailableException';
  }
}

export class ProductNotFoundException extends ToolException {
  constructor(productType: string) {
    super(`Product not found: ${productType}`, 'PRODUCT_NOT_FOUND', false);
    this.name = 'ProductNotFoundException';
  }
}

export class MessageGenerationException extends ToolException {
  constructor(reason?: string) {
    super(reason ?? 'Message generation failed', 'MESSAGE_GENERATION_FAILED', true);
    this.name = 'MessageGenerationException';
  }
}

export class InfrastructureException extends ToolException {
  constructor(message: string) {
    super(message, 'INFRASTRUCTURE_ERROR', true);
    this.name = 'InfrastructureException';
  }
}

export function isRetryableToolError(error: unknown): boolean {
  return error instanceof ToolException && error.retryable;
}
