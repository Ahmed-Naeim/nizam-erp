import { Body, Controller, Get, Post, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getData() {
    return this.authService.getData();
  }

@Post('register')
  async register(@Body(new ValidationPipe()) registerDto: RegisterDto) {
    // We can return the new user, or just a success message
    const user = await this.authService.register(registerDto);
    // Avoid sending password hash back
    const { passwordHash, ...result } = user;
      return result;
    }
  }
