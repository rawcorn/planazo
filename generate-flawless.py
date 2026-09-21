from PIL import Image
import numpy as np

# 1. Load the high-res transparent logo
logo = Image.open('public/logo-planazo.png').convert('RGBA')
arr = np.array(logo)

# Find true bounding box where alpha > 10 (ignores invisible noise)
alpha = arr[:,:,3]
rows = np.any(alpha > 10, axis=1)
cols = np.any(alpha > 10, axis=0)
ymin, ymax = np.where(rows)[0][[0, -1]]
xmin, xmax = np.where(cols)[0][[0, -1]]

# Crop to tight bounding box
cropped_logo = logo.crop((xmin, ymin, xmax + 1, ymax + 1))
cropped_alpha = alpha[ymin:ymax+1, xmin:xmax+1]

# Calculate center of mass of the TIGHT cropped area
y_indices, x_indices = np.indices(cropped_alpha.shape)
total_mass = cropped_alpha.sum()
cy_crop = (y_indices * cropped_alpha).sum() / total_mass
cx_crop = (x_indices * cropped_alpha).sum() / total_mass

# Lilac background
lilac_bg = (228, 230, 248, 255)

def create_centered_image(target_size, cropped_logo, cx_crop, cy_crop, bg_color):
    img = Image.new('RGBA', target_size, bg_color)
    
    # 10% padding means longest dimension is 80%
    max_logo_dim = min(target_size) * 0.8
    
    # Calculate scale factor
    scale = max_logo_dim / max(cropped_logo.width, cropped_logo.height)
    
    lw = int(cropped_logo.width * scale)
    lh = int(cropped_logo.height * scale)
        
    logo_resized = cropped_logo.resize((lw, lh), Image.Resampling.LANCZOS)
    
    # Scale the center of mass coordinates
    cx_resized = cx_crop * scale
    cy_resized = cy_crop * scale
    
    # Place center of mass exactly at canvas center
    paste_x = int(target_size[0]/2 - cx_resized)
    paste_y = int(target_size[1]/2 - cy_resized)
    
    # Paste using the logo itself as a mask
    img.paste(logo_resized, (paste_x, paste_y), logo_resized)
    return img

# Create high-res 512x512 PWA Icon
icon_512 = create_centered_image((512, 512), cropped_logo, cx_crop, cy_crop, lilac_bg)
icon_512.save('src/app/icon.png')
icon_512.save('src/app/apple-icon.png')
icon_512.save('public/icon.png')

# Create high-res 1200x630 Open Graph Image
# For OG, we want it to fit nicely within the height (with padding)
og_1200 = create_centered_image((1200, 630), cropped_logo, cx_crop, cy_crop, lilac_bg)
og_1200.save('public/og-image.png')

print("Perfectly sized and centered high-res images generated successfully!")
