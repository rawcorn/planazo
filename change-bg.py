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
# We find a starting point. (cw//2, ch//2) should be inside the P.
pixels = cropped.load()

# Let's verify the start point is the light mint color
start_x, start_y = cw//2, ch//2
while start_x < cw:
    r, g, b, a = pixels[start_x, start_y]
    if g > b + 2 and r > 190: # Light mint
        break
    start_x += 1

if start_x < cw:
    # BFS Floodfill
    visited = set()
    q = [(start_x, start_y)]
    while q:
        cx, cy = q.pop(0)
        if (cx, cy) in visited:
            continue
        visited.add((cx, cy))
        
        r, g, b, a = pixels[cx, cy]
        if g > b + 2 and r > 190: # It's part of the light mint fill
            # We don't want to make the anti-aliased edge jagged.
            # But making it pure white is what the user wants.
            pixels[cx, cy] = (255, 255, 255, a)
            
            # add neighbors
            for nx, ny in [(cx-1, cy), (cx+1, cy), (cx, cy-1), (cx, cy+1)]:
                if 0 <= nx < cw and 0 <= ny < ch:
                    q.append((nx, ny))

# Step 3: Make background transparent using distance from old_bg
# We do this AFTER flood fill so we don't accidentally blend the white
new_data = []
for y in range(ch):
    for x in range(cw):
        item = pixels[x, y]
        dist = color_dist(item, old_bg)
        if dist < 15:
            new_data.append((item[0], item[1], item[2], 0))
        elif dist < 50:
            alpha = int((dist - 15) / (50 - 15) * 255)
            # if it was already made white, don't mess with its alpha based on old_bg distance
            if item == (255, 255, 255, 255):
                new_data.append(item)
            else:
                new_data.append((item[0], item[1], item[2], alpha))
        else:
            new_data.append(item)
            
cropped.putdata(new_data)

# Paste onto new lilac background
new_bg_color = (228, 230, 248, 255)
new_img = Image.new('RGBA', (512, 512), new_bg_color)

target_size = 410
aspect_ratio = cw / ch

if cw > ch:
    new_width = target_size
    new_height = int(new_width / aspect_ratio)
else:
    new_height = target_size
    new_width = int(new_height * aspect_ratio)
    
resized = cropped.resize((new_width, new_height), Image.Resampling.LANCZOS)

paste_x = (512 - new_width) // 2
paste_y = (512 - new_height) // 2

new_img.paste(resized, (paste_x, paste_y), resized)

new_img.save('src/app/icon.png')
new_img.save('src/app/apple-icon.png')
print("P filled with white and background changed successfully!")
