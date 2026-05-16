import os
import sys
import json
import cv2
import logging
from flask import Flask

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from deepface import DeepFace

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from models import db, FaceData

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ration.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def migrate():
    with app.app_context():
        faces = FaceData.query.all()
        logger.info(f"Found {len(faces)} faces to re-migrate.")
        
        success_count = 0
        fail_count = 0
        deleted_count = 0
        
        for face in faces:
            image_path = face.face_image_path
            logger.info(f"Processing face_id {face.face_id} at {image_path}")
            
            if not os.path.exists(image_path):
                logger.error(f"Image not found at {image_path}")
                fail_count += 1
                continue
                
            try:
                img = cv2.imread(image_path)
                if img is None:
                    logger.error(f"Failed to read image at {image_path}")
                    fail_count += 1
                    continue
                    
                rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                
                objs = None
                try:
                    objs = DeepFace.represent(img_path=rgb_img, model_name="ArcFace", detector_backend="opencv", enforce_detection=True, align=True)
                except ValueError:
                    logger.info("OpenCV detection failed, trying MTCNN.")
                    try:
                        objs = DeepFace.represent(img_path=rgb_img, model_name="ArcFace", detector_backend="mtcnn", enforce_detection=True, align=True)
                    except ValueError:
                        pass
                
                if objs and len(objs) > 0:
                    embedding = objs[0]['embedding']
                    face.face_embedding_vector = json.dumps(embedding)
                    db.session.commit()
                    success_count += 1
                    logger.info(f"Successfully migrated face_id {face.face_id}")
                else:
                    logger.error(f"NO FACE DETECTED for face_id {face.face_id}. Deleting garbage face data.")
                    db.session.delete(face)
                    db.session.commit()
                    deleted_count += 1
            except Exception as e:
                logger.error(f"Error processing face_id {face.face_id}: {e}")
                fail_count += 1
                
        logger.info(f"Migration completed. Success: {success_count}, Deleted (Garbage): {deleted_count}, Failed: {fail_count}")

if __name__ == '__main__':
    migrate()
