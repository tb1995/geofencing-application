import { User } from '../user/user.entity';
import {
  AfterInsert,
  AfterRemove,
  AfterUpdate,
  Column,
  Entity,
  Geometry,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Event {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'event_id',
  })
  id: number;

  @Column({
    name: 'event',
    type: 'varchar',
  })
  name: string;

  @Column({
    name: 'time',
    type: 'timestamp',
  })
  time: Date;

  @Column({
    name: 'location',
    nullable: true,
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: Geometry;

  @ManyToOne((type) => User, (user) => user.event, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(
    () => User,
    (user) => user.collaborating, //optional
    { onDelete: 'CASCADE', onUpdate: 'NO ACTION' }
  )
  @JoinTable({
    name: 'event_collaborators',
    joinColumn: {
      name: 'event_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  collaborators?: User[];

  @ManyToMany(
    () => User,
    (user) => user.attending, //optional
    { onDelete: 'CASCADE', onUpdate: 'NO ACTION' }
  )
  @JoinTable({
    name: 'event_attendees',
    joinColumn: {
      name: 'event_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  attendees?: User[];
}
