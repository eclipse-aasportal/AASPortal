/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from '@ngrx/store';
import { head } from 'lodash-es';
import { aas } from 'common';
import { State } from './aas.state';
import { encodeBase64Url } from 'projects/aas-lib/src/lib/convert';

const getReadOnly = (state: State) => state.aas.document?.readonly ?? true;
const getOnlineReady = (state: State) => state.aas.document?.onlineReady ?? false;
const getSearch = (state: State) => state.aas.search;
const getDocument = (state: State) => state.aas.document;
const getState = (state: State) => state.aas;

export const selectOnlineReady = createSelector(getOnlineReady, onlineReady => onlineReady);

export const selectReadOnly = createSelector(getReadOnly, readOnly => readOnly);

export const selectSearch = createSelector(getSearch, search => search);

export const selectDocument = createSelector(getDocument, document => document);

export const selectHasDocument = createSelector(getDocument, document => document != null);

export const selectState = createSelector(getState, state => state.state);

export const selectCanPlay = createSelector(
    getState,
    state => (state.document?.onlineReady ?? false) && state.state === 'offline',
);

export const selectCanStop = createSelector(
    getState,
    state => (state.document?.onlineReady ?? false) && state.state === 'online',
);

export const selectCanSynchronize = createSelector(getDocument, document =>
    document != null && !document.readonly && document.modified ? document.modified : false,
);

export const selectAddress = createSelector(getDocument, document => document?.address ?? '-');
export const selectIdShort = createSelector(getDocument, document => document?.idShort ?? '-');
export const selectId = createSelector(getDocument, document => document?.id ?? '-');
export const selectVersion = createSelector(getDocument, document =>
    versionToString(head(document?.content?.assetAdministrationShells)?.administration),
);

export const selectAssetId = createSelector(
    getDocument,
    document => head(document?.content?.assetAdministrationShells)?.assetInformation.globalAssetId ?? '-',
);

export const selectThumbnail = createSelector(getDocument, document => {
    if (document) {
        const name = encodeBase64Url(document.endpoint);
        const id = encodeBase64Url(document.id);
        return `/api/v1/containers/${name}/documents/${id}/thumbnail`;
    }

    return 'assets/resources/aas.svg';
});

function versionToString(administration?: aas.AdministrativeInformation): string {
    let version: string = administration?.version ?? '';
    const revision: string = administration?.revision ?? '';
    if (revision.length > 0) {
        if (version.length > 0) {
            version += ' (' + revision + ')';
        } else {
            version = revision;
        }
    }

    if (version.length === 0) {
        version = '-';
    }

    return version;
}
