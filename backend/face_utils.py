import logging
import cv2
import os
import tempfile
import numpy as np
from deepface import DeepFace

logger = logging.getLogger(__name__)

# ============================================
# IMAGE ENHANCEMENT
# ============================================

def enhance_image(image_path: str):
    """
    Enhance brightness for low-light images.
    Returns temporary enhanced image path.
    """

    temp_path = None

    try:
        img = cv2.imread(image_path)

        if img is None:
            logger.error(f"Could not read image: {image_path}")
            return None

        # Convert to HSV
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        h, s, v = cv2.split(hsv)

        # Increase brightness safely (scalar, not array)
        v = cv2.add(v, 40)

        final_hsv = cv2.merge((h, s, v))

        enhanced_img = cv2.cvtColor(final_hsv, cv2.COLOR_HSV2BGR)

        # Create temp file
        fd, temp_path = tempfile.mkstemp(suffix=".jpg")

        os.close(fd)

        cv2.imwrite(temp_path, enhanced_img)

        return temp_path

    except Exception as e:
        logger.error(f"Image enhancement failed: {e}")

        # Cleanup if partially created
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

        return None


# ============================================
# FACE EMBEDDING EXTRACTION
# ============================================

def extract_embedding(image_path: str):
    """
    Extract face embedding using multiple fallback strategies.
    Passes file paths (not numpy arrays) to DeepFace for reliable detection.
    """

    logger.info(f"Starting face extraction for: {image_path}")

    enhanced_path = None

    try:
        # Validate image is readable
        img = cv2.imread(image_path)

        if img is None:
            logger.error(f"Failed to read image: {image_path}")
            return None

        logger.info(f"Image loaded successfully. Shape: {img.shape}")

        # ============================================
        # STRATEGY 1 - OpenCV detector
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

            if objs and len(objs) > 0:
                logger.info("Face detected using OpenCV.")
                return objs[0]["embedding"]

        except Exception as e:
            logger.warning(f"OpenCV detection failed: {e}")

        # ============================================
        # STRATEGY 2 - MTCNN detector
        # ============================================

        try:
            logger.info("Trying MTCNN detector...")

            objs = DeepFace.represent(
                img_path=image_path,
                model_name="ArcFace",
                detector_backend="mtcnn",
                enforce_detection=True,
                align=True
            )

            if objs and len(objs) > 0:
                logger.info("Face detected using MTCNN.")
                return objs[0]["embedding"]

        except Exception as e:
            logger.warning(f"MTCNN detection failed: {e}")

        # ============================================
        # STRATEGY 3 - Enhanced image retry
        # ============================================

        try:
            logger.info("Trying enhanced image detection...")

            enhanced_path = enhance_image(image_path)

            if enhanced_path:
                objs = DeepFace.represent(
                    img_path=enhanced_path,
                    model_name="ArcFace",
                    detector_backend="opencv",
                    enforce_detection=True,
                    align=True
                )

                if objs and len(objs) > 0:
                    logger.info("Enhanced image detection success.")
                    return objs[0]["embedding"]

        except Exception as e:
            logger.warning(f"Enhanced detection failed: {e}")

        # ============================================
        # STRATEGY 4 - Last resort (skip detector)
        # ============================================

        try:
            logger.info("Trying skip detector fallback...")

            objs = DeepFace.represent(
                img_path=image_path,
                model_name="ArcFace",
                detector_backend="skip",
                enforce_detection=False,
                align=False
            )

            if objs and len(objs) > 0:
                logger.warning(
                    "Embedding extracted with enforce_detection=False"
                )
                return objs[0]["embedding"]

        except Exception as e:
            logger.error(f"Final fallback failed: {e}")

        logger.error("All extraction strategies failed.")
        return None

    except Exception as e:
        logger.error(f"Unexpected extraction error: {e}")
        return None

    finally:
        # Cleanup temp enhanced image
        if enhanced_path and os.path.exists(enhanced_path):
            try:
                os.remove(enhanced_path)
            except Exception:
                pass


# ============================================
# EMBEDDING COMPARISON
# ============================================

def compare_embeddings(emb1, emb2, threshold: float = 0.50):
    """
    Compare two embeddings using cosine distance.

    Returns:
        (is_match, distance)
    """

    try:
        a = np.array(emb1, dtype=np.float32)
        b = np.array(emb2, dtype=np.float32)

        # Shape validation
        if a.shape != b.shape:
            logger.warning(
                f"Embedding shape mismatch: {a.shape} vs {b.shape}"
            )
            return False, 1.0

        # Avoid divide-by-zero
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)

        if norm_a == 0 or norm_b == 0:
            logger.warning("Zero vector embedding detected")
            return False, 1.0

        # Cosine distance
        cosine_dist = 1 - (np.dot(a, b) / (norm_a * norm_b))

        logger.info(
            f"Cosine Distance: {cosine_dist:.4f} (Threshold: {threshold})"
        )

        return bool(cosine_dist < threshold), float(cosine_dist)

    except Exception as e:
        logger.error(f"Embedding comparison failed: {e}")
        return False, 1.0
