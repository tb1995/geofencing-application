import { Geofence } from '../geofence/geofence.entity';
import { Event } from '../event/event.entity';
import {
  AfterInsert,
  AfterRemove,
  AfterUpdate,
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

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
  @Exclude()
  password: string;

  @Column({
    name: 'created_on',
    nullable: false,
    default: new Date(),
  })
  createdOn: Date;

  @Column({
    name: 'role',
    nullable: false,
    default: 'consumer',
  })
  role: 'organization' | 'consumer';

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

  @OneToMany((type) => Event, (event) => event.user)
  event: Event[];

  @ManyToMany(() => Event, (event) => event.collaborators, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  collaborating?: Event[];

  @ManyToMany(() => Event, (event) => event.attendees, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  attending?: Event[];

  @Column({
    name: 'last_login_at',
    type: 'timestamp',
    nullable: true,
    default: null,
  })
  public lastLoginAt: Date | null;
}
