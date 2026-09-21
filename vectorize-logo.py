import cv2
import numpy as np
from PIL import Image

img_path = 'C:/Users/Carolina/.gemini/antigravity/brain/413fcbea-bba9-47d0-a9fc-801236ca1d36/.user_uploaded/media_1789957704987.png'
pil_img = Image.open(img_path).convert('RGBA')
pil_cropped = pil_img.crop((36, 6, 112, 90))
cv_img = cv2.cvtColor(np.array(pil_cropped), cv2.COLOR_RGBA2BGRA)

scale = 20
h, w = cv_img.shape[:2]
upscaled = cv2.resize(cv_img, (w*scale, h*scale), interpolation=cv2.INTER_CUBIC)
blurred = cv2.GaussianBlur(upscaled, (scale*3|1, scale*3|1), 0)

bg_color = pil_img.getpixel((0,0))
bg_bgr = np.array([bg_color[2], bg_color[1], bg_color[0]])
diff = np.sqrt(np.sum((blurred[:, :, :3].astype(np.float32) - bg_bgr)**2, axis=2))

logo_mask = (diff > 30).astype(np.uint8) * 255
_, logo_mask = cv2.threshold(logo_mask, 127, 255, cv2.THRESH_BINARY)

b, g, r, a = cv2.split(blurred)
inner_mask_cond = (g.astype(np.int32) > b.astype(np.int32) + 2) & (r > 190)
inner_mask = inner_mask_cond.astype(np.uint8) * 255

kernel = np.ones((scale, scale), np.uint8)
logo_mask = cv2.morphologyEx(logo_mask, cv2.MORPH_CLOSE, kernel)
inner_mask = cv2.morphologyEx(inner_mask, cv2.MORPH_CLOSE, kernel)

clean = np.zeros((h*scale, w*scale, 4), dtype=np.uint8)
bubble_color = (201, 226, 164, 255) # BGR for (164, 226, 201)
inner_color = (255, 255, 255, 255)

# FIND ONLY THE LARGEST CONTOUR FOR BUBBLE
contours_logo, _ = cv2.findContours(logo_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
if contours_logo:
    largest_bubble = max(contours_logo, key=cv2.contourArea)
    # Smooth the contour slightly
    epsilon = 0.005 * cv2.arcLength(largest_bubble, True)
    approx_bubble = cv2.approxPolyDP(largest_bubble, epsilon, True)
    cv2.drawContours(clean, [approx_bubble], -1, bubble_color, -1)

# FIND ONLY THE LARGEST CONTOUR FOR INNER P
contours_inner, _ = cv2.findContours(inner_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
if contours_inner:
    largest_inner = max(contours_inner, key=cv2.contourArea)
    epsilon = 0.005 * cv2.arcLength(largest_inner, True)
    approx_inner = cv2.approxPolyDP(largest_inner, epsilon, True)
    cv2.drawContours(clean, [approx_inner], -1, inner_color, -1)

clean_aa = cv2.resize(clean, (w*scale//2, h*scale//2), interpolation=cv2.INTER_AREA)
final_logo = Image.fromarray(cv2.cvtColor(clean_aa, cv2.COLOR_BGRA2RGBA))

lilac_bg = (228, 230, 248, 255)

def paste_centered(target_size, logo, bg_color):
    img = Image.new('RGBA', target_size, bg_color)
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

icon_512 = paste_centered((512, 512), final_logo, lilac_bg)
icon_512.save('src/app/icon.png')
icon_512.save('src/app/apple-icon.png')

og_1200 = paste_centered((1200, 630), final_logo, lilac_bg)
og_1200.save('src/app/opengraph-image.png')

print("Perfect noise-free vector-like high-resolution images generated successfully!")
