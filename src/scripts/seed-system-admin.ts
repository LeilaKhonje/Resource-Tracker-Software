import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Department } from '../departments/entities/department.entity';
import { Team } from '../teams/entities/team.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';

const email = process.env.SYSTEM_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SYSTEM_ADMIN_PASSWORD;
const fullName = process.env.SYSTEM_ADMIN_FULL_NAME?.trim();

if (!email || !password || !fullName) {
  console.error(
    'Set SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD, and SYSTEM_ADMIN_FULL_NAME before running this command.',
  );
  process.exit(1);
}

if (password.length < 8 || password.length > 12 || !/\d/.test(password)) {
  console.error('SYSTEM_ADMIN_PASSWORD must be 8–12 characters and contain a number.');
  process.exit(1);
}

const adminEmail = email;
const adminPassword = password;
const adminFullName = fullName;

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

async function seedSystemAdmin() {
  await dataSource.initialize();
  await dataSource.transaction(async (manager) => {
    const users = manager.getRepository(User);
    const existingAdmin = await users.findOneBy({ role: UserRole.SYSTEM_ADMIN });
    let user = await users.findOneBy({ email: adminEmail });

    if (existingAdmin && existingAdmin.email !== adminEmail) {
      existingAdmin.role = null;
      await users.save(existingAdmin);
    }

    if (!user) {
      user = users.create({
        email: adminEmail,
        fullName: adminFullName,
        role: UserRole.SYSTEM_ADMIN,
      });
    } else {
      user.fullName = adminFullName;
      user.role = UserRole.SYSTEM_ADMIN;
    }

    user.passwordHash = await bcrypt.hash(adminPassword, 12);
    user.isActive = true;
    await users.save(user);
  });
  console.log(`System Admin account is ready for ${adminEmail}.`);
}

seedSystemAdmin()
  .catch((error: unknown) => {
    console.error('Could not seed the System Admin account.');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    if (dataSource.isInitialized) await dataSource.destroy();
  });
