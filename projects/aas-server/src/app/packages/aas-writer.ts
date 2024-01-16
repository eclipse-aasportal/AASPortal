/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas } from 'common';

/**  */
export abstract class AASWriter {
    public abstract writeEnvironment<T>(env: aas.Environment): T;
    public abstract write<T>(referable: aas.Referable): T;
}
