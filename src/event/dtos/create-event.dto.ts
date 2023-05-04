import { IsDate, IsLatitude, IsLongitude, IsString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsString()
  time: Date;
}
