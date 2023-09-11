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
    public abstract writeEnvironment(env: aas.Environment): any;
    public abstract write(referable: aas.Referable): any;
}