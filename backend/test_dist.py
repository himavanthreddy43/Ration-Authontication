import sys
import os
import json
import numpy as np

# Add the directory to python path if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, FaceData
import face_utils

app = create_app()

with app.app_context():
    faces = FaceData.query.all()
    print(f"Total faces in DB: {len(faces)}")
    
    if len(faces) >= 2:
        for i in range(len(faces)):
            for j in range(i+1, len(faces)):
                emb1 = json.loads(faces[i].face_embedding_vector)
                emb2 = json.loads(faces[j].face_embedding_vector)
                dist_l2 = np.linalg.norm(np.array(emb1) - np.array(emb2))
                
                # Cosine distance
                a = np.array(emb1)
                b = np.array(emb2)
                cosine_dist = 1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
                
                print(f"Face {faces[i].face_id} vs Face {faces[j].face_id}")
                print(f"  L2 Distance: {dist_l2}")
                print(f"  Cosine Distance: {cosine_dist}")
