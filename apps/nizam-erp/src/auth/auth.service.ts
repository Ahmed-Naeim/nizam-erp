import { ConflictException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { TenantService } from '../tenant/tenant.service';
import { RegisterDto } from './dto/register.dto';
import { Tenant } from '../tenant/entities/tenant.entity';


@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>, private readonly tenantService: TenantService) {}

  getData() {
    return { message: 'Auth Service Data' };
  }


  async register (registerDto : RegisterDto) : Promise<User> {
    const {companyName, email, password, firstName, lastName} = registerDto;

    // 1- check if the user exists
    const existingUser = await this.userRepository.findOneBy({email});
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // 2- create the tenant with their own private database
    let newTenant : Tenant;
    // eslint-disable-next-line prefer-const
    newTenant = await this.tenantService.createTenant(companyName);

    // 3- Hash the password
    const hashedPassword = await this.hashPassword(password);

    // 4- Create the new User
    const newUser = this.userRepository.create({
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      tenant: newTenant,
      isActive: true,
    });

    // 5- Save the user to the main database
    return this.userRepository.save(newUser);

  }

  async hashPassword(password: string): Promise<string> {
    // Implement password hashing logic here
    const saltRounds = 10; // Standard salt rounds
    return bcrypt.hash(password, saltRounds);
  }


}
