import { User } from '@/user/user.entity';
import {
  Column,
  Entity,
  Geometry,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
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
    name: 'user_id',
  })
  userId: number;

  @ManyToOne((type) => User, (user) => user.geofence)
  user: User;
  restaurant: Promise<User>;
}
