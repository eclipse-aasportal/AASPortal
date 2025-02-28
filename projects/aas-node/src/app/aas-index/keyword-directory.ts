/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import path from 'path';
import { inject, singleton } from 'tsyringe';
import { Variable } from '../variable.js';
import { Logger } from '../logging/logger.js';

@singleton()
export class KeywordDirectory {
    private directory: [string, string][] = [];

    public constructor(
        @inject(Variable) private readonly variable: Variable,
        @inject('Logger') private readonly logger: Logger,
    ) {
        const file = path.resolve(this.variable.ASSETS, 'keywords.json');
        if (!fs.existsSync(file)) {
            this.wait = Promise.resolve();
            return;
        }

        this.wait = fs.promises
            .readFile(file)
            .then(value => {
                this.directory = JSON.parse(value.toString());
                this.directory.forEach((item, i, array) => {
                    array[i] = [item[0].toLocaleLowerCase(), item[1].toLocaleLowerCase()];
                });

                this.logger.info(`Keyword directory loaded from ${file}`);
            })
            .catch(error => this.logger.error(error));
    }

    public readonly wait: Promise<void>;

    public containedKeyword(s: string, language?: string): string[] {
        const result: string[] = [];
        s = s.toLocaleLowerCase();
        for (const [keyword, lang] of this.directory) {
            if (!lang || !language || lang === language) {
                if (s.indexOf(keyword) >= 0) {
                    result.push(keyword);
                }
            }
        }

        return result;
    }

    public toString(keywords: string[], separator: string, max: number = 0): string {
        if (keywords.length === 0) {
            return '';
        }

        let s = keywords[0];
        for (let i = 1, n = keywords.length; i < n; i++) {
            const keyword = keywords[i];
            if (max > 0 && s.length + separator.length + keyword.length >= max) {
                break;
            }

            s += separator + keyword;
        }

        return s;
    }
}
