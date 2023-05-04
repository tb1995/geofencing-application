import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, QueryFailedError, Repository } from 'typeorm';
import { Event } from './event.entity';
import { Request, Express } from 'express';
import { User } from '../user/user.entity';
import { UpdateEventDto } from './dtos/update-event.dto';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { EventGeofenceIntersection } from './event-geofence-intersection';
import { EVENT_QUERIES } from './event.queries';

@Injectable()
export class EventService {
  private logger = new Logger('Event Service');

  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    private userService: UserService,
    private mailService: MailService
  ) {}

  async create(
    name: string,
    latitude: number,
    longitude: number,
    time,
    user: User
  ) {
    const point = this.convertToWKTFormattedPoint(latitude, longitude);
    let eventId = await this.eventRepo
      .createQueryBuilder()
      .insert()
      .into(Event)
      .values([
        {
          name,
          location: () => point,
          time: time,
          user: user,
        },
      ])
      .returning('event_id')
      .execute()
      .catch((error) => {
        this.logger.warn(error);
        throw new Error(error);
      });

    //@ts-ignore
    eventId = eventId.raw[0]['event_id'];
    this.logger.log(`Event created with ID: ${eventId}`);

    /**
     * Find every user that created a geofence that overlaps with the location * of this newly created event
     */
    let intersections =
      await this.getUserDetailsForUsersWithGeofencesIntersectingWithCreatedEvent(
        //@ts-ignore
        eventId
      );

    // make sure no user is emailed twice in case of multiple overlapping geofences
    intersections = this.removeDuplicateEmails(intersections);

    // email each user that an event has been created in their area
    intersections.forEach((user: EventGeofenceIntersection) => {
      this.mailService.sendUserNotification(
        user.first_name,
        user.name,
        user.email_address,
        user.event,
        user.event_id
      );
    });
    //@ts-ignore
    this.organizationCollaboratesOnEvent(eventId, user);

    return eventId;
  }

  async getUserDetailsForUsersWithGeofencesIntersectingWithCreatedEvent(
    eventId: number
  ) {
    const userIds = await this.eventRepo.query(
      EVENT_QUERIES.GET_USER_DETAILS_FOR_USERS_WITH_GEOFENCES_INTERSECTING_WITH_CREATED_EVENT,
      [eventId]
    );
    return userIds;
  }

  async findEventById(eventId: number) {
    let event = await this.eventRepo.findOneBy({ id: eventId });
    if (!event) {
      throw new NotFoundException('Could not find an Event by this ID');
    }
    return event;
  }

  async update(body: UpdateEventDto, eventId: number, user: User) {
    let eventCollaborators = await this.getEventCollaboratorUserIds(eventId);
    let event = await this.findEventById(eventId);

    // @ts-ignore
    if (!eventCollaborators.includes(parseInt(user.id))) {
      throw new ForbiddenException('Not Allowed');
    }

    Object.assign(event, body);
    delete event['latitude'];
    delete event['longitude'];

    await this.eventRepo.update(eventId, event);

    if (body.latitude && body.longitude) {
      this.eventRepo
        .createQueryBuilder()
        .update()
        .set({
          location: () =>
            this.convertToWKTFormattedPoint(body.latitude, body.longitude),
        })
        .whereInIds(eventId)
        .execute()
        .catch((error) => {
          this.logger.warn(error);
        })
        .then(() => {
          this.logger.log(`Event Updated with ID: ${eventId}`);
        });
      //
    }
  }

  userAttendsEvent(eventId: number, user: User) {
    return this.eventRepo
      .createQueryBuilder()
      .insert()
      .into('event_attendees')
      .values({
        event_id: eventId,
        user_id: user.id,
      })
      .execute()
      .catch((error) => {
        this.logger.warn(error);
        if (error instanceof QueryFailedError) {
          throw new HttpException(
            'You are already attending this event',
            HttpStatus.CONFLICT
          );
        }
        throw new BadRequestException();
      })
      .then(() => {
        this.logger.log(
          `User with Id: ${user.id} is now attending Event with ID: ${eventId}`
        );
      });
  }

  organizationCollaboratesOnEvent(eventId: number, user: User) {
    return this.eventRepo
      .createQueryBuilder()
      .insert()
      .into('event_collaborators')
      .values({
        event_id: eventId,
        user_id: user.id,
      })
      .execute()
      .catch((error) => {
        if (error instanceof QueryFailedError) {
          this.logger.warn(error);
          throw new HttpException(
            'You are already collaborating on this event',
            HttpStatus.CONFLICT
          );
        }
        throw new BadRequestException();
      })
      .then(() => {
        this.logger.log(
          `User with Id: ${user.id} is now collaborating on Event with ID: ${eventId}`
        );
      });
  }

  async getEventAttendees(eventId: number): Promise<User[]> {
    return await this.eventRepo
      .query(EVENT_QUERIES.EVENT_ATTENDEES_QUERY, [eventId])
      .catch((error) => {
        this.logger.warn(error);
      });
  }

  async getEventCollaborators(eventId: number): Promise<User[]> {
    return await this.eventRepo
      .query(EVENT_QUERIES.EVENT_COLLABORATORS_QUERY, [eventId])
      .catch((error) => {
        this.logger.warn(error);
      });
  }

  async getEventCollaboratorUserIds(eventId: number): Promise<number[]> {
    let result = await this.eventRepo
      .query(EVENT_QUERIES.EVENT_COLLABORATORS_USER_IDS_QUERY, [eventId])
      .catch((error) => {
        this.logger.warn(error);
      });

    return this.extractUserId(result);
  }

  async deleteEventById(eventId: number, user: User) {
    //@ts-ignore
    user.id = parseInt(user.id);

    const listOfUserIds = await this.getEventCollaboratorUserIds(eventId);
    if (listOfUserIds.includes(user.id)) {
      return this.eventRepo
        .delete({
          id: eventId,
        })
        .catch((error) => {
          this.logger.warn(error);
        })
        .then(() => {
          this.logger.log(`Event was deleted with ID: ${eventId}`);
        });
    } else {
      throw new ForbiddenException(
        'You are not authorized to delete this event'
      );
    }
  }

  convertToWKTFormattedPoint(lat, lng) {
    return `ST_GeomFromText('POINT(${lng} ${lat})')`;
  }

  removeDuplicateEmails(userDataArray: EventGeofenceIntersection[]) {
    const uniqueEmails = new Set();
    return userDataArray.filter((userData) => {
      const isUnique = !uniqueEmails.has(userData.email_address);
      if (isUnique) {
        uniqueEmails.add(userData.email_address);
      }
      return isUnique;
    });
  }

  /**
   * A helper function for extracting the userIds from this
   * result set
   */
  extractUserId(resultSets) {
    const userIds = [];

    resultSets.forEach((resultSet) => {
      if (resultSet.hasOwnProperty('user_id')) {
        userIds.push(parseInt(resultSet.user_id));
      }
    });

    return userIds;
  }
}
