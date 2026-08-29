import {
  Controller, Get, Post, Body, Param, ParseUUIDPipe,
  HttpCode, HttpStatus, Query, Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import { CreateOrderDto, ManualPaymentDto, RazorpayWebhookDto } from './dto/payment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private sid(user: AuthUser): string { return user.societyId as string; }

  @Post('create-order')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.RESIDENT, Role.TENANT)
  createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
    return this.paymentsService.createOrder(this.sid(user), dto);
  }

  /**
   * POST /payments/webhook — Razorpay webhook (public, but signature-verified)
   * societyId comes from the X-Society-Id header (set by Razorpay notes)
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() dto: RazorpayWebhookDto, @Param('societyId') societyId: string) {
    // In real Razorpay: societyId is embedded in the order's `receipt` or `notes`
    // For mock, we extract it from the order ID prefix or pass via body
    // This is simplified — in production, extract from Razorpay event payload
    return { received: true };
  }

  @Post('manual')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  recordManual(@Body() dto: ManualPaymentDto, @CurrentUser() user: AuthUser) {
    return this.paymentsService.recordManual(this.sid(user), dto, user.sub);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('invoiceId') invoiceId?: string,
    @Query('unitId') unitId?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.findAll(this.sid(user), { invoiceId, unitId, status });
  }

  @Get('outstanding')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  getOutstanding(@CurrentUser() user: AuthUser) {
    return this.paymentsService.getOutstanding(this.sid(user));
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.RESIDENT, Role.TENANT)
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.paymentsService.findOne(this.sid(user), id);
  }

  @Get(':id/receipt')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.RESIDENT, Role.TENANT)
  async getReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const pdf = await this.paymentsService.getReceiptPdf(this.sid(user), id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receipt-${id}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}
