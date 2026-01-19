import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async reportUser(reporterId: number, reportedId: number, reason: string, roomId?: number): Promise<Report> {
    const reportedUser = await this.usersRepository.findOne({ where: { id: reportedId } });
    if (!reportedUser) {
      throw new NotFoundException('User to report not found');
    }

    const report = this.reportsRepository.create({
      reporterId,
      reportedId,
      reason,
      roomId,
    });

    return this.reportsRepository.save(report);
  }

  async getAllReports(): Promise<Report[]> {
    return this.reportsRepository.find({
      relations: ['reporter', 'reportedUser'],
    });
  }
}
