import { Geofence } from '@/geofence/geofence.entity';
import {
  AfterInsert,
  AfterRemove,
  AfterUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'user_id',
  })
  id: number;

  @Column({
    name: 'first_name',
    nullable: false,
    default: '',
  })
  firstName: string;

  @Column({
    name: 'last_name',
    nullable: false,
    default: '',
  })
  lastName: string;

  @Column({
    nullable: false,
    default: '',
  })
  username: string;

  @Column({
    name: 'email_address',
    nullable: false,
    default: '',
    unique: true,
  })
  email: string;

  @Column({
    name: 'photo',
    nullable: true,
    default: '',
  })
  photo: string;

  @Column({
    nullable: false,
    default: '',
  })
  password: string;

  @Column({
    name: 'created_on',
    nullable: false,
    default: new Date(),
  })
  createdOn: Date;

  @Column({
    name: 'is_verified',
    nullable: false,
    default: false,
  })
  isVerified: Boolean;

  @Column({
    name: 'is_deleted',
    nullable: false,
    default: false,
  })
  isDeleted: Boolean;

  @OneToMany((type) => Geofence, (geofence) => geofence.user)
  geofence: Geofence[];

  @Column({
    name: 'last_login_at',
    type: 'timestamp',
    nullable: true,
    default: null,
  })
  public lastLoginAt: Date | null;

  /**
   * Hooks
   */
  @AfterInsert()
  logInsert() {
    console.log('Inserted User with ID: ', this.id);
  }

  @AfterUpdate()
  logUpdate() {
    console.log('Updated User with ID: ', this.id);
  }

  @AfterRemove()
  logRemove() {
    console.log('Removed User with ID ', this.id);
  }
}
