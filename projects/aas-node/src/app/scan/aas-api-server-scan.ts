/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

<<<<<<< HEAD
import { AASDocument } from 'aas-core';
import { Logger } from '../logging/logger.js';
import { ApiClient, AASLabel } from '../package/api/api-client.js';
import { ApiPackage } from '../package/api/api-package.js';
=======
import { AASDocument, PagedResult } from 'aas-core';
import { ApiClient } from '../client/api/api-client.js';
>>>>>>> development
import { AASServerScan } from './aas-server-scan.js';

export class AASApiServerScan extends AASServerScan {
<<<<<<< HEAD
    private readonly logger: Logger;
    private readonly client: ApiClient;

    public constructor(logger: Logger, server: ApiClient) {
=======
    public constructor(private readonly client: ApiClient) {
>>>>>>> development
        super();
    }

    protected override open(): Promise<void> {
        return this.client.open();
    }
    protected override close(): Promise<void> {
        return this.client.close();
    }

<<<<<<< HEAD
    protected override createDocument(id: AASLabel): Promise<AASDocument> {
        const aasPackage = new ApiPackage(this.logger, this.client, id.id, id.idShort);
        return aasPackage.createDocument();
=======
    protected override createDocument(id: string): Promise<AASDocument> {
        return this.client.createDocument(id);
>>>>>>> development
    }

    protected override nextEndpointPage(cursor: string | undefined): Promise<PagedResult<string>> {
        return this.client.getShells(cursor);
    }
}
