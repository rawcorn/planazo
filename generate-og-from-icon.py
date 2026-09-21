from PIL import Image

# Open the PERFECT icon.png
icon = Image.open('src/app/icon.png').convert('RGBA')

# Create a 1200x630 background using the lilac color
lilac_bg = (228, 230, 248, 255)
og_img = Image.new('RGBA', (1200, 630), lilac_bg)

# We can keep the icon at 512x512, which fits nicely in the 630 height
# Paste it in the center
paste_x = (1200 - 512) // 2
paste_y = (630 - 512) // 2

# We paste the icon using itself as a mask so transparency is respected
og_img.paste(icon, (paste_x, paste_y), icon)

og_img.save('src/app/opengraph-image.png')
print("Open Graph image generated successfully using the perfect icon.png!")
