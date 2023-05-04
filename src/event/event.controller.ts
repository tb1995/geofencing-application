import {
  BadRequestException,
  Body,
  Catch,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateEventDto } from './dtos/create-event.dto';
import { Request, Express } from 'express';
import { JwtAuthGuard } from '../user/auth/auth.guard';
import { Roles } from '../user/auth/roles.decorator';
import { EventService } from './event.service';
import { UpdateEventDto } from './dtos/update-event.dto';
import { QueryFailedError } from 'typeorm';
import { User } from '../typeorm';
import { RolesGuard } from '../user/auth/roles.guard';

@Controller('events')
export class EventController {
  constructor(private eventService: EventService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('organization')
  create(@Body() body: CreateEventDto, @Req() req: Request) {
    let time;
    try {
      time = body.time;
    } catch (e) {
      throw new BadRequestException('Date is in an incorrect format');
    }
    const user: User = <User>req.user;
    return this.eventService.create(
      body.name,
      body.latitude,
      body.longitude,
      time,
      user
    );
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('organization')
  update(@Body() body: UpdateEventDto, @Req() req, @Param('id') id: string) {
    const user: User = <User>req.user;
    return this.eventService.update(body, parseInt(id), user);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  getEventById(@Param('id') eventId: string) {
    return this.eventService.findEventById(parseInt(eventId));
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('organization')
  deleteEventById(@Param('id') eventId: string, @Req() req) {
    const user: User = <User>req.user;
    return this.eventService.deleteEventById(parseInt(eventId), user);
  }

  @Post('/:id/attend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('consumer')
  userAttendsEvent(@Param('id') eventId: string, @Req() req) {
    const user: User = <User>req.user;

    try {
      return this.eventService.userAttendsEvent(parseInt(eventId), user);
    } catch (e) {
      if (e instanceof QueryFailedError) {
        throw new HttpException(
          'You are already attending this event',
          HttpStatus.CONFLICT
        );
      }
    }
  }

  @Post('/:id/collaborate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('organization')
  organizationCollaboratesOnEvent(@Param('id') eventId: string, @Req() req) {
    const user: User = <User>req.user;

    return this.eventService.organizationCollaboratesOnEvent(
      parseInt(eventId),
      user
    );
  }

  @Get('/:id/attendees')
  getEventAttendees(@Param('id') eventId) {
    return this.eventService.getEventAttendees(parseInt(eventId));
  }

  @Get('/:id/collaborators')
  getEventCollaboratos(@Param('id') eventId) {
    return this.eventService.getEventCollaborators(parseInt(eventId));
  }

  @Get()
  getUsersEvents() {}
}
