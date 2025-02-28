/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import nodemailer from 'nodemailer';
import { Logger } from './logging/logger.js';

@singleton()
export class Mailer {
    private transporter: unknown;

    public constructor(@inject('Logger') private readonly logger: Logger) {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            auth: {
                user: 'username',
                pass: 'password',
            },
        });
    }

    /**
     * Sends a new password to the specified e-mail.
     * @param email The e-mail address.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public sendNewPassword(email: string, password: string): void {
        throw new Error('Sending e-mails not implemented');
    }

    /**
     * Sends an initial password to a new user withe the specified e-mail.
     * @param email The e-mail of the new user.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public sendPassword(email: string, password: string) {
        throw new Error('Sending e-mails not implemented');
    }
}
