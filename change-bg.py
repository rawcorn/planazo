from PIL import Image

img = Image.open('C:/Users/Carolina/.gemini/antigravity/brain/413fcbea-bba9-47d0-a9fc-801236ca1d36/.user_uploaded/media_1789957704987.png').convert("RGBA")
w, h = img.size

old_bg = img.getpixel((0,0))

def color_dist(c1, c2):
    return sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])) ** 0.5

# Step 1: Crop exactly as before
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

if min_x <= max_x:
    cropped = img.crop((min_x, min_y, max_x, max_y))
    
    # Step 2: Make background transparent using distance from old_bg
    # Create new image data
    data = cropped.getdata()
    new_data = []
    for item in data:
        dist = color_dist(item, old_bg)
        if dist < 15:
            # Fully transparent
            new_data.append((item[0], item[1], item[2], 0))
        elif dist < 50:
            # Partial transparency for smooth edges
            alpha = int((dist - 15) / (50 - 15) * 255)
            new_data.append((item[0], item[1], item[2], alpha))
        else:
            new_data.append(item)
            
    cropped.putdata(new_data)
    
    # Target color: #E4E6F8 -> (228, 230, 248)
    new_bg_color = (228, 230, 248, 255)
    new_img = Image.new('RGBA', (512, 512), new_bg_color)
    
    # Same size and padding logic
    target_size = 410
    aspect_ratio = cropped.width / cropped.height
    
    if cropped.width > cropped.height:
        new_width = target_size
        new_height = int(new_width / aspect_ratio)
    else:
        new_height = target_size
        new_width = int(new_height * aspect_ratio)
        
    resized = cropped.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    paste_x = (512 - new_width) // 2
    paste_y = (512 - new_height) // 2
    
    # We must paste using resized as mask so alpha blends properly
    new_img.paste(resized, (paste_x, paste_y), resized)
    
    new_img.save('src/app/icon.png')
    new_img.save('src/app/apple-icon.png')
    print("Background color changed successfully!")
else:
    print("Failed")
