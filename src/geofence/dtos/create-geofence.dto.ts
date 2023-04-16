import { Type } from 'class-transformer';
import {
  IsArray,
  IsLatitude,
  IsLatLong,
  IsLongitude,
  IsString,
  ValidateNested,
} from 'class-validator';
import { GeoJSON } from 'typeorm';
import { LatLng } from '../latlng.entity';

export class CreateGeofenceDto {
  @IsString()
  name: string;

  @IsArray()
  @Type(() => LatLng)
  latLngs: LatLng[];
}
