import { Controller, Get } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Controller()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  getData() {
    return this.tenantService.getData();
  }
}
