import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  private resolveSocietyId(user: AuthUser): string {
    if (!user.societyId) {
      throw new BadRequestException('User is not associated with any society');
    }
    return user.societyId;
  }

  @Get('summary')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  getSummary(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getSummary(this.resolveSocietyId(user));
  }

  @Get('operations')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  getOperations(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getOperationsSummary(this.resolveSocietyId(user));
  }

  @Get('alerts')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  getAlerts(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getAlerts(this.resolveSocietyId(user));
  }

  @Get('recent-activity')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  getRecentActivity(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 15;
    return this.dashboardService.getRecentActivity(this.resolveSocietyId(user), parsedLimit);
  }
}
