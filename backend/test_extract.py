import sys
import os
import cv2
import numpy as np

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from face_utils import extract_embedding

# Create dummy image
img = np.zeros((300, 300, 3), dtype=np.uint8)

# Draw fake face
cv2.circle(img, (150, 150), 50, (255, 200, 200), -1)

# Save image
cv2.imwrite("test_dummy.jpg", img)

try:
    print("Testing extraction...")

    emb = extract_embedding("test_dummy.jpg")

    if emb is not None:
        print("Extraction Success")
        print(f"Embedding length: {len(emb)}")
    else:
        print("No face detected")

except Exception as e:
    print(f"Error: {e}")
