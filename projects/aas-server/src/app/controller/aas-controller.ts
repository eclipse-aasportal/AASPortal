/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Controller } from 'tsoa';
import { AuthService } from '../auth/auth-service.js';
import { Logger } from '../logging/logger.js';
import { Variable } from '../variable.js';

export abstract class AASController extends Controller {
    protected constructor(
        protected readonly logger: Logger,
        protected readonly auth: AuthService,
        protected readonly variable: Variable,
    ) {
        super();
    }
}
