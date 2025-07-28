# To use: change directory into this file's dir and run it with Python command line
 
import requests
import json
import os


ASSETS_FILE_PATH  = os.path.abspath(os.path.join(os.path.dirname(__file__), '../resource/assets.js'))
ATLAS_FILE_PATH   = os.path.abspath(os.path.join(os.path.dirname(__file__), '../resource/atlas.png'))
BLOCK_DEF_URL     = "https://raw.githubusercontent.com/misode/mcmeta/summary/assets/block_definition/data.min.json"
MODELS_URL        = "https://raw.githubusercontent.com/misode/mcmeta/summary/assets/model/data.min.json"
ATLAS_MAPPING_URL = "https://raw.githubusercontent.com/misode/mcmeta/atlas/all/data.min.json"
ATLAS_IMAGE_URL   = "https://raw.githubusercontent.com/misode/mcmeta/atlas/all/atlas.png"

# Ensure the resource directory exists
os.makedirs(os.path.dirname(ASSETS_FILE_PATH), exist_ok=True)
os.makedirs(os.path.dirname(ATLAS_FILE_PATH), exist_ok=True) 

result = dict()

print("Processing: blockstates")

result["blockstates"] = requests.get(BLOCK_DEF_URL).json()

print("Processing: models")

result["models"] = requests.get(MODELS_URL).json()

print("Processing: textures")

result["textures"] = requests.get(ATLAS_MAPPING_URL).json()

with open(ASSETS_FILE_PATH, 'w') as f: 
  f.write(f"""const assetsData = JSON.parse('{ json.dumps(result, sort_keys=True, separators=(',', ':')) }')""")

print("Written into:", ASSETS_FILE_PATH)

# with open("./assets_debug.json", 'w') as f: 
#   f.write(json.dumps(result, sort_keys=True, indent=2))

# print("Written into debug file")

with open(ATLAS_FILE_PATH, 'wb') as f:
  f.write(requests.get(ATLAS_IMAGE_URL).content)