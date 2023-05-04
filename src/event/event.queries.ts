export const EVENT_QUERIES = {
  query1:
    'select e.event_id, e.event, e.time, u.email_address, g.name, u.email_address, u.first_name from event e JOIN geofence g on ST_Intersects(e.location, g.geofence) JOIN users u on g.user_id = u.user_id where event_id=$1',
  EVENT_ATTENDEES_QUERY:
    'select users.user_id, first_name, last_name, username, email_address, role from users INNER JOIN event_attendees on users.user_id = event_attendees.user_id WHERE event_id = $1',
  EVENT_COLLABORATORS_QUERY:
    'select users.user_id, first_name, last_name, username, email_address, role from users INNER JOIN event_collaborators on users.user_id = event_collaborators.user_id WHERE event_id = $1',
  EVENT_COLLABORATORS_USER_IDS_QUERY:
    'select user_id from event_collaborators WHERE event_id = $1',
  FIND_USER_INFORMATION_BY_GEOFENCE_INTERSECTION:
    'select e.event_id, e.event, e.time, u.email_address, g.name, u.email_address, u.first_name from event e JOIN geofence g on ST_Intersects(e.location, g.geofence) JOIN users u on g.user_id = u.user_id where event_id=$1 AND g.is_active=true',
};
