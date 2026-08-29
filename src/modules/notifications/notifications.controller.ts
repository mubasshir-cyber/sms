import { Controller, Get, Patch, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(...Object.values(Role))
  findMine(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.notificationsService.findMyNotifications(
      user.sub,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Get('unread-count')
  @Roles(...Object.values(Role))
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Patch('read-all')
  @Roles(...Object.values(Role))
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Patch(':id/read')
  @Roles(...Object.values(Role))
  markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.notificationsService.markRead(user.sub, id);
  }
}
