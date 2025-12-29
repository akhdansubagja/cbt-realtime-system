import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto'; // Akan kita buat

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Endpoint untuk login pengguna (Admin/Operator).
   * Menerima username dan password, lalu mengembalikan access token jika valid.
   *
   * @param loginDto Data login yang berisi username dan password.
   * @returns Objek yang berisi access token JWT.
   * @throws UnauthorizedException Jika kredensial tidak valid.
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }
    return this.authService.login(user);
  }
}
