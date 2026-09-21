from PIL import Image

img = Image.open('C:/Users/Carolina/.gemini/antigravity/brain/413fcbea-bba9-47d0-a9fc-801236ca1d36/.user_uploaded/media_1789957704987.png').convert("RGBA")
w, h = img.size

# Check some pixels
print("Checking colors:")
print("Background:", img.getpixel((0,0)))
print("Inside P (approx center):", img.getpixel((w//2, h//2)))

colors = {}
for y in range(6, 90):
    for x in range(36, 112):
        c = img.getpixel((x, y))
        r, g, b, a = c
        if g > b + 5 and r > 190: # Inside P
            colors["Inside P"] = colors.get("Inside P", 0) + 1
        elif g > b: # Bubble
            colors["Bubble"] = colors.get("Bubble", 0) + 1
        else: # Background
            colors["Background"] = colors.get("Background", 0) + 1

print("Classification counts:", colors)
