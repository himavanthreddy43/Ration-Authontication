from backend.app import create_app
from backend.models import db, FaceData
import json
import numpy as np

app = create_app()
with app.app_context():
    faces = FaceData.query.all()
    if len(faces) >= 2:
        emb1 = json.loads(faces[0].face_embedding_vector)
        emb2 = json.loads(faces[1].face_embedding_vector)
        dist = np.linalg.norm(np.array(emb1) - np.array(emb2))
        print(f"Distance between face 1 and 2: {dist}")
        for f in faces:
            print(f"Face {f.face_id} member {f.member_id} family {f.family_id}")
    else:
        print(f"Only {len(faces)} faces in DB.")
