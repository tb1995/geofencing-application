import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { LatLng } from '../latlng.entity';

export class UpdateGeofenceDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsBoolean()
  @IsOptional()
  isActive: boolean;

  @IsArray()
  @Type(() => LatLng)
  @IsOptional()
  latLngs: LatLng[];
}
