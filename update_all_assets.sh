#!/bin/bash
ASSET_DIR="/mnt/AppPool/lyrewight1_app/src/assets"

# Regenerate all_assets.json
python3 -c "
import json, os

def get_files(path, ext):
    full_path = os.path.join('$ASSET_DIR', path)
    if not os.path.exists(full_path):
        return []
    return sorted([f for f in os.listdir(full_path) if f.endswith(ext)])

data = {
    'assets': get_files('', '.png'),
    'audio': get_files('audio', '.mp3'),
    'fonts': get_files('fonts', '.ttf'),
    'maps': get_files('maps', '.png')
}

print(json.dumps(data, indent=4))
" > "$ASSET_DIR/all_assets.json"

echo "all_assets.json has been updated."