/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

(function(window) {
    window.__env__ = window.__env__ || {};
    // BASE_HREF will be replaced at runtime by the Docker entrypoint script
    window.__env__.BASE_HREF = '%BASE_HREF%';
})(this);