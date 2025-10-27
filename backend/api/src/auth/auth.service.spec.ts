// cbt-realtime-system/backend/api/src/auth/auth.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

// Membuat mock/tiruan yang akurat dari UsersService
const mockUsersService = {
  findOneByUsername: jest.fn(),
};

// Membuat mock/tiruan dari JwtService
const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);

    // Membersihkan riwayat mock sebelum setiap tes
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Menguji fungsi 'validateUser'
  describe('validateUser', () => {
    it('should return user object (without password) when credentials are valid', async () => {
      // 1. Arrange: Siapkan data dan kondisi
      const username = 'admin';
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Membuat mock user yang sesuai persis dengan User Entity Anda
      const mockUser = new User();
      mockUser.id = 1;
      mockUser.username = username;
      mockUser.password = hashedPassword;
      mockUser.created_at = new Date();
      mockUser.updated_at = new Date();

      // Mengatur mock: jika findOneByUsername dipanggil, kembalikan mockUser
      mockUsersService.findOneByUsername.mockResolvedValue(mockUser);

      // 2. Act: Panggil fungsi yang diuji
      const result = await service.validateUser(username, plainPassword);
      
      // 3. Assert: Periksa hasilnya
      // Buat objek ekspektasi tanpa password
      const { password, ...expectedResult } = mockUser;

      expect(result).toEqual(expectedResult);
      expect(usersService.findOneByUsername).toHaveBeenCalledWith(username);
    });

    it('should return null when password is not valid', async () => {
      // 1. Arrange
      const username = 'admin';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const mockUser = new User();
      mockUser.id = 1;
      mockUser.username = username;
      mockUser.password = hashedPassword;
      
      mockUsersService.findOneByUsername.mockResolvedValue(mockUser);

      // 2. Act
      const result = await service.validateUser(username, wrongPassword);

      // 3. Assert
      expect(result).toBeNull();
      expect(usersService.findOneByUsername).toHaveBeenCalledWith(username);
    });

    it('should return null if user is not found', async () => {
      // 1. Arrange
      mockUsersService.findOneByUsername.mockResolvedValue(null);

      // 2. Act
      const result = await service.validateUser('nonexistentuser', 'anypassword');

      // 3. Assert
      expect(result).toBeNull();
    });
  });

  // Menguji fungsi 'login'
  describe('login', () => {
    it('should return an access token', async () => {
      // 1. Arrange
      const mockUserPayload = new User();
      mockUserPayload.id = 1;
      mockUserPayload.username = 'admin';

      const mockToken = 'mock-jwt-token';
      mockJwtService.sign.mockReturnValue(mockToken);

      // 2. Act
      const result = await service.login(mockUserPayload);

      // 3. Assert
      expect(result).toEqual({ access_token: mockToken });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ username: mockUserPayload.username, sub: mockUserPayload.id });
    });
  });
});