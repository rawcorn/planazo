import cv2
import numpy as np
from PIL import Image

# 1. Load the original small logo
img_path = 'C:/Users/Carolina/.gemini/antigravity/brain/413fcbea-bba9-47d0-a9fc-801236ca1d36/.user_uploaded/media_1789957704987.png'
pil_img = Image.open(img_path).convert('RGBA')

# Crop it to the logo as before (36, 6, 112, 90)
pil_cropped = pil_img.crop((36, 6, 112, 90))

# Convert to OpenCV format (BGRA)
cv_img = cv2.cvtColor(np.array(pil_cropped), cv2.COLOR_RGBA2BGRA)

# 2. Upscale it massively (e.g., 20x) using cubic interpolation to keep it smooth
scale = 20
h, w = cv_img.shape[:2]
upscaled = cv2.resize(cv_img, (w*scale, h*scale), interpolation=cv2.INTER_CUBIC)

# 3. We will do a slight Gaussian blur to smooth out any pixelation from the cubic scale
blurred = cv2.GaussianBlur(upscaled, (scale*3|1, scale*3|1), 0)

# We have two main color areas:
# The background (originally grayish), the bubble (mint green), and the inner P (light mint/white)
# Let's extract them by converting to HSV and masking, or just by distance to the background color.

bg_color = pil_img.getpixel((0,0)) # (240, 238, 251)
bg_bgr = np.array([bg_color[2], bg_color[1], bg_color[0]])

# Calculate distance from background
diff = np.sqrt(np.sum((blurred[:, :, :3].astype(np.float32) - bg_bgr)**2, axis=2))

# Mask 1: The entire logo (Bubble + Inner P)
# Everything that is far from background
logo_mask = (diff > 30).astype(np.uint8) * 255

# To make the edges perfectly sharp, we threshold it
_, logo_mask = cv2.threshold(logo_mask, 127, 255, cv2.THRESH_BINARY)

# Now we need to isolate the Inner P.
# Earlier we found the inner P has G > B + 2 and R > 190.
b, g, r, a = cv2.split(blurred)

# Create mask for Inner P
# G > B + 2 and R > 190
inner_mask_cond = (g.astype(np.int32) > b.astype(np.int32) + 2) & (r > 190)
inner_mask = inner_mask_cond.astype(np.uint8) * 255

# Clean up masks with morphology
kernel = np.ones((scale, scale), np.uint8)
logo_mask = cv2.morphologyEx(logo_mask, cv2.MORPH_CLOSE, kernel)
inner_mask = cv2.morphologyEx(inner_mask, cv2.MORPH_CLOSE, kernel)
inner_mask = cv2.morphologyEx(inner_mask, cv2.MORPH_OPEN, kernel)

# 4. Draw the sharp result!
# We'll create a completely clean canvas of size (w*scale, h*scale) with transparent background
clean = np.zeros((h*scale, w*scale, 4), dtype=np.uint8)

# The bubble color: we'll use the prominent mint green we found earlier: (164, 226, 201) -> BGR: (201, 226, 164)
bubble_color = (201, 226, 164, 255)
# The inner P color: Pure White
inner_color = (255, 255, 255, 255)

# Find contours for the outer bubble and fill it
contours_logo, _ = cv2.findContours(logo_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cv2.drawContours(clean, contours_logo, -1, bubble_color, -1)

# Find contours for the inner P and fill it with white
contours_inner, _ = cv2.findContours(inner_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cv2.drawContours(clean, contours_inner, -1, inner_color, -1)

# Apply anti-aliasing to the clean image edges
# To do this simply, we can scale down by 2x using area interpolation
clean_aa = cv2.resize(clean, (w*scale//2, h*scale//2), interpolation=cv2.INTER_AREA)

# Convert back to PIL
final_logo = Image.fromarray(cv2.cvtColor(clean_aa, cv2.COLOR_BGRA2RGBA))

# ----------------------------------------------------
# Now generate the icon.png (512x512) and opengraph-image.png (1200x630) using this perfect vector-like logo!
# ----------------------------------------------------

lilac_bg = (228, 230, 248, 255)

def paste_centered(target_size, logo, bg_color):
    img = Image.new('RGBA', target_size, bg_color)
    
    # Scale logo to fit leaving 10% padding
    # For a square, target size for logo is target_size[0] * 0.8
    # For a rectangle, target size for logo is min(w, h) * 0.8
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
    
    img.paste(logo_resized, (px, py), logo_resized)
    return img

# 1. 512x512 icons
icon_512 = paste_centered((512, 512), final_logo, lilac_bg)
icon_512.save('src/app/icon.png')
icon_512.save('src/app/apple-icon.png')

# 2. 1200x630 Open Graph
og_1200 = paste_centered((1200, 630), final_logo, lilac_bg)
og_1200.save('src/app/opengraph-image.png')

print("Perfect vector-like high-resolution images generated successfully!")
