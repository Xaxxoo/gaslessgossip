import { Module } from '@nestjs/common';
import { UsersModule } from './application/users/users.module';
import { AuthModule } from './application/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PostsModule } from './application/posts/posts.module';
import { CommonModule } from './common/common.module';
import { ChatsModule } from './application/chats/chats.module';
import { MessagesModule } from './application/messages/messages.module';
import { RoomCategoriesModule } from './application/room-categories/room-categories.module';
import { RoomMessagesModule } from './application/room-messages/room-messages.module';
import { RoomsModule } from './application/rooms/rooms.module';
import starknetConfig from './config/starknet.config';
import typeormConfig from './infrastructure/database/config';
import queueConfig from './infrastructure/queue/queue.config';
import { WalletModule } from './application/wallets/wallet.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from './infrastructure/logger';
import { EmailModule } from './notification/features/email/email.module';
// import { ScheduleModule } from '@nestjs/schedule';
import { Schedule as MySchedules } from './schedule/schedule.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
// import { ContractsModule } from './contracts/contracts.module';
import { FilesModule } from './application/files/files.module';
import { ContractsModule } from './contracts/contracts.module';
import { JobsModule } from './jobs/jobs.module';
import { ReportsModule } from './application/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [starknetConfig, typeormConfig, queueConfig],
      envFilePath: '.env',
    }),
    LoggerModule,
    DatabaseModule,
    EventEmitterModule.forRoot(),
    MySchedules,
    EmailModule,
    QueueModule,
    UsersModule,
    AuthModule,
    PostsModule,
    ChatsModule,
    CommonModule,
    MessagesModule,
    RoomCategoriesModule,
    RoomMessagesModule,
    RoomsModule,
    WalletModule,
    ContractsModule,
    JobsModule,
    FilesModule,
    ReportsModule,
    // ContractsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
