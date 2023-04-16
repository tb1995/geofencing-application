import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CreateGeofenceDto } from './dtos/create-geofence.dto';
import { GeofenceService } from './geofence.service';
import { Request, Express } from 'express';
import { JwtAuthGuard } from '@/user/auth/auth.guard';
import { UserDto } from '@/user/dtos/user.dto';
import { Serialize } from '@/interceptors/serialize-interceptor';
import { RolesGuard } from '@/user/auth/roles.guard';
import { Roles } from '@/user/auth/roles.decorator';

@Serialize(UserDto)
@Controller('geofence')
export class GeofenceController {
  constructor(private geofenceService: GeofenceService) {}

  //@ApiCreatedResponse({})
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('consumer')
  create(@Body() body: CreateGeofenceDto, @Req() req: Request) {
    console.log(body);
    this.geofenceService.create(body.name, body.latLngs, req);
  }
}
