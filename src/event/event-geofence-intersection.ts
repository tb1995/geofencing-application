/**
 * This class isn't an entity in the database
 * this class is for a specific result of a query
 * that returns information to send email notifications
 * to users who have geofences that overlap a newly created event
 */
export class EventGeofenceIntersection {
  event_id: number;
  event: string;
  email_address: string;
  name: string;
  first_name: string;
}
