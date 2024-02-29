/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ViewMode } from 'aas-lib';
import { AASDocument, AASDocumentId } from 'common';

export interface StartState {
    viewMode: ViewMode;
    filter: string;
    limit: number;
    previous: AASDocumentId | null;
    next: AASDocumentId | null;
    totalCount: number;
    documents: AASDocument[];
    favorites: string;
}

export interface FavoritesList {
    name: string;
    documents: AASDocument[];
}

export interface StartFeatureState {
    start: StartState;
}
