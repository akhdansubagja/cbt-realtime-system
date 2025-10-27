// cbt-realtime-system/backend/api/src/users/users.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should correctly hash the password and save a new user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'newuser',
        password: 'plainPassword123',
        email: 'newuser@example.com',
      };

      const createdUser = new User();
      const savedUser = { ...createdUser, id: 1 };

      // PERBAIKAN: Menggunakan mockImplementation untuk menangkap input
      // Ini membuat mock kita lebih pintar.
      mockUserRepository.create.mockImplementation((dto) => {
        // Salin properti dari dto yang diterima (termasuk hashed password)
        // ke dalam objek createdUser kita.
        Object.assign(createdUser, dto);
        return createdUser;
      });

      mockUserRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(savedUser);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'newuser',
          password: expect.not.stringContaining(createUserDto.password),
        }),
      );
      expect(repository.save).toHaveBeenCalledWith(createdUser);

      // Sekarang, createdUser.password akan berisi hash yang benar
      // karena mockImplementation kita sudah menangkapnya.
      const isPasswordCorrect = await bcrypt.compare(
        createUserDto.password,
        createdUser.password,
      );
      expect(isPasswordCorrect).toBe(true);
    });
  });

  describe('findOneByUsername', () => {
    it('should return a user object if found', async () => {
      const username = 'founduser';
      const mockUser = new User();
      mockUser.id = 2;
      mockUser.username = username;

      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findOneByUsername(username);

      expect(result).toEqual(mockUser);
      expect(repository.findOneBy).toHaveBeenCalledWith({ username });
    });

    it('should return null if user is not found', async () => {
      const username = 'notfounduser';
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOneByUsername(username);

      expect(result).toBeNull();
      expect(repository.findOneBy).toHaveBeenCalledWith({ username });
    });
  });
});