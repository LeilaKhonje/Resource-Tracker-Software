import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Department } from '../departments/entities/department.entity';
import { Team } from '../teams/entities/team.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';

const email = process.env.MANAGING_DIRECTOR_EMAIL?.trim().toLowerCase();
const password = process.env.MANAGING_DIRECTOR_PASSWORD;
const fullName = process.env.MANAGING_DIRECTOR_FULL_NAME?.trim();

if (!email || !password || !fullName) {
  console.error(
    'Set MANAGING_DIRECTOR_EMAIL, MANAGING_DIRECTOR_PASSWORD, and MANAGING_DIRECTOR_FULL_NAME before running this command.',
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error('MANAGING_DIRECTOR_PASSWORD must be at least 8 characters.');
  process.exit(1);
}

const directorEmail = email as string;
const directorPassword = password as string;
const directorFullName = fullName as string;

const dataSource = new DataSource({
  type: (process.env.DB_CONNECTION || 'mysql') as 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Department, Team],
  synchronize: false,
});

async function seedManagingDirector() {
  await dataSource.initialize();
  await dataSource.transaction(async (manager) => {
    const users = manager.getRepository(User);
    const existingDirector = await users.findOneBy({
      role: UserRole.MANAGING_DIRECTOR,
    });
    let user = await users.findOneBy({ email: directorEmail });

    if (existingDirector && existingDirector.email !== directorEmail) {
      existingDirector.role = null;
      await users.save(existingDirector);
    }

    if (!user) {
      user = users.create({
        email: directorEmail,
        fullName: directorFullName,
        role: UserRole.MANAGING_DIRECTOR,
      });
    } else {
      user.fullName = directorFullName;
      user.role = UserRole.MANAGING_DIRECTOR;
    }

    user.passwordHash = await bcrypt.hash(directorPassword, 12);
    await users.save(user);
  });
  console.log(`Managing Director account is ready for ${directorEmail}.`);
}

seedManagingDirector()
  .catch((error: unknown) => {
    console.error('Could not seed the Managing Director account.');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    if (dataSource.isInitialized) await dataSource.destroy();
  });
