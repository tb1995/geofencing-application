import { Test, TestingModule } from '@nestjs/testing';
import { GeofenceController } from './geofence.controller';

describe('GeofenceController', () => {
  let controller: GeofenceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeofenceController],
    }).compile();

    controller = module.get<GeofenceController>(GeofenceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
