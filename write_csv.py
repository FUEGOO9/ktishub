# -*- coding: utf-8 -*-
import sys

# Write raw CSV data from prompt to csv_prompt.txt
with open('csv_prompt.txt', 'w', encoding='utf-8') as f:
    f.write(sys.stdin.read())

print("csv_prompt.txt created")
