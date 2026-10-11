import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { Req } from '@nestjs/common';
import { WidgetsService } from './widgets.service';

@Controller('widgets')
@UseGuards(AuthGuard)
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get(':service/:widget')
  getWidget(
    @Req() request: AuthenticatedRequest,
    @Param('service') service: string,
    @Param('widget') widget: string,
    @Query() configuration: Record<string, unknown>,
  ) {
    return this.widgetsService.fetchServiceWidget(request.userId, service, widget, configuration);
  }
}
