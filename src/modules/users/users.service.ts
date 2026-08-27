import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateUserDto, requestingUser: AuthUser): Promise<User> {
    this.logger.log(`Creating user with email: ${dto.email} by ${requestingUser.sub}`);

    // Check if email is already taken
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    // SOCIETY_ADMIN cannot create SUPER_ADMIN
    if (dto.role === Role.SUPER_ADMIN && requestingUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You cannot assign the SUPER_ADMIN role');
    }

    // Society-scoped users must have a societyId
    if (dto.role !== Role.SUPER_ADMIN && !dto.societyId && requestingUser.societyId) {
      dto.societyId = requestingUser.societyId;
    }

    const user = this.usersRepo.create({
      ...dto,
      email: dto.email.toLowerCase(),
      passwordHash: dto.password ? await bcrypt.hash(dto.password, this.SALT_ROUNDS) : null,
    });

    const saved = await this.usersRepo.save(user);
    this.logger.log(`User created: ${saved.id}`);

    // Remove sensitive fields before returning
    delete (saved as Partial<User>).passwordHash;
    return saved;
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  async findAll(requestingUser: AuthUser): Promise<User[]> {
    const where =
      requestingUser.role === Role.SUPER_ADMIN
        ? {}
        : { societyId: requestingUser.societyId as string };

    return this.usersRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, requestingUser: AuthUser): Promise<User> {
    const where =
      requestingUser.role === Role.SUPER_ADMIN
        ? { id }
        : { id, societyId: requestingUser.societyId as string };

    const user = await this.usersRepo.findOne({ where });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password_hash') // Override select: false
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateUserDto, requestingUser: AuthUser): Promise<User> {
    const user = await this.findOne(id, requestingUser);

    // Prevent role self-modification
    if (dto.role && id === requestingUser.sub) {
      throw new ForbiddenException('You cannot change your own role');
    }

    if (dto.password) {
      (dto as Partial<User> & { password?: string }).password = undefined;
      user.passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    }

    Object.assign(user, dto);
    const updated = await this.usersRepo.save(user);

    delete (updated as Partial<User>).passwordHash;
    return updated;
  }

  // ─── Delete (Soft) ────────────────────────────────────────────────────────

  async remove(id: string, requestingUser: AuthUser): Promise<void> {
    const user = await this.findOne(id, requestingUser);

    if (id === requestingUser.sub) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    await this.usersRepo.softRemove(user);
    this.logger.log(`User soft-deleted: ${id} by ${requestingUser.sub}`);
  }

  // ─── Account Security ─────────────────────────────────────────────────────

  async incrementFailedLogin(userId: string): Promise<void> {
    await this.usersRepo.increment({ id: userId }, 'failedLoginAttempts', 1);

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (user && user.failedLoginAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await this.usersRepo.update(userId, { lockedUntil: lockUntil });
      this.logger.warn(`Account locked: ${userId} until ${lockUntil.toISOString()}`);
    }
  }

  async resetFailedLogin(userId: string): Promise<void> {
    await this.usersRepo.update(userId, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });
  }
}
