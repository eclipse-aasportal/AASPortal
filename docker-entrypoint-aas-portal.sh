#!/bin/sh

#******************************************************************************
#
# Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
# eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
# zur Foerderung der angewandten Forschung e.V.
#
#*****************************************************************************/

# Replace BASE_HREF placeholder in config.js with the actual environment variable value
# Default to '/' if BASE_HREF is not set
BASE_HREF_VALUE="${BASE_HREF:-/}"

CONFIG_TEMPLATE=/usr/src/app/wwwroot/config.js.template
CONFIG_TARGET=/usr/src/app/wwwroot/config.js

if [ ! -f "$CONFIG_TEMPLATE" ]; then
    echo "config.js template missing at $CONFIG_TEMPLATE"
    exit 1
fi

echo "Setting BASE_HREF to: $BASE_HREF_VALUE"

# Render config.js from template
sed "s|%BASE_HREF%|$BASE_HREF_VALUE|g" "$CONFIG_TEMPLATE" > "$CONFIG_TARGET"

# Execute the provided command (defaults to "node aas-node.js")
exec "$@"
