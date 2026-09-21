from PIL import Image

# 1. Load the high-res transparent logo
logo = Image.open('public/logo-planazo.png').convert('RGBA')

# 2. Crop to bounding box
bbox = logo.getbbox()
if bbox:
    logo = logo.crop(bbox)

# Lilac background
lilac_bg = (228, 230, 248, 255)

def create_image(target_size, logo, bg_color):
    img = Image.new('RGBA', target_size, bg_color)
    
    # 10% padding means logo should take up 80% of the smallest dimension
    max_logo_dim = min(target_size) * 0.8
    aspect = logo.width / logo.height
    
    if logo.width > logo.height:
        lw = int(max_logo_dim)
        lh = int(lw / aspect)
    else:
        lh = int(max_logo_dim)
        lw = int(lh * aspect)
        
    logo_resized = logo.resize((lw, lh), Image.Resampling.LANCZOS)
    
    px = (target_size[0] - lw) // 2
    py = (target_size[1] - lh) // 2
    
    # Paste using the logo itself as a mask to preserve transparency
    img.paste(logo_resized, (px, py), logo_resized)
    return img

# 3. Create high-res 512x512 PWA Icon
icon_512 = create_image((512, 512), logo, lilac_bg)
icon_512.save('src/app/icon.png')
icon_512.save('src/app/apple-icon.png')
icon_512.save('public/icon.png')

# 4. Create high-res 1200x630 Open Graph Image
# For Open Graph, we want the logo to be large but centered
og_1200 = create_image((1200, 630), logo, lilac_bg)
# Save it to PUBLIC to avoid Next.js adding query hashes
og_1200.save('public/og-image.png')

print("Flawless high-res images generated successfully!")
