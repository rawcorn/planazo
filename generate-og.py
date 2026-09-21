from PIL import Image

# Open the original uploaded image
img_path = 'C:/Users/Carolina/.gemini/antigravity/brain/413fcbea-bba9-47d0-a9fc-801236ca1d36/.user_uploaded/media_1789957704987.png'
original = Image.open(img_path).convert('RGBA')

# Crop it to the logo (36, 6, 112, 90)
cropped = original.crop((36, 6, 112, 90))
cw, ch = cropped.size

# Make inner P white
pixels = cropped.load()
for y in range(ch):
    for x in range(cw):
        r, g, b, a = pixels[x, y]
        if g > b + 2 and r > 190:
            pixels[x, y] = (255, 255, 255, a)

# Make background transparent
old_bg = original.getpixel((0,0))
def color_dist(c1, c2):
    return sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])) ** 0.5

new_data = []
for y in range(ch):
    for x in range(cw):
        item = pixels[x, y]
        dist = color_dist(item, old_bg)
        if dist < 15:
            new_data.append((item[0], item[1], item[2], 0))
        elif dist < 50:
            alpha = int((dist - 15) / (50 - 15) * 255)
            if item == (255, 255, 255, 255):
                new_data.append(item)
            else:
                new_data.append((item[0], item[1], item[2], alpha))
        else:
            new_data.append(item)
cropped.putdata(new_data)

# Scale by exactly 2x (small and sharp)
scale = 2.5
lw = int(cw * scale)
lh = int(ch * scale)
logo_resized = cropped.resize((lw, lh), Image.Resampling.LANCZOS)

# Create 1200x630 background
lilac_bg = (228, 230, 248, 255)
og_img = Image.new('RGBA', (1200, 630), lilac_bg)

px = (1200 - lw) // 2
py = (630 - lh) // 2

og_img.paste(logo_resized, (px, py), logo_resized)
og_img.save('src/app/opengraph-image.png')
print("OG Image created with small/sharp logo!")
