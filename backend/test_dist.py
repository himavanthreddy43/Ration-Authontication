import sys
import os
import json
import numpy as np

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import FaceData

app = create_app()

with app.app_context():

    faces = FaceData.query.all()

    print(f"Total faces in DB: {len(faces)}")

    if len(faces) < 2:
        print("Need at least 2 faces to compare")

    else:
        for i in range(len(faces)):
            for j in range(i + 1, len(faces)):

                emb1 = np.array(
                    json.loads(faces[i].face_embedding_vector),
                    dtype=np.float32
                )

                emb2 = np.array(
                    json.loads(faces[j].face_embedding_vector),
                    dtype=np.float32
                )

                # L2 Distance
                dist_l2 = np.linalg.norm(emb1 - emb2)

                # Cosine Distance
                cosine_dist = 1 - (
                    np.dot(emb1, emb2)
                    / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
                )

                print(f"\nFace {faces[i].face_id} vs Face {faces[j].face_id}")

                print(f"L2 Distance: {dist_l2:.4f}")

                print(f"Cosine Distance: {cosine_dist:.4f}")
