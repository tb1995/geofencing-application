import { Geofence } from '../geofence/geofence.entity';
import { User } from '../user/user.entity';
import { Event } from '../event/event.entity';

/**
 * Mapping entities for TypeOrm
 */
const entities = [User, Geofence, Event];
//
export { User, Geofence, Event };
export default entities;
