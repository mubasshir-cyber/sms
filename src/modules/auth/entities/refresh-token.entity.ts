import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * RefreshToken Entity
 * Stores hashed refresh tokens for session management & revocation.
 *
 * Table: refresh_tokens
 */
@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Index('IDX_refresh_tokens_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** bcrypt hash of the refresh token — never stored plain */
  @Column({ name: 'token_hash', type: 'varchar', length: 512 })
  tokenHash: string;

  @Column({ name: 'device_info', type: 'varchar', length: 255, nullable: true })
  deviceInfo: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  isRevoked: boolean;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
