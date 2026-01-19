import { IUser } from "./user";

export interface IRoomMember {
  id: number;
  room: IRoom;
  user: IUser;
  role: "member" | "admin" | "owner";
  joinedAt: Date;
}

export interface IRoomCategory {
  id: number;
  title: string;
  slug: string;
  createdAt: string;
  rooms: IRoom[];
}

export interface IRoom {
  id: number;
  name: string;
  code: string;
  type: "public" | "paid" | "invite_only";
  duration: number;
  fee: number;
  description?: string;
  photo?: string;
  status?: string;
  is_disposable?: boolean;
  expiresAt?: string;
  anonymous_mode?: boolean;
  createdAt: string;
  room_category?: IRoomCategory | null;
  owner: IUser[];
  members: IRoomMember[];
}
