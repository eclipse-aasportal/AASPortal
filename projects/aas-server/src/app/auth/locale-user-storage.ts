/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import path from 'path';
import fs from 'fs';
import { UserStorage } from './user-storage.js';
import { UserData } from './user-data.js';

@injectable()
export class LocaleUserStorage extends UserStorage {
    private readonly usersDirectory: string;

    public constructor(@inject('USERS_DIR') usersDirectory: string) {
        super();

        this.usersDirectory = path.resolve(usersDirectory);

        if (!fs.existsSync(this.usersDirectory)) {
            fs.mkdirSync(this.usersDirectory);
        }
    }

    public existAsync(userId: string): Promise<boolean> {
        return new Promise<boolean>(resolve => resolve(fs.existsSync(this.getUserDir(userId))));
    }

    public async readAsync(userId: string): Promise<UserData | undefined> {
        const userFile = this.getUserFile(userId);
        return fs.existsSync(userFile) ? await this.readUserData(userFile) : undefined;
    }

    public async writeAsync(userId: string, data: UserData): Promise<void> {
        const dir = this.getUserDir(userId);
        if (!fs.existsSync(dir)) {
            await fs.promises.mkdir(dir);
        }

        await fs.promises.writeFile(this.getUserFile(userId), JSON.stringify(data));
    }

    public async deleteAsync(userId: string): Promise<boolean> {
        const dir = this.getUserDir(userId);
        if (fs.existsSync(dir)) {
            await fs.promises.rm(dir, { recursive: true });
            return true;
        }

        return false;
    }

    private async readUserData(path: string): Promise<UserData> {
        const data = JSON.parse((await fs.promises.readFile(path)).toString()) as UserData;
        data.created = new Date(data.created);
        data.lastLoggedIn = new Date(data.lastLoggedIn);
        return data as UserData;
    }

    private getUserFile(userId: string): string {
        return path.join(this.usersDirectory, userId, 'user.json');
    }

    private getUserDir(userId: string): string {
        return path.join(this.usersDirectory, userId);
    }
}