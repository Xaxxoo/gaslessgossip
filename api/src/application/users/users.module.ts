import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Post } from '../posts/entities/post.entity';
import { Chat } from '../chats/entities/chat.entity';
import { ChatsService } from '../chats/chats.service';
import { UserVerificationService } from './user-verification.service';
import { UserVerification } from './entities/user-verification.entity';
import { EmailTemplateService } from '@/notification/core/email';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Block } from './entities/block.entity';
import { BlocksService } from './blocks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post, Chat, UserVerification, Wallet, Block]),
  ],
  providers: [
    UsersService,
    ChatsService,
    UserVerificationService,
    EmailTemplateService,
    BlocksService,
  ],
  controllers: [UsersController],
  exports: [UsersService, BlocksService],
})
export class UsersModule {}
