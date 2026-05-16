import cv2
import numpy as np
from face_utils import extract_embedding

# Create a dummy image with a random face-like shape
img = np.zeros((300, 300, 3), dtype=np.uint8)
cv2.circle(img, (150, 150), 50, (255, 200, 200), -1)
cv2.imwrite("test_dummy.jpg", img)

try:
    print("Testing extraction...")
    emb = extract_embedding("test_dummy.jpg")
    print(f"Extraction result: {'Success' if emb else 'Failed'}")
except Exception as e:
    print(f"Error: {e}")
