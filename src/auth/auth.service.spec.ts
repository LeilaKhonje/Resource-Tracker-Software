import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { scryptSync } from 'node:crypto';
import { AuthService } from './auth.service';
import { UserRole } from '../users/user-role.enum';
import { User } from '../users/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let queryResult: User | null;
  let usersRepository: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    addSelect: jest.Mock;
    where: jest.Mock;
    getOne: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    queryResult = null;
    queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(() => Promise.resolve(queryResult)),
    };
    usersRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((fields: Partial<User>) =>
        Object.assign(new User(), fields),
      ),
      save: jest.fn(async (user: User) =>
        Object.assign(user, { id: 'user-id' }),
      ),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers users without a role and returns no password data', async () => {
    const result = await service.register({
      fullName: '  Leila Khonje ',
      email: ' LEILA@example.com ',
      password: 'a-long-password-123',
    });

    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Leila Khonje',
        email: 'leila@example.com',
        role: null,
        passwordHash: expect.stringMatching(/^\$2[aby]\$12\$/),
      }),
    );
    expect(result).toEqual({
      accessToken: 'signed-token',
      user: {
        id: 'user-id',
        fullName: 'Leila Khonje',
        email: 'leila@example.com',
        role: null,
      },
    });
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-id',
      email: 'leila@example.com',
      role: null,
    });
  });

  it('rejects a duplicate email address', async () => {
    usersRepository.findOneBy.mockResolvedValue(new User());

    await expect(
      service.register({
        fullName: 'Leila Khonje',
        email: 'leila@example.com',
        password: 'a-long-password-123',
      }),
    ).rejects.toThrow('An account with this email already exists');
    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('authenticates a user with the correct password', async () => {
    await service.register({
      fullName: 'Leila Khonje',
      email: 'leila@example.com',
      password: 'a-long-password-123',
    });
    queryResult = await usersRepository.save.mock.results[0].value;

    const result = await service.login({
      email: 'LEILA@example.com',
      password: 'a-long-password-123',
    });

    expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
    expect(queryBuilder.where).toHaveBeenCalledWith('user.email = :email', {
      email: 'leila@example.com',
    });
    expect(result.accessToken).toBe('signed-token');
  });

  it('rejects incorrect credentials with a generic error', async () => {
    await service.register({
      fullName: 'Leila Khonje',
      email: 'leila@example.com',
      password: 'a-long-password-123',
    });
    queryResult = await usersRepository.save.mock.results[0].value;

    await expect(
      service.login({
        email: 'leila@example.com',
        password: 'a-different-password',
      }),
    ).rejects.toThrow('Invalid email or password');
  });

  it('upgrades a legacy scrypt hash to bcrypt after successful login', async () => {
    const salt = Buffer.from('0123456789abcdef');
    const key = scryptSync('legacy-password', salt, 64);
    queryResult = Object.assign(new User(), {
      id: 'legacy-user',
      fullName: 'Legacy User',
      email: 'legacy@example.com',
      role: UserRole.TEAM_LEAD,
      passwordHash: `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`,
    });

    await service.login({
      email: 'legacy@example.com',
      password: 'legacy-password',
    });

    expect(usersRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: expect.stringMatching(/^\$2[aby]\$12\$/),
      }),
    );
  });
});
