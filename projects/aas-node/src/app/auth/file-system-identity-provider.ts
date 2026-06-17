/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { join } from 'path/posix';
import { normalize, resolve } from 'path';
import fs from 'fs';

import { LOGGER, Logger } from 'aas-package';
import { IdentityProvider, UserData } from './identity-provider.js';
import { Variable } from '../variable.js';

@injectable()
export class FileSystemIdentityProvider extends IdentityProvider {
    private readonly usersDirectory: string;

    public constructor(@inject(LOGGER) logger: Logger, @inject(Variable) variable: Variable) {
        super(logger, variable);

        this.usersDirectory = resolve(normalize(`.${new URL(variable.IDENTITY_PROVIDER).pathname}`));
        if (!fs.existsSync(this.usersDirectory)) {
            fs.mkdirSync(this.usersDirectory, { recursive: true });
        }
    }

    protected override async read(userId: string): Promise<UserData | undefined> {
        const userFile = this.getUserFile(userId);
        return fs.existsSync(userFile) ? await this.readUserData(userFile) : undefined;
    }

    protected override async write(userId: string, data: UserData): Promise<void> {
        const dir = this.getUserDir(userId);
        if (!fs.existsSync(dir)) {
            await fs.promises.mkdir(dir);
        }

        await fs.promises.writeFile(this.getUserFile(userId), JSON.stringify(data));
    }

    protected override async delete(userId: string): Promise<boolean> {
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
        return join(this.usersDirectory, userId, 'user.json');
    }

    private getUserDir(userId: string): string {
        return join(this.usersDirectory, userId);
    }
}
