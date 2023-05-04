import { Module } from '@nestjs/common';
import { GeofenceService } from './geofence.service';
import { GeofenceController } from './geofence.controller';
import { Geofence } from './geofence.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Geofence]), UserModule],
  providers: [GeofenceService],
  controllers: [GeofenceController],
  exports: [GeofenceService],
})
export class GeofenceModule {}
