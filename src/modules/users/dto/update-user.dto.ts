import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/**
 * UpdateUserDto — all fields from CreateUserDto become optional.
 * Inherits all validators via PartialType.
 * Role cannot be changed through this DTO — use a dedicated role-change endpoint.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
