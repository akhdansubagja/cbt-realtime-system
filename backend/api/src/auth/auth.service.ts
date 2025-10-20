import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // This method validates the user's credentials
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    // Compares the provided password with the hashed password in the database
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user; // Remove password from the result
      return result;
    }
    return null; // Return null if authentication fails
  }

  // This method generates a JWT access token if validation is successful
  async login(user: User) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}