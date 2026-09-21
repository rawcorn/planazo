from PIL import Image

img = Image.open('C:/Users/Carolina/.gemini/antigravity/brain/413fcbea-bba9-47d0-a9fc-801236ca1d36/.user_uploaded/media_1789957704987.png').convert("RGBA")
w, h = img.size

bg_color = img.getpixel((0,0))

def color_dist(c1, c2):
    return sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])) ** 0.5

min_x, min_y = w, h
max_x, max_y = 0, 0

threshold = 20 # distance threshold

for y in range(h):
    for x in range(w):
        if color_dist(img.getpixel((x, y)), bg_color) > threshold:
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y

if min_x > max_x:
    print("Could not find logo")
else:
    print(f"Content bounding box: {min_x}, {min_y}, {max_x}, {max_y}")
    
    # Let's crop it tightly to this box
    cropped = img.crop((min_x, min_y, max_x, max_y))
    
    new_img = Image.new('RGBA', (512, 512), bg_color)
    
    # We want it to have about 10% padding on all sides.
    # 10% of 512 is 51. 512 - 51*2 = 410
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
    
    new_img.paste(resized, (paste_x, paste_y))
    
    new_img.save('src/app/icon.png')
    new_img.save('src/app/apple-icon.png')
    print("Cropped and scaled!")
