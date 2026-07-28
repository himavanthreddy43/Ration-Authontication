import logging
import os
import tempfile
import numpy as np
import gc
from PIL import Image, ImageEnhance

try:
    import cv2
except Exception as cv_err:
    logger = logging.getLogger(__name__)
    logger.warning(f"OpenCV import deferred or failed: {cv_err}")
    cv2 = None

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
    Enhance brightness for low-light images using PIL.
    Returns temporary enhanced image path.
    """
    temp_path = None
    try:
        with Image.open(image_path) as img:
            img_rgb = img.convert('RGB')
            enhancer = ImageEnhance.Brightness(img_rgb)
            enhanced_img = enhancer.enhance(1.35)
            
            fd, temp_path = tempfile.mkstemp(suffix=".jpg")
            os.close(fd)
            enhanced_img.save(temp_path, format='JPEG', quality=85)
            return temp_path
    except Exception as e:
        logger.error(f"Image enhancement failed: {e}")
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
    Extract face embedding with lazy loading of DeepFace and PIL image reading.
    """
    logger.info(f"Starting face extraction for: {image_path}")
    log_memory("Before Image Decoding")

    img_np = None
    try:
        with Image.open(image_path) as img:
            img = img.convert('RGB')
            w, h = img.size
            max_dim = 640
            if h > max_dim or w > max_dim:
                scale = max_dim / max(h, w)
                new_size = (int(w * scale), int(h * scale))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
                try:
                    img.save(image_path, format='JPEG', quality=80)
                except Exception:
                    pass
            img_np = np.array(img)

        log_memory("After Image Resizing with PIL")

        # Lazy load DeepFace
        deepface_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'deepface_home')
        os.makedirs(deepface_dir, exist_ok=True)
        os.environ['DEEPFACE_HOME'] = deepface_dir

        from deepface import DeepFace

        gc.collect()
        objs = None

        # Primary strategy: Pass numpy array directly with detector_backend="skip" (No libGL / cv2 required!)
        try:
            objs = DeepFace.represent(
                img_path=img_np,
                model_name="Facenet",
                detector_backend="skip",
                enforce_detection=False,
                align=False
            )
        except Exception as e1:
            logger.warning(f"DeepFace skip representation failed: {e1}. Trying image_path with opencv...")
            try:
                objs = DeepFace.represent(
                    img_path=image_path,
                    model_name="Facenet",
                    detector_backend="opencv",
                    enforce_detection=False,
                    align=False
                )
            except Exception as e2:
                logger.error(f"All DeepFace representation strategies failed: {e2}")

        log_memory("After DeepFace.represent")

        if objs and len(objs) > 0:
            logger.info("Face detected successfully.")
            embedding = objs[0]["embedding"]
            del objs
            del img_np
            gc.collect()
            return embedding
        else:
            logger.warning("No face embedding extracted.")
            return None

    except Exception as e:
        logger.error(f"Extraction error: {e}", exc_info=True)
        try:
            if img_np is not None:
                del img_np
            gc.collect()
        except Exception:
            pass
        return None
