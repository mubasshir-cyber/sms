import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Health Controller — simple liveness probe.
 * Used by load balancers, Docker health checks, and uptime monitors.
 *
 * GET /api/v1/health → 200 { status: 'ok', ... }
 */
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  check(): object {
    return {
      status: 'ok',
      service: 'Society Management System API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
    };
  }
}
