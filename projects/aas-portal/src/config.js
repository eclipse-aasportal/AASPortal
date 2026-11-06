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
    // THEME_PRIMARY_COLOR / THEME_SECONDARY_COLOR will be replaced at runtime by the Docker entrypoint
    // script (e.g. "#009374"). Empty string (the default when an env var is unset) means "use the
    // built-in theme" for that color.
    window.__env__.THEME_PRIMARY_COLOR = '%THEME_PRIMARY_COLOR%';
    window.__env__.THEME_SECONDARY_COLOR = '%THEME_SECONDARY_COLOR%';
    // COMPANY_URL will be replaced at runtime by the Docker entrypoint script. Empty string (the
    // default when unset) means "use the built-in homepage" (see environment.ts). The company logo
    // image itself is a plain static file (assets/company-logo.svg) -- mount a replacement over it,
    // no code/config needed for that part.
    window.__env__.COMPANY_URL = '%COMPANY_URL%';
})(this);