from PIL import Image

# Open the original image
img = Image.open('src/app/icon.png')

# The original image size is 147x100
# Create a new 512x512 image with a background color matching the image's background (or white/transparent)
# Let's get the color of the top-left pixel to use as background
bg_color = img.getpixel((0, 0))

new_img = Image.new('RGBA', (512, 512), bg_color)

# We should resize the image so it takes up more space, say 300px wide
aspect_ratio = img.width / img.height
new_width = 384
new_height = int(new_width / aspect_ratio)

resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

# Calculate position to paste the resized image in the center
paste_x = (512 - new_width) // 2
paste_y = (512 - new_height) // 2

new_img.paste(resized_img, (paste_x, paste_y))

# Save the new image
new_img.save('src/app/icon.png')
new_img.save('src/app/apple-icon.png')

print("Images padded and resized to 512x512 successfully.")
