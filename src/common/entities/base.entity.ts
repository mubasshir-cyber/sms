import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

/**
 * BaseEntity — extended by all TypeORM entities in the system.
 *
 * Provides:
 * - UUID primary key (uuid_generate_v4())
 * - Automatic created_at timestamp
 * - Automatic updated_at timestamp
 * - Soft delete via deleted_at (use withDeleted() in queries to include soft-deleted)
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
