from PIL import Image

# Open the original image
img = Image.open('C:/Users/Carolina/.gemini/antigravity/brain/413fcbea-bba9-47d0-a9fc-801236ca1d36/.user_uploaded/media_1789957704987.png')

# Let's get the color of the top-left pixel to use as background
bg_color = img.getpixel((0, 0))

new_img = Image.new('RGBA', (512, 512), bg_color)

# We want the image to occupy the maximum space possible without clipping.
# Let's use 500px as the new width (leaving just 6px of safe margin on each side)
aspect_ratio = img.width / img.height
new_width = 500
new_height = int(new_width / aspect_ratio)

resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

# Calculate position to paste the resized image in the center
paste_x = (512 - new_width) // 2
paste_y = (512 - new_height) // 2

new_img.paste(resized_img, (paste_x, paste_y))

# Save the new image
new_img.save('src/app/icon.png')
new_img.save('src/app/apple-icon.png')

print("Images scaled to maximum size and padded to 512x512 successfully.")
