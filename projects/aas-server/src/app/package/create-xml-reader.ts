/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DOMParser } from '@xmldom/xmldom';
import { AASReader } from './aas-reader.js';
import { HTMLDocumentElement } from '../types/html-document-element.js';
import { XmlReaderV1 } from './xml-reader-v1.js';
import { XmlReaderV2 } from './xml-reader-v2.js';
import { XmlReaderV3 } from './xml-reader-v3.js';

export function createXmlReader(xml: string): AASReader {
    const document = new DOMParser().parseFromString(xml);
    const nsMap = (document.documentElement as HTMLDocumentElement)._nsMap ?? {};
    for (const prefix in nsMap) {
        const uri = nsMap[prefix];
        if (uri === 'http://www.admin-shell.io/aas/1/0') {
            return new XmlReaderV1(document);
        }

        if (uri === 'http://www.admin-shell.io/aas/2/0') {
            return new XmlReaderV2(document);
        }

        if (uri === 'https://admin-shell.io/aas/3/0') {
            return new XmlReaderV3(document);
        }
    }

    throw new Error('Invalid operation.');
}
