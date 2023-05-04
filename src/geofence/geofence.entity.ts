import { User } from '../user/user.entity';
import { Expose } from 'class-transformer';
import {
  AfterInsert,
  AfterRemove,
  AfterUpdate,
  Column,
  Entity,
  Geometry,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'geofence' })
export class Geofence {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'geofence_id',
  })
  id: number;

  @Column({
    name: 'name',
    nullable: false,
    type: 'varchar',
  })
  name: string;

  @Column({
    name: 'geofence',
    nullable: true,
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  geofence: Geometry;

  @Column({
    name: 'is_active',
    nullable: false,
    default: true,
  })
  isActive: Boolean;

  @Column({
    name: 'user_id',
  })
  userId: number;

  @ManyToOne((type) => User, (user) => user.geofence)
  user: User;
  // geofence: Promise<User>;
}
