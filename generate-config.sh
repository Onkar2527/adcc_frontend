#!/bin/sh
set -e

CONFIG_FILE="/usr/share/nginx/html/assets/config/config.json"

# Check if the directory exists, if not create it
mkdir -p "$(dirname "$CONFIG_FILE")"

# Read environment variables with fallback values from config.prod.json if not specified
API_URL="${API_URL:-https://auditpronxtbackend.kredpool.in}"
COMPANY_UUID="${COMPANY_UUID:-from_config}"
BANK_NAME="${BANK_NAME:-KREDPOOL SOLUTIONS PVT LTD.}"

echo "Generating runtime configuration..."
echo "API_URL: $API_URL"
echo "COMPANY_UUID: $COMPANY_UUID"
echo "BANK_NAME: $BANK_NAME"

# Write the config.json file
cat <<EOF > "$CONFIG_FILE"
{
  "company_uuid4": "$COMPANY_UUID",
  "apiUrl": "$API_URL",
  "bank_name": "$BANK_NAME"
}
EOF

echo "Runtime configuration generated successfully."
