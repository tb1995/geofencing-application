import { Geofence } from '@/typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Express } from 'express';
import { GeoJSON, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { LatLng } from './latlng.entity';

@Injectable()
export class GeofenceService {
  @InjectRepository(Geofence)
  private readonly geofenceRepo: Repository<Geofence>;

  create(name: string, latLngs: Array<LatLng>, req: Request) {
    const user: User = <User>req.user;
    console.log(user);

    let polygon = this.convertToPolygon(latLngs);
    return this.geofenceRepo
      .createQueryBuilder()
      .insert()
      .into(Geofence)
      .values([
        {
          name: name,
          geofence: () => polygon, //
          userId: user.id,
        },
      ])
      .returning('geofence_id')
      .execute();
  }

  convertToPolygon(latlngs) {
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
