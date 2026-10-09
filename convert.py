import os
from PIL import Image

for file in os.listdir('src/assets'):
    if file.endswith('.png'):
        img = Image.open(f'src/assets/{file}')
        img.save(f'src/assets/{file.replace(".png", ".webp")}', 'webp', quality=80)
        print(f'Converted {file}')
