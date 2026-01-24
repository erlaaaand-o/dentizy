import { User } from '../../users/domains/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

export enum UserRole {
  DOKTER = 'dokter',
  STAF = 'staf',
  KEPALA_KLINIK = 'kepala_klinik',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  name: UserRole;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
