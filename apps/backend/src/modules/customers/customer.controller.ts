import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CustomerService } from './customer.service';
import { CustomerQueryDto } from './dto/customer-query.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @ApiOperation({ summary: 'Search customers with pagination, filters, and sorting' })
  @ApiResponse({ status: 200, description: 'Paginated customer list' })
  findAll(@Query() query: CustomerQueryDto) {
    return this.customerService.findAll(query);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Complete CRM profile for a customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  getProfile(@Param('id') id: string) {
    return this.customerService.getProfile(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }
}
