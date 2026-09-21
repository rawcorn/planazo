from PIL import Image
import numpy as np

logo = Image.open('public/logo-planazo.png').convert('RGBA')
arr = np.array(logo)

# Find true bounding box where alpha > 10
alpha = arr[:,:,3]
rows = np.any(alpha > 10, axis=1)
cols = np.any(alpha > 10, axis=0)
ymin, ymax = np.where(rows)[0][[0, -1]]
xmin, xmax = np.where(cols)[0][[0, -1]]

cropped_logo = logo.crop((xmin, ymin, xmax + 1, ymax + 1))
lilac_bg = (228, 230, 248, 255)

def create_geometrically_centered_image(target_size, cropped_logo, bg_color, exact_logo_height=None):
    img = Image.new('RGBA', target_size, bg_color)
    
    if exact_logo_height:
        scale = exact_logo_height / cropped_logo.height
    else:
        max_logo_dim = min(target_size) * 0.8
        scale = max_logo_dim / max(cropped_logo.width, cropped_logo.height)
        
    lw = int(cropped_logo.width * scale)
    lh = int(cropped_logo.height * scale)
    logo_resized = cropped_logo.resize((lw, lh), Image.Resampling.LANCZOS)
    paste_x = int((target_size[0] - lw) / 2)
    paste_y = int((target_size[1] - lh) / 2)
    img.paste(logo_resized, (paste_x, paste_y), logo_resized)
    return img

# Create high-res 512x512 PWA Icon (Keep it at 80% size, which they confirmed looks perfect)
icon_512 = create_geometrically_centered_image((512, 512), cropped_logo, lilac_bg)
icon_512.save('src/app/icon.png')
icon_512.save('src/app/apple-icon.png')
icon_512.save('public/icon.png')

# Create high-res 1200x630 Open Graph Image
# Use exact_logo_height = 373 to match the sharpness and size they loved in 5b34117!
og_1200 = create_geometrically_centered_image((1200, 630), cropped_logo, lilac_bg, exact_logo_height=373)
og_1200.save('public/og-whatsapp.png')

print("Perfectly sized and centered images generated successfully!")
