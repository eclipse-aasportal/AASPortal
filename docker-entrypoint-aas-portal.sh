#!/bin/sh

#******************************************************************************
#
# Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
# eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
# zur Foerderung der angewandten Forschung e.V.
#
#*****************************************************************************/

set -euo pipefail

# Replace BASE_HREF placeholder in config.js with the actual environment variable value
# Default to '/' if BASE_HREF is not set
BASE_HREF_VALUE="${BASE_HREF:-/}"

# Replace THEME_PRIMARY_COLOR/THEME_SECONDARY_COLOR placeholders in config.js with the actual
# environment variable values. Default to '' (empty) if unset, which means "use the built-in color".
THEME_PRIMARY_COLOR_VALUE="${THEME_PRIMARY_COLOR:-}"
THEME_SECONDARY_COLOR_VALUE="${THEME_SECONDARY_COLOR:-}"

# Replace COMPANY_URL placeholder in config.js with the actual environment variable value.
# Default to '' (empty) if unset, which means "use the built-in homepage".
COMPANY_URL_VALUE="${COMPANY_URL:-}"

CONFIG_TEMPLATE=""
CONFIG_TARGET=""

find_template() {
    for candidate in \
        /usr/src/app/wwwroot/config.js.template \
        /usr/share/nginx/html/config.js.template; do
        if [ -f "$candidate" ]; then
            CONFIG_TEMPLATE="$candidate"
            CONFIG_TARGET="${candidate%.template}"
            echo "[entrypoint] Using template: $CONFIG_TEMPLATE"
            echo "[entrypoint] Target config: $CONFIG_TARGET"
            return 0
        fi
    done
    return 1
}

if ! find_template; then
    echo "[entrypoint] config.js template missing in known locations"
    exit 1
fi

echo "[entrypoint] Setting BASE_HREF to: $BASE_HREF_VALUE"
echo "[entrypoint] Setting THEME_PRIMARY_COLOR to: ${THEME_PRIMARY_COLOR_VALUE:-<built-in>}"
echo "[entrypoint] Setting THEME_SECONDARY_COLOR to: ${THEME_SECONDARY_COLOR_VALUE:-<built-in>}"
echo "[entrypoint] Setting COMPANY_URL to: ${COMPANY_URL_VALUE:-<built-in>}"

# Render config.js from template
sed \
    -e "s|%BASE_HREF%|$BASE_HREF_VALUE|g" \
    -e "s|%THEME_PRIMARY_COLOR%|$THEME_PRIMARY_COLOR_VALUE|g" \
    -e "s|%THEME_SECONDARY_COLOR%|$THEME_SECONDARY_COLOR_VALUE|g" \
    -e "s|%COMPANY_URL%|$COMPANY_URL_VALUE|g" \
    "$CONFIG_TEMPLATE" > "$CONFIG_TARGET"

# Ensure generated file is world-readable for nginx/node
chmod 644 "$CONFIG_TARGET"

# Execute the provided command (defaults to "node aas-node.js")
exec "$@"
