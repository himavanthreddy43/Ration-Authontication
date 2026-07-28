import logging
import cv2
import os
import tempfile
import numpy as np
import gc

try:
    import psutil
except ImportError:
    psutil = None

logger = logging.getLogger(__name__)

def log_memory(step_name):
    if psutil:
        try:
            process = psutil.Process(os.getpid())
            mem_info = process.memory_info()
            rss_mb = mem_info.rss / (1024 * 1024)
            logger.info(f"MEMORY [{step_name}]: {rss_mb:.2f} MB")
        except Exception:
            pass

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
# EMBEDDING COMPARISON
# ============================================

def compare_embeddings(emb1, emb2, threshold: float = 0.58):
    """
    Compare two embeddings using cosine distance.

    Returns:
        (is_match, distance)
    """

    try:
        a = np.array(emb1, dtype=np.float32)
        b = np.array(emb2, dtype=np.float32)

        # Handle shape mismatch (e.g., 128-dim Facenet vs 512-dim ArcFace)
        if a.shape != b.shape:
            min_len = min(a.shape[0], b.shape[0])
            a = a[:min_len]
            b = b[:min_len]

        # Avoid divide-by-zero
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)

        if norm_a == 0 or norm_b == 0:
            logger.warning("Zero vector embedding detected")
            return False, 1.0

        # Cosine distance
        cosine_dist = float(1.0 - (np.dot(a, b) / (norm_a * norm_b)))

        logger.info(
            f"Cosine Distance: {cosine_dist:.4f} (Threshold: {threshold})"
        )

        return bool(cosine_dist < threshold), cosine_dist

    except Exception as e:
        logger.error(f"Embedding comparison failed: {e}")
        return False, 1.0

def extract_embedding(image_path: str):
    """
    Extract face embedding with lazy loading of DeepFace.
    """
    logger.info(f"Starting face extraction for: {image_path}")
    log_memory("Before Image Decoding")

    try:
        img = cv2.imread(image_path)
        log_memory("After Image Decoding")

        if img is None:
            raise ValueError(f"Failed to read image: {image_path}")

        # Downscale image to max 640x640 to prevent OOM crashes
        max_dim = 640
        h, w = img.shape[:2]
        if h > max_dim or w > max_dim:
            scale = max_dim / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            cv2.imwrite(image_path, img, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            logger.info(f"Image resized to prevent OOM. New Shape: {img.shape}")
            
        log_memory("After Image Resizing")
        logger.info("Trying OpenCV detector...")
        log_memory("Before DeepFace.represent")

        # Lazy load DeepFace
        from deepface import DeepFace

        gc.collect()
        objs = None
        try:
            objs = DeepFace.represent(
                img_path=image_path,
                model_name="Facenet",
                detector_backend="opencv",
                enforce_detection=True,
                align=True
            )
        except Exception as e:
            logger.warning(f"OpenCV enforce_detection failed: {e}. Trying enforce_detection=False...")
            try:
                objs = DeepFace.represent(
                    img_path=image_path,
                    model_name="Facenet",
                    detector_backend="opencv",
                    enforce_detection=False,
                    align=True
                )
            except Exception as e2:
                logger.error(f"Fallback detection failed: {e2}")
        
        log_memory("After DeepFace.represent")

        if objs and len(objs) > 0:
            logger.info("Face detected successfully.")
            embedding = objs[0]["embedding"]
            del objs
            del img
            gc.collect()
            return embedding
        else:
            raise ValueError("No face found in image.")

    except Exception as e:
        logger.error(f"Extraction error: {e}")
        try:
            del img
            gc.collect()
        except Exception:
            pass
        return None
