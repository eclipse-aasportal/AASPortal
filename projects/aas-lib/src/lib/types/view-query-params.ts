/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { SubmodelViewDescriptor } from "../submodel-template/submodel-template";

export interface ViewQueryParams {
    format: string,
}

export interface ViewQuery {
    descriptor: SubmodelViewDescriptor;
}