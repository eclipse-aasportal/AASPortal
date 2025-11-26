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

# Render config.js from template
sed "s|%BASE_HREF%|$BASE_HREF_VALUE|g" "$CONFIG_TEMPLATE" > "$CONFIG_TARGET"

# Ensure generated file is world-readable for nginx/node
chmod 644 "$CONFIG_TARGET"

# Execute the provided command (defaults to "node aas-node.js")
exec "$@"
