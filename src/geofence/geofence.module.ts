import { Module } from '@nestjs/common';
import { GeofenceService } from './geofence.service';
import { GeofenceController } from './geofence.controller';
import { Geofence } from './geofence.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Geofence])],
  providers: [GeofenceService],
  controllers: [GeofenceController],
  exports: [GeofenceService],
})
export class GeofenceModule {}
