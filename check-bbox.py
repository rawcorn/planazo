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

print("Tight BBOX:", (xmin, ymin, xmax, ymax))

# Calculate center of mass of the TIGHT cropped area
cropped_alpha = alpha[ymin:ymax+1, xmin:xmax+1]
y_indices, x_indices = np.indices(cropped_alpha.shape)
total_mass = cropped_alpha.sum()
cy = (y_indices * cropped_alpha).sum() / total_mass
cx = (x_indices * cropped_alpha).sum() / total_mass

print("Center of mass inside cropped area:", cx, cy)
print("Center of geometry inside cropped area:", (xmax-xmin)/2, (ymax-ymin)/2)
