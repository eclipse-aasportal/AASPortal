/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { IocContainer, ServiceIdentifier } from '@tsoa/runtime';
import { container } from 'tsyringe';

export const iocContainer: IocContainer = {
    get: function <T>(controller: ServiceIdentifier<T>): T {
        return container.resolve<T>(controller as never);
    },
};
