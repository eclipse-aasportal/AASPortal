/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import * as aas from '../../lib/aas.js';
import { selectReferable } from '../../lib/document.js';
import { aasEnvironment } from './aas-environment.js';

export const testSubmodel: aas.Submodel = selectReferable(aasEnvironment, 'TechnicalData')!;

export const testProperty: aas.Property = selectReferable(aasEnvironment, 'TechnicalData', 'MaxRotationSpeed')!;

export const testSubmodelElementCollection: aas.SubmodelElementCollection = selectReferable(
    aasEnvironment,
    'Documentation',
    'OperatingManual',
)!;
