import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';
import { UsersService } from './users.service';

describe('UsersService role assignment', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<
    Pick<Repository<User>, 'findOneBy' | 'save'>
  >;

  beforeEach(async () => {
    usersRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it.each([UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD])(
    'accepts a role-only request for %s',
    async (role) => {
      const dto = Object.assign(new AssignUserRoleDto(), { role });
      await expect(
        validate(dto, { whitelist: true, forbidNonWhitelisted: true }),
      ).resolves.toHaveLength(0);
    },
  );

  it('rejects department and team IDs in the request body', async () => {
    const dto = Object.assign(new AssignUserRoleDto(), {
      role: UserRole.DEPARTMENT_HEAD,
      departmentId: 1,
      teamId: 2,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.map(({ property }) => property)).toEqual([
      'departmentId',
      'teamId',
    ]);
  });

  it('lets the Managing Director update only the target user role', async () => {
    const department = { id: 1 };
    const team = { id: 2 };
    const managingDirector = {
      id: 'director-id',
      role: UserRole.MANAGING_DIRECTOR,
    };
    const targetUser = {
      id: 'target-id',
      fullName: 'Taylor User',
      email: 'taylor@example.com',
      role: UserRole.TEAM_MEMBER,
      department,
      team,
    };
    usersRepository.findOneBy
      .mockResolvedValueOnce(managingDirector as User)
      .mockResolvedValueOnce(targetUser as User);
    usersRepository.save.mockResolvedValue(targetUser as User);

    await expect(
      service.assignRole(
        targetUser.id,
        { role: UserRole.DEPARTMENT_HEAD },
        managingDirector.id,
      ),
    ).resolves.toEqual({
      id: targetUser.id,
      fullName: targetUser.fullName,
      email: targetUser.email,
      role: UserRole.DEPARTMENT_HEAD,
    });
    expect(targetUser.department).toBe(department);
    expect(targetUser.team).toBe(team);
    expect(usersRepository.save).toHaveBeenCalledWith(targetUser);
  });
});
