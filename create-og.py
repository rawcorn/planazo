from PIL import Image

img = Image.open('C:/Users/Carolina/.gemini/antigravity/brain/413fcbea-bba9-47d0-a9fc-801236ca1d36/.user_uploaded/media_1789957704987.png').convert("RGBA")
w, h = img.size

old_bg = img.getpixel((0,0))
def color_dist(c1, c2):
    return sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])) ** 0.5

# Step 1: Crop tightly
min_x, min_y = w, h
max_x, max_y = 0, 0
threshold = 20

for y in range(h):
    for x in range(w):
        if color_dist(img.getpixel((x, y)), old_bg) > threshold:
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y

cropped = img.crop((min_x, min_y, max_x, max_y))
cw, ch = cropped.size

# Step 2: Flood-fill the inside of the P to White
pixels = cropped.load()
start_x, start_y = cw//2, ch//2
while start_x < cw:
    r, g, b, a = pixels[start_x, start_y]
    if g > b + 2 and r > 190: # Light mint
        break
    start_x += 1

if start_x < cw:
    visited = set()
    q = [(start_x, start_y)]
    while q:
        cx, cy = q.pop(0)
        if (cx, cy) in visited:
            continue
        visited.add((cx, cy))
        
        r, g, b, a = pixels[cx, cy]
        if g > b + 2 and r > 190: 
            pixels[cx, cy] = (255, 255, 255, a)
            for nx, ny in [(cx-1, cy), (cx+1, cy), (cx, cy-1), (cx, cy+1)]:
                if 0 <= nx < cw and 0 <= ny < ch:
                    q.append((nx, ny))

# Step 3: Transparent background edges
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

# Step 4: Create OG Image (1200x630)
new_bg_color = (228, 230, 248, 255)
og_img = Image.new('RGBA', (1200, 630), new_bg_color)

# We want the logo to be prominently displayed in the center.
# Let's scale it to fit within 500px height (leaving 65px padding top/bottom)
target_height = 500
aspect_ratio = cw / ch

new_height = target_height
new_width = int(new_height * aspect_ratio)
    
resized = cropped.resize((new_width, new_height), Image.Resampling.LANCZOS)

paste_x = (1200 - new_width) // 2
paste_y = (630 - new_height) // 2

og_img.paste(resized, (paste_x, paste_y), resized)

# Save as opengraph-image.png inside src/app/
og_img.save('src/app/opengraph-image.png')
print("Open Graph image created successfully!")
