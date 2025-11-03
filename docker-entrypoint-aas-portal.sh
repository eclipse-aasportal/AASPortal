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

echo "Setting BASE_HREF to: $BASE_HREF_VALUE"

# Replace the placeholder in config.js
sed -i "s|%BASE_HREF%|$BASE_HREF_VALUE|g" /usr/share/nginx/html/config.js

# Execute the default nginx entrypoint
exec /docker-entrypoint.sh "$@"
