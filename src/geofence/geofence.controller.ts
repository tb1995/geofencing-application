import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateGeofenceDto } from './dtos/create-geofence.dto';
import { GeofenceService } from './geofence.service';
import { Request, Express, request } from 'express';
import { JwtAuthGuard } from '../user/auth/auth.guard';
import { UserDto } from '../user/dtos/user.dto';
import { Serialize } from '../interceptors/serialize-interceptor';
import { RolesGuard } from '../user/auth/roles.guard';
import { Roles } from '../user/auth/roles.decorator';
import { UpdateGeofenceDto } from './dtos/update-geofence.dto';
import { Geofence, User } from '../typeorm';
import { plainToClass, plainToInstance } from 'class-transformer';

@Serialize(UserDto)
@Controller('geofences')
export class GeofenceController {
  constructor(private geofenceService: GeofenceService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('consumer')
  create(@Body() body: CreateGeofenceDto, @Req() req: Request) {
    const user: User = <User>req.user;
    this.geofenceService.create(body.name, body.latLngs, user);
  }

  @Put('/:geofenceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('consumer')
  update(
    @Body() body: UpdateGeofenceDto,
    @Param('geofenceId') geofenceId: string,
    @Req() req: Request
  ) {
    const user: User = <User>req.user;
    return this.geofenceService.update(body, parseInt(geofenceId), user);
  }

  @Delete('/:geofenceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('consumer')
  delete(@Param('geofenceId') geofenceId: string, @Req() req: Request) {
    const user: User = <User>req.user;
    return this.geofenceService.delete(parseInt(geofenceId), user);
  }

  @Get('/:geofenceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('consumer')
  findGeofenceById(
    @Param('geofenceId') geofenceId: string,
    @Req() req: Request
  ): Promise<Geofence> {
    return this.geofenceService.findGeofenceById(parseInt(geofenceId));
  }

  @Get('/users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('consumer')
  async findAllGeofencesByUserId(
    @Param('userId') userId: string,
    @Req() req: Request
  ) {
    let geofences = await this.geofenceService.findAllGeofencesByUserId(
      parseInt(userId)
    );

    const serialized = plainToInstance(UpdateGeofenceDto, geofences, {
      excludeExtraneousValues: false,
    });

    return serialized;
  }
}
