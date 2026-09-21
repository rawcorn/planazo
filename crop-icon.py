from PIL import Image, ImageChops

# Open original uploaded image
img = Image.open('C:/Users/Carolina/.gemini/antigravity/brain/413fcbea-bba9-47d0-a9fc-801236ca1d36/.user_uploaded/media_1789957704987.png').convert("RGBA")

# The background color
bg_color = img.getpixel((0, 0))

# Create an image of the same size with just the background color
bg = Image.new('RGBA', img.size, bg_color)

# Get the difference between the original image and the background
diff = ImageChops.difference(img, bg)

# Convert diff to grayscale
diff_gray = diff.convert("L")

# Get bounding box of the non-zero regions
bbox = diff_gray.getbbox()

if bbox:
    print(f"Original bounding box of the logo: {bbox}")
    # Crop the image to just the logo
    img_cropped = img.crop(bbox)
    
    # We want to paste this cropped image into a 512x512 square.
    new_img = Image.new('RGBA', (512, 512), bg_color)
    
    # Let's scale it to fit within 512x512, leaving a small 20px padding on all sides
    target_width = 472
    target_height = 472
    
    aspect_ratio = img_cropped.width / img_cropped.height
    
    if img_cropped.width > img_cropped.height:
        new_width = target_width
        new_height = int(new_width / aspect_ratio)
    else:
        new_height = target_height
        new_width = int(new_height * aspect_ratio)
        
    resized_img = img_cropped.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Paste it in the center
    paste_x = (512 - new_width) // 2
    paste_y = (512 - new_height) // 2
    
    new_img.paste(resized_img, (paste_x, paste_y))
    
    new_img.save('src/app/icon.png')
    new_img.save('src/app/apple-icon.png')
    print("Image successfully cropped to its content and maximized!")
else:
    print("Could not determine bounding box.")
