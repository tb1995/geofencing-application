import { Geofence } from '../typeorm';
import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Express } from 'express';
import { GeoJSON, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { UpdateGeofenceDto } from './dtos/update-geofence.dto';
import { LatLng } from './latlng.entity';

@Injectable()
export class GeofenceService {
  private logger = new Logger('Geofence Service');

  @InjectRepository(Geofence)
  private readonly geofenceRepo: Repository<Geofence>;

  async create(name: string, latLngs: Array<LatLng>, user: User) {
    let polygon = this.convertToWKTFormattedPolygon(latLngs);
    let geofenceId = await this.geofenceRepo
      .createQueryBuilder()
      .insert()
      .into(Geofence)
      .values([
        {
          name: name,
          geofence: () => polygon,
          userId: user.id,
        },
      ])
      .returning('geofence_id')
      .execute()
      .catch((error) => {
        this.logger.warn(error);
        throw new Error(error);
      });

    // extract geofenceId from result set
    //@ts-ignore
    geofenceId = geofenceId.raw[0]['geofence_id'];
    this.logger.log(`Geofence created with ID: ${geofenceId}`);

    return geofenceId;
  }

  async findGeofenceById(geofenceId: number) {
    let geofence = await this.geofenceRepo.findOneBy({ id: geofenceId });
    if (!geofence) {
      throw new NotFoundException('Could not find a geofence by that ID');
    }
    return geofence;
  }

  async findAllGeofencesByUserId(userId: number) {
    return await this.geofenceRepo.find({
      where: {
        userId,
      },
    });
  }

  async update(body: UpdateGeofenceDto, geofenceId: number, user: User) {
    let geofence = await this.findGeofenceById(geofenceId);
    // forbid a user that isn't an owner of the geofence
    if (geofence.userId != user.id) {
      throw new ForbiddenException(
        'You are not authorized to perform this edit'
      );
    }

    // if the geofence is being updated
    if (body.latLngs) {
      let polygon = this.convertToWKTFormattedPolygon(body.latLngs);

      // necessary clean up for object.assign to work, as latlngs doesn't exist on the geofence object
      delete body.latLngs;

      Object.assign(geofence, body);

      this.geofenceRepo.update(geofenceId, geofence);

      // query builder if the geofence is being updated
      return this.geofenceRepo
        .createQueryBuilder()
        .update()
        .set({
          geofence: () => polygon,
        })
        .whereInIds(geofenceId)
        .execute()
        .catch((error) => {
          this.logger.warn(error);
        })
        .then(() => {
          this.logger.log(`Geofence was updated with ID ${geofenceId}`);
        });
    } else {
      // update query without the geofence
      Object.assign(geofence, body);
      return this.geofenceRepo.update(geofenceId, geofence);
    }
  }

  async delete(geofenceId: number, user: User) {
    let geofence = await this.findGeofenceById(geofenceId);
    if (geofence.userId != user.id) {
      throw new ForbiddenException(
        'You are not authorized to delete this geofence'
      );
    }

    return this.geofenceRepo
      .delete(geofenceId)
      .catch((error) => {
        this.logger.warn(error);
      })
      .then(() => {
        this.logger.log(`Geofence was deleted with ID ${geofenceId}`);
      });
  }

  convertToWKTFormattedPolygon(latlngs) {
    let polygon = `ST_GeomFromText('POLYGON((`;

    for (let i = 0; i < latlngs.length; i++) {
      const lat = latlngs[i].lat;
      const lng = latlngs[i].lng;

      polygon += lng + ' ' + lat + ',';
    }

    // close the polygon by repeating the first coordinate
    const firstLat = latlngs[0].lat;
    const firstLng = latlngs[0].lng;
    polygon += firstLng + ' ' + firstLat;

    polygon += `))')`;

    return polygon;
  }
}
