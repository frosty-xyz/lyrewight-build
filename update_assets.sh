#!/bin/bash
ASSET_DIR="/mnt/AppPool/lyrewight1_app/src/assets"

# Regenerate assets.json
# Scans directory for shop_front* and shop_interior* files
python3 -c "
import json, os

files = os.listdir('$ASSET_DIR')

# Sort to keep the dropdowns in alphabetical order
exteriors = sorted([f for f in files if f.startswith('shop_front_') and f.endswith('.png')])
interiors = sorted([f for f in files if f.startswith('shop_interior_') and f.endswith('.png')])

data = {
    'exteriors': exteriors,
    'interiors': interiors
}

print(json.dumps(data, indent=4))
" > "$ASSET_DIR/assets.json"

echo "assets.json has been updated."