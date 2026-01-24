import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { Role } from '../../../roles/entities/role.entity';
import { MedicalRecord } from '../../../medical_records/domains/entities/medical-record.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 250 })
  @Index('idx_user_nama') // Index untuk pencarian by nama
  nama_lengkap: string;

  @Column({ length: 50, unique: true })
  @Index('idx_user_username') // Index untuk login (search by username)
  username: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({
    type: 'varchar', // <--- [WAJIB DITAMBAHKAN]
    length: 255,
    unique: true,
    nullable: true,
  })
  @Index('idx_user_email')
  email: string | null;

  @CreateDateColumn()
  @Index('idx_user_created_at') // Index untuk sorting
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ default: true })
  @Index('idx_user_active') // Index agar filter isActive cepat
  is_active: boolean;

  @DeleteDateColumn() // Fitur Soft Delete bawaan TypeORM
  deleted_at: Date | null;

  @Column({ type: 'text', nullable: true })
  profile_photo: string | null;

  @ManyToMany(() => Role, (role) => role.users, {
    cascade: true,
  })
  @JoinTable({
    name: 'users_roles',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles: Role[];

  @OneToMany(() => MedicalRecord, (record) => record.doctor_id)
  medical_records: MedicalRecord[];
}
