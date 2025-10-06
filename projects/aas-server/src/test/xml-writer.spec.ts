import fs from 'fs';
import { describe, it, expect } from '@jest/globals';
import { aas } from 'aas-core';

import { XmlWriter } from '../app/xml-writer.js';

describe('XmlWriter', () => {
    let writer: XmlWriter;

    it('reads an AAS as XML file', async () => {
        const env: aas.Environment = JSON.parse((await fs.promises.readFile('src/test/assets/test.json')).toString());
        writer = new XmlWriter();
        const xml = writer.write(env);
        expect(xml).toBeDefined();
    });
});
