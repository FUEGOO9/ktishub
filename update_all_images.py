# -*- coding: utf-8 -*-
import json
import re

# Load INITIAL_PRODUCTS from src/data/initialProducts.ts
with open('src/data/initialProducts.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

m = re.search(r'export const INITIAL_PRODUCTS: Product\[\] = (\[[\s\S]*\]);', ts_content)
if not m:
    print("Could not find INITIAL_PRODUCTS array in ts file")
    exit(1)

products = json.loads(m.group(1))

# Map album_id -> product
album_to_prod = {}
title_to_prod = {}
for p in products:
    url = p.get('url', '')
    album_match = re.search(r'/albums/(\d+)', url)
    if album_match:
        album_to_prod[album_match.group(1)] = p
    title_to_prod[p.get('title', '').strip().lower()] = p

print(f"Loaded {len(products)} products from initialProducts.ts")
print(f"Indexed {len(album_to_prod)} by album ID")
