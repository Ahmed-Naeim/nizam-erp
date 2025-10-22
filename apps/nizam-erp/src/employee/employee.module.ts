import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { AuthModule } from '../auth/auth.module'; // <-- 1. Import AuthModule

@Module({
  imports: [AuthModule], // <-- 2. Add AuthModule
  controllers: [EmployeeController],
  providers: [EmployeeService], // <-- 3. EmployeeService is the only provider
})
export class EmployeeModule {}
