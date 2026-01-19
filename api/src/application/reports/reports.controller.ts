import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async reportUser(
    @Request() req,
    @Body() body: { reportedId: number; reason: string; roomId?: number },
  ) {
    return this.reportsService.reportUser(req.user.userId, body.reportedId, body.reason, body.roomId);
  }

  @Get()
  async getAllReports() {
    return this.reportsService.getAllReports();
  }
}
