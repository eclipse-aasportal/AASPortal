import fs from 'fs';
import { describe, it, expect } from '@jest/globals';
import { XmlReader } from '../app/xml-reader.js';

describe('XmlReader', () => {
    let reader: XmlReader;

    it('reads an AAS as XML file', async () => {
        const xml = (await fs.promises.readFile('src/test/assets/test.xml')).toString();
        reader = new XmlReader(xml);
        const env = reader.readEnvironment();
        expect(env.assetAdministrationShells[0].assetInformation.globalAssetId).toEqual(
            'http://customer.com/assets/KHBVZJSQKIY',
        );

        expect(env.assetAdministrationShells[0].assetInformation.defaultThumbnail?.path).toEqual('/MotorI40.JPG');
        expect(env.submodels[0].description).toEqual([{ language: 'EN', text: 'Identification from Manufacturer' }]);
        expect(env.conceptDescriptions[0].embeddedDataSpecifications?.at(0)?.dataSpecificationContent).toBeDefined();

        // await fs.promises.writeFile('src/test/assets/test.json', JSON.stringify(env));
    });
});
