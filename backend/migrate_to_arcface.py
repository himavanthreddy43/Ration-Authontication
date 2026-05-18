import os
import sys
import json
import logging

# ============================================
# Add Current Directory to Python Path
# ============================================

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# ============================================
# Configure Logging
# ============================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# ============================================
# Import Dependencies
# ============================================

from deepface import DeepFace
from app import create_app
from models import db, FaceData

# ============================================
# Create Flask App (uses correct DB config)
# ============================================

app = create_app()

# ============================================
# Migration Function
# ============================================

def migrate():

    with app.app_context():

        faces = FaceData.query.all()

        logger.info(f"Found {len(faces)} faces to migrate.")

        success_count = 0
        fail_count = 0
        deleted_count = 0

        for face in faces:

            image_path = face.face_image_path

            logger.info(f"Processing face_id={face.face_id}")

            # ============================================
            # Check image exists
            # ============================================

            if not image_path or not os.path.exists(image_path):

                logger.error(f"Image not found: {image_path}")
                fail_count += 1
                continue

            try:

                objs = None

                # ============================================
                # Strategy 1 - OpenCV detector
                # ============================================

                try:
                    logger.info("Trying OpenCV detector...")

                    objs = DeepFace.represent(
                        img_path=image_path,
                        model_name="ArcFace",
                        detector_backend="opencv",
                        enforce_detection=True,
                        align=True
                    )

                except Exception as e:
                    logger.warning(f"OpenCV failed: {e}")

                # ============================================
                # Strategy 2 - MTCNN fallback
                # ============================================

                if not objs:

                    try:
                        logger.info("Trying MTCNN detector...")

                        objs = DeepFace.represent(
                            img_path=image_path,
                            model_name="ArcFace",
                            detector_backend="mtcnn",
                            enforce_detection=True,
                            align=True
                        )

                    except Exception as e:
                        logger.warning(f"MTCNN failed: {e}")

                # ============================================
                # Process Embedding
                # ============================================

                if objs and len(objs) > 0:

                    embedding = objs[0].get("embedding")

                    if embedding and len(embedding) > 0:

                        face.face_embedding_vector = json.dumps(embedding)
                        success_count += 1

                        logger.info(
                            f"Successfully migrated face_id={face.face_id}"
                        )

                    else:
                        logger.error(
                            f"Empty embedding for face_id={face.face_id}"
                        )
                        db.session.delete(face)
                        deleted_count += 1

                else:
                    logger.error(
                        f"No face detected for face_id={face.face_id}"
                    )
                    db.session.delete(face)
                    deleted_count += 1

            except Exception as e:
                logger.error(
                    f"Unexpected error for face_id={face.face_id}: {e}"
                )
                fail_count += 1

        # ============================================
        # Final Commit
        # ============================================

        try:
            db.session.commit()
            logger.info("Database commit successful.")

        except Exception as e:
            db.session.rollback()
            logger.error(f"Database commit failed: {e}")

        # ============================================
        # Final Summary
        # ============================================

        logger.info("=" * 50)
        logger.info(
            f"Migration Completed\n"
            f"  Success: {success_count}\n"
            f"  Deleted: {deleted_count}\n"
            f"  Failed: {fail_count}"
        )
        logger.info("=" * 50)

# ============================================
# Main
# ============================================

if __name__ == '__main__':
    migrate()
