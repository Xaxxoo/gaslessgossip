import { RoomCategory } from '../../room-categories/entities/room-category.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoomMember } from './room-member.entity';
import { User } from '../../users/entities/user.entity';
import { RoomMessage } from '../../room-messages/entities/room-message.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ default: 'public' })
  type: 'public' | 'paid' | 'invite_only';

  @Column({ default: 0 })
  duration: number;

  @Column({ default: 0 })
  fee: number;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { nullable: true })
  photo?: string;

  @Column({ default: 'active' })
  status?: string;

  @Column({ default: true })
  allow_send_message?: boolean;

  @Column({ default: true })
  allow_voice_note?: boolean;

  @Column({ default: false })
  anonymous_mode?: boolean;

  @Column({ default: false })
  is_disposable?: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => RoomCategory, (room_category) => room_category.rooms, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'roomCategoryId' })
  room_category?: RoomCategory;

  @OneToMany(() => RoomMember, (member) => member.room)
  members: RoomMember[];

  @ManyToOne(() => User, (user) => user.createdRooms, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => RoomMessage, (message) => message.room)
  messages: RoomMessage[];
}
