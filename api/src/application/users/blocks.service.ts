import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './entities/block.entity';
import { User } from './entities/user.entity';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private blocksRepository: Repository<Block>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async blockUser(blockerId: number, blockedId: number): Promise<Block> {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const blockedUser = await this.usersRepository.findOne({ where: { id: blockedId } });
    if (!blockedUser) {
      throw new NotFoundException('User to block not found');
    }

    const existingBlock = await this.blocksRepository.findOne({
      where: { blockerId, blockedId },
    });

    if (existingBlock) {
      return existingBlock;
    }

    const block = this.blocksRepository.create({ blockerId, blockedId });
    return this.blocksRepository.save(block);
  }

  async unblockUser(blockerId: number, blockedId: number): Promise<void> {
    const block = await this.blocksRepository.findOne({
      where: { blockerId, blockedId },
    });

    if (!block) {
      throw new NotFoundException('Block record not found');
    }

    await this.blocksRepository.remove(block);
  }

  async isBlocked(userId1: number, userId2: number): Promise<boolean> {
    const block = await this.blocksRepository.findOne({
      where: [
        { blockerId: userId1, blockedId: userId2 },
        { blockerId: userId2, blockedId: userId1 },
      ],
    });
    return !!block;
  }

  async getBlockedUsers(userId: number): Promise<User[]> {
    const blocks = await this.blocksRepository.find({
      where: { blockerId: userId },
      relations: ['blockedUser'],
    });
    return blocks.map((b) => b.blockedUser);
  }
}
