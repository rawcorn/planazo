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

def create_geometrically_centered_image(target_size, cropped_logo, bg_color):
    img = Image.new('RGBA', target_size, bg_color)
    max_logo_dim = min(target_size) * 0.8
    scale = max_logo_dim / max(cropped_logo.width, cropped_logo.height)
    lw = int(cropped_logo.width * scale)
    lh = int(cropped_logo.height * scale)
    logo_resized = cropped_logo.resize((lw, lh), Image.Resampling.LANCZOS)
    paste_x = int((target_size[0] - lw) / 2)
    paste_y = int((target_size[1] - lh) / 2)
    img.paste(logo_resized, (paste_x, paste_y), logo_resized)
    return img

icon_512 = create_geometrically_centered_image((512, 512), cropped_logo, lilac_bg)
icon_512.save('src/app/icon.png')
icon_512.save('src/app/apple-icon.png')
icon_512.save('public/icon.png')

og_1200 = create_geometrically_centered_image((1200, 630), cropped_logo, lilac_bg)
og_1200.save('public/og-image.png')

print("All geometrically centered tight high-res images generated successfully!")
