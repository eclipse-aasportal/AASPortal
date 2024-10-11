/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import isEmpty from 'lodash-es/isEmpty.js';
import { Mailer } from '../mailer.js';
import { ERRORS } from '../errors.js';
import { UserData } from './user-data.js';
import { UserStorage } from './user-storage.js';
import { Variable } from '../variable.js';
import {
    Credentials,
    UserProfile,
    isValidEMail,
    isValidPassword,
    ApplicationError,
    UserRole,
    getUserNameFromEMail,
    Cookie,
    JWTPayload,
    AuthResult,
} from 'aas-core';

@singleton()
export class AuthService {
    private readonly algorithm: jwt.Algorithm;
    private readonly privateKey: string;

    public constructor(
        @inject(Mailer) private readonly mailer: Mailer,
        @inject('UserStorage') private readonly userStorage: UserStorage,
        @inject(Variable) private readonly variable: Variable,
    ) {
        if (variable.JWT_PUBLIC_KEY) {
            this.algorithm = 'RS256';
            this.privateKey = fs.readFileSync(variable.JWT_SECRET, 'utf8');
        } else {
            this.algorithm = 'HS256';
            this.privateKey = variable.JWT_SECRET;
        }
    }

    public async loginAsync(credentials?: Credentials): Promise<AuthResult> {
        let token: string;
        if (credentials?.id) {
            if (credentials.password) {
                const data = await this.userStorage.readAsync(credentials.id);
                if (!data) {
                    throw new ApplicationError(`Unknown user ${credentials.id}.`, ERRORS.UnknownUser, credentials.id);
                }

                await this.checkPasswordAsync(credentials.password, data.password);
                token = this.generateToken(data.id, data.name, data.role);
                data.lastLoggedIn = new Date();
                await this.userStorage.writeAsync(credentials.id, data);
            } else {
                token = this.generateExternalToken(credentials.id);
            }
        } else {
            token = this.generateGuestToken();
        }

        return { token };
    }

    public async getProfileAsync(id: string): Promise<UserProfile> {
        const data = await this.userStorage.readAsync(id);
        if (data == null) {
            throw new ApplicationError(`Unknown user ${id}.`, ERRORS.UnknownUser, id);
        }

        return { id: data.id, name: data.name } as UserProfile;
    }

    public async updateProfileAsync(id: string, profile: UserProfile): Promise<AuthResult> {
        const data = await this.userStorage.readAsync(id);
        if (data == null) {
            throw new ApplicationError(`Unknown user ${id}.`, ERRORS.UnknownUser, id);
        }

        if (profile.password) {
            if (!isValidPassword(profile.password)) {
                throw new ApplicationError('Invalid password.', ERRORS.InvalidPassword);
            }

            data.password = await bcrypt.hash(profile.password, 10);
        }

        data.name = isEmpty(profile.name) ? getUserNameFromEMail(profile.id) : profile.name;

        if (profile.id && id.toLowerCase() === profile.id.toLowerCase()) {
            await this.userStorage.writeAsync(id, data);
        } else {
            if (await this.userStorage.existAsync(profile.id)) {
                throw new ApplicationError(
                    `An account already exists for this e-mail '${profile.id}'.`,
                    ERRORS.UserAlreadyExists,
                    profile.id,
                );
            }

            await this.userStorage.writeAsync(profile.id, data);
            await this.userStorage.deleteAsync(id);
        }

        const token = this.generateToken(data.id, data.name, data.role);

        return { token };
    }

    public async registerUserAsync(profile: UserProfile): Promise<AuthResult> {
        if (!isValidEMail(profile.id)) {
            throw new ApplicationError(`'${profile.id}' is not a valid e-mail.`, ERRORS.InvalidEMail);
        }

        if (await this.userStorage.existAsync(profile.id)) {
            throw new ApplicationError(
                `An account already exists for this e-mail '${profile.id}'.`,
                ERRORS.UserAlreadyExists,
                profile.id,
            );
        }

        if (!profile.password || !isValidPassword(profile.password)) {
            throw new ApplicationError('Invalid password.', ERRORS.InvalidPassword);
        }

        let name = profile.name;
        if (isEmpty(name)) {
            name = getUserNameFromEMail(profile.id);
        }

        const data: UserData = {
            id: profile.id,
            name: name,
            role: 'editor',
            password: await bcrypt.hash(profile.password, 10),
            created: new Date(),
            lastLoggedIn: new Date(0),
        };

        const token = this.generateToken(data.id, data.name, data.role);
        await this.userStorage.writeAsync(profile.id, data);
        return { token };
    }

    public async resetPasswordAsync(id: string): Promise<void> {
        const data = await this.userStorage.readAsync(id);
        if (data == null) {
            throw new ApplicationError(`Unknown user ${id}.`, ERRORS.UnknownUser, id);
        }

        const password = this.createPassword();
        this.mailer.sendNewPassword(id, password);
        data.password = await bcrypt.hash(password, 10);
        await this.userStorage.writeAsync(id, data);
    }

    public async deleteUserAsync(id: string): Promise<void> {
        if (!(await this.userStorage.deleteAsync(id))) {
            throw new ApplicationError(`Unknown user ${id}.`, ERRORS.UnknownUser, id);
        }
    }

    public getCookieAsync(id: string, name: string): Promise<Cookie | undefined> {
        return this.userStorage.getCookieAsync(id, name);
    }

    public getCookiesAsync(id: string): Promise<Cookie[]> {
        return this.userStorage.getCookiesAsync(id);
    }

    public setCookieAsync(id: string, name: string, data: string): Promise<void> {
        return this.userStorage.setCookieAsync(id, name, data);
    }

    public deleteCookieAsync(id: string, name: string): Promise<void> {
        return this.userStorage.deleteCookieAsync(id, name);
    }

    public hasUserAsync(id: string): Promise<boolean> {
        return this.userStorage.existAsync(id);
    }

    private generateToken(subject: string, name: string, role: UserRole): string {
        const payload: JWTPayload = { name, role };
        return jwt.sign(payload, this.privateKey, {
            subject,
            expiresIn: this.variable.JWT_EXPIRES_IN,
            algorithm: this.algorithm,
        });
    }

    private generateGuestToken(): string {
        const payload: JWTPayload = { role: 'guest' };
        return jwt.sign(payload, this.privateKey, {
            expiresIn: this.variable.JWT_EXPIRES_IN,
            algorithm: this.algorithm,
        });
    }

    private generateExternalToken(subject: string): string {
        const payload: JWTPayload = { role: 'guest' };
        return jwt.sign(payload, this.privateKey, {
            subject,
            expiresIn: this.variable.JWT_SHORT_EXP,
            algorithm: this.algorithm,
        });
    }

    private async checkPasswordAsync(password: string, hash: string) {
        if (!(await bcrypt.compare(password, hash))) {
            throw new ApplicationError('Invalid password.', ERRORS.InvalidPassword);
        }
    }

    private createPassword(): string {
        return Math.random().toString(36).slice(-8);
    }
}
