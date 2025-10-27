// cbt-realtime-system/backend/api/src/auth/auth.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

// Membuat mock/tiruan dari AuthService
const mockAuthService = {
  validateUser: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      // Sediakan mockAuthService sebagai pengganti AuthService yang asli
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks(); // Bersihkan riwayat mock sebelum setiap tes
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return an access token when login is successful', async () => {
      // 1. Arrange
      const loginDto: LoginDto = { username: 'admin', password: 'password' };
      const mockUser = new User(); // User object yang 'dikembalikan' oleh validateUser
      const mockToken = { access_token: 'mock-jwt-token' };

      // Atur perilaku mock
      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue(mockToken);

      // 2. Act
      const result = await controller.login(loginDto);

      // 3. Assert
      expect(result).toEqual(mockToken);
      expect(service.validateUser).toHaveBeenCalledWith(loginDto.username, loginDto.password);
      expect(service.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      // 1. Arrange
      const loginDto: LoginDto = { username: 'admin', password: 'wrongpassword' };

      // Atur mock: validateUser gagal dan mengembalikan null
      mockAuthService.validateUser.mockResolvedValue(null);

      // 2. Act & 3. Assert
      // Kita mengharapkan controller.login akan melempar (throw) sebuah error.
      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      
      // Pastikan service.login TIDAK pernah dipanggil jika validasi gagal
      expect(service.login).not.toHaveBeenCalled();
    });
  });
});