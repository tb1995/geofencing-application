import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { isArray } from 'class-validator';
import { InsertResult } from 'typeorm';
import entities, { Geofence, User } from '../typeorm';
import { UpdateGeofenceDto } from './dtos/update-geofence.dto';
import { GeofenceModule } from './geofence.module';
import { GeofenceService } from './geofence.service';
import { LatLng } from './latlng.entity';

let TEST_CREATED_GEOFENCE_ID = 0;
const TEST_GEOFENCE_NAME = 'geofence name';
const TEST_GEOFENCE_LATLNGS = [
  {
    lat: 33.722666342939284,
    lng: 73.04417809086084,
  },
  {
    lat: 33.71074366065925,
    lng: 73.05284699039697,
  },
  {
    lat: 33.71873989390002,
    lng: 73.0695839746499,
  },
  {
    lat: 33.73087561056468,
    lng: 73.06134422855615,
  },
] as LatLng[];
const TEST_USER = { id: 1 } as User;
const TEST_USER_SECOND = { id: 2 } as User;

describe('GeofenceService', () => {
  let service: GeofenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeofenceService],
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST'),
            port: +configService.get<number>('DB_PORT'),
            username: configService.get('DB_USERNAME'),
            password: configService.get('DB_PASSWORD'),
            database: 'test_geoapp',
            entities: entities,
            synchronize: true,
            autoLoadEntities: true,
          }),

          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([Geofence]),
        GeofenceModule,
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: `.env.${process.env.NODE_ENV}`,
        }),
      ],
    }).compile();

    service = module.get<GeofenceService>(GeofenceService);
  });

  describe('Geofence Service', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('can create a geofence', async () => {
      const geofence = await service.create(
        TEST_GEOFENCE_NAME,
        TEST_GEOFENCE_LATLNGS,
        TEST_USER
      );
      // @ts-ignore
      TEST_CREATED_GEOFENCE_ID = geofence;
      expect(geofence).toBeDefined();
    });

    it('can read a geofence', async () => {
      const geofence = await service.findGeofenceById(TEST_CREATED_GEOFENCE_ID);
      expect(geofence).toBeDefined();
    });

    it('can read a users list of geofences', async () => {
      const geofence = await service.findAllGeofencesByUserId(TEST_USER.id);
      expect(isArray(geofence)).toBe(true);
      expect(geofence.length > 0).toBe(true);
    });

    /**
     * Update the name only, refetch from the database and compare old and new values
     */
    it('can update a geofences name', async () => {
      const geofence = await service.findGeofenceById(TEST_CREATED_GEOFENCE_ID);
      const updatedGeofenceDto = { name: 'updatedName' } as UpdateGeofenceDto;

      await service.update(
        updatedGeofenceDto,
        TEST_CREATED_GEOFENCE_ID,
        TEST_USER
      );
      const updatedGeofence = await service.findGeofenceById(
        TEST_CREATED_GEOFENCE_ID
      );
      expect(geofence.name === updatedGeofence.name).toBe(false);
    });

    it('can update a geofences geofence', async () => {
      const geofence = await service.findGeofenceById(TEST_CREATED_GEOFENCE_ID);
      const updatedGeofenceDto = {
        latLngs: TEST_GEOFENCE_LATLNGS,
      } as UpdateGeofenceDto;
      updatedGeofenceDto.latLngs[0].lat = 50;
      updatedGeofenceDto.latLngs[0].lng = 50;

      await service.update(
        updatedGeofenceDto,
        TEST_CREATED_GEOFENCE_ID,
        TEST_USER
      );
      const updatedGeofence = await service.findGeofenceById(
        TEST_CREATED_GEOFENCE_ID
      );
      expect(geofence.geofence === updatedGeofence.geofence).toBe(false);
    });

    it('unauthorized user cannot delete a geofence', async () => {
      expect(
        async () =>
          await service.delete(TEST_CREATED_GEOFENCE_ID, TEST_USER_SECOND)
      ).rejects.toThrow(ForbiddenException);
    });

    it('can delete a geofence', async () => {
      await service.delete(TEST_CREATED_GEOFENCE_ID, TEST_USER);
      expect(
        async () => await service.findGeofenceById(TEST_CREATED_GEOFENCE_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
