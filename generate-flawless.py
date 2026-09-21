from PIL import Image
import numpy as np

# 1. Load the high-res transparent logo
logo = Image.open('public/logo-planazo.png').convert('RGBA')

# Lilac background
lilac_bg = (228, 230, 248, 255)

def create_centered_image(target_size, logo, bg_color):
    img = Image.new('RGBA', target_size, bg_color)
    
    # Calculate center of mass of the ORIGINAL uncropped logo
    arr = np.array(logo)[:,:,3]
    y_indices, x_indices = np.indices(arr.shape)
    total_mass = arr.sum()
    cy_orig = (y_indices * arr).sum() / total_mass
    cx_orig = (x_indices * arr).sum() / total_mass
    
    # Crop to bounding box to remove excess transparency for scaling calculation
    bbox = logo.getbbox()
    cropped_logo = logo.crop(bbox)
    
    # The center of mass in the cropped image
    cx_crop = cx_orig - bbox[0]
    cy_crop = cy_orig - bbox[1]
    
    # 10% padding means logo should take up 80% of the smallest dimension
    max_logo_dim = min(target_size) * 0.8
    aspect = cropped_logo.width / cropped_logo.height
    
    if cropped_logo.width > cropped_logo.height:
        lw = int(max_logo_dim)
        lh = int(lw / aspect)
    else:
        lh = int(max_logo_dim)
        lw = int(lh * aspect)
        
    logo_resized = cropped_logo.resize((lw, lh), Image.Resampling.LANCZOS)
    
    # Scale the center of mass coordinates
    scale_x = lw / cropped_logo.width
    scale_y = lh / cropped_logo.height
    
    cx_resized = cx_crop * scale_x
    cy_resized = cy_crop * scale_y
    
    # We want to place cx_resized exactly at target_size[0]/2
    # and cy_resized exactly at target_size[1]/2
    paste_x = int(target_size[0]/2 - cx_resized)
    paste_y = int(target_size[1]/2 - cy_resized)
    
    # Paste using the logo itself as a mask to preserve transparency
    img.paste(logo_resized, (paste_x, paste_y), logo_resized)
    return img

# Create high-res 512x512 PWA Icon
icon_512 = create_centered_image((512, 512), logo, lilac_bg)
icon_512.save('src/app/icon.png')
icon_512.save('src/app/apple-icon.png')
icon_512.save('public/icon.png')

# Create high-res 1200x630 Open Graph Image
og_1200 = create_centered_image((1200, 630), logo, lilac_bg)
og_1200.save('public/og-image.png')

print("Visually centered high-res images generated successfully!")
