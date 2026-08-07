#!/bin/bash
MAP_DIR="/mnt/AppPool/lyrewight1_app/src/assets/maps"

# Simply regenerate the file. 
# Because the directory is owned by truenas_smb, the truenas_admin 
# user running this script needs Write access to the directory.
python3 -c "import json,os; print(json.dumps([f for f in os.listdir('$MAP_DIR') if f.endswith('.png')]))" > "$MAP_DIR/maps_list.json"