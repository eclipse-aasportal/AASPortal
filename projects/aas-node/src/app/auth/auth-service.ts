/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
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
import { USER_STORAGE, UserStorage } from './user-storage.js';
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
        @inject(USER_STORAGE) private readonly userStorage: UserStorage,
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

    public async login(credentials: Credentials): Promise<AuthResult> {
        const data = await this.userStorage.read(credentials.id);
        if (!data) {
            throw new ApplicationError(ERRORS.UnknownUser, { id: credentials.id }, 400);
        }

        await this.checkPassword(credentials.password, data.password);
        const token = this.generateToken(data.id, data.name, data.role);
        data.lastLoggedIn = new Date();
        await this.userStorage.write(credentials.id, data);
        return { token };
    }

    public async getProfile(id: string): Promise<UserProfile> {
        const data = await this.userStorage.read(id);
        if (data == null) {
            throw new ApplicationError(ERRORS.UnknownUser, { id }, 400);
        }

        return { id: data.id, name: data.name } as UserProfile;
    }

    public async updateProfile(id: string, profile: UserProfile): Promise<AuthResult> {
        const data = await this.userStorage.read(id);
        if (data == null) {
            throw new ApplicationError(ERRORS.UnknownUser, { id }, 400);
        }

        if (profile.password) {
            if (!isValidPassword(profile.password)) {
                throw new ApplicationError(ERRORS.InvalidPassword, undefined, 400);
            }

            data.password = await bcrypt.hash(profile.password, 10);
        }

        data.name = isEmpty(profile.name) ? getUserNameFromEMail(profile.id) : profile.name;

        if (profile.id && id.toLowerCase() === profile.id.toLowerCase()) {
            await this.userStorage.write(id, data);
        } else {
            if (await this.userStorage.exist(profile.id)) {
                throw new ApplicationError(ERRORS.UserAlreadyExists, { id: profile.id }, 409);
            }

            await this.userStorage.write(profile.id, data);
            await this.userStorage.delete(id);
        }

        const token = this.generateToken(data.id, data.name, data.role);

        return { token };
    }

    public async registerUser(profile: UserProfile): Promise<AuthResult> {
        if (!isValidEMail(profile.id)) {
            throw new ApplicationError(ERRORS.InvalidEMail, { id: profile.id }, 400);
        }

        if (await this.userStorage.exist(profile.id)) {
            throw new ApplicationError(ERRORS.UserAlreadyExists, { id: profile.id }, 409);
        }

        if (!profile.password || !isValidPassword(profile.password)) {
            throw new ApplicationError(ERRORS.InvalidPassword, undefined, 400);
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
        await this.userStorage.write(profile.id, data);
        return { token };
    }

    public async resetPassword(id: string): Promise<void> {
        const data = await this.userStorage.read(id);
        if (data == null) {
            throw new ApplicationError(ERRORS.UnknownUser, { id }, 400);
        }

        const password = this.createPassword();
        this.mailer.sendNewPassword(id, password);
        data.password = await bcrypt.hash(password, 10);
        await this.userStorage.write(id, data);
    }

    public async deleteUserAsync(id: string): Promise<void> {
        if (!(await this.userStorage.delete(id))) {
            throw new ApplicationError(ERRORS.UnknownUser, { id }, 400);
        }
    }

    public getCookie(id: string, name: string): Promise<Cookie | undefined> {
        return this.userStorage.getCookie(id, name);
    }

    public getCookies(id: string): Promise<Cookie[]> {
        return this.userStorage.getCookies(id);
    }

    public setCookie(id: string, name: string, data: string): Promise<void> {
        return this.userStorage.setCookie(id, name, data);
    }

    public deleteCookie(id: string, name: string): Promise<void> {
        return this.userStorage.deleteCookie(id, name);
    }

    public hasUser(id: string): Promise<boolean> {
        return this.userStorage.exist(id);
    }

    private generateToken(subject: string, name: string, role: UserRole): string {
        const payload: JWTPayload = { name, role };
        return jwt.sign(payload, this.privateKey, {
            subject,
            expiresIn: this.variable.JWT_EXPIRES_IN,
            algorithm: this.algorithm,
        });
    }

    private async checkPassword(password: string, hash: string) {
        if (!(await bcrypt.compare(password, hash))) {
            throw new ApplicationError(ERRORS.InvalidPassword, undefined, 401);
        }
    }

    private createPassword(): string {
        return Math.random().toString(36).slice(-8);
    }
}
