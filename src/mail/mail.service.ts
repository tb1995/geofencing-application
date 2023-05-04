import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '../user/user.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserNotification(
    firstName: string,
    geofenceName: string,
    email: string,
    eventName: string,
    eventId: number
  ) {
    const url = `http://localhost:3000/events/${eventId}`;

    await this.mailerService.sendMail({
      to: email,
      from: 'ctrlb.email.sender@gmail.com',
      subject: 'A new event in your area!',
      template: './new-event-notification', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        name: firstName,
        url,
        eventName,
        geofence: geofenceName,
      },
    });
  }
}
