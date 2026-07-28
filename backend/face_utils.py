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
# FACE DETECTION AND CROPPING (CLAHE + OpenCV)
# ============================================

try:
    if cv2 is not None:
        face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(face_cascade_path)
    else:
        face_cascade = None
except Exception:
    face_cascade = None

def enhance_and_equalize_image(img_np):
    """Enhance contrast and balance glare/backlight using CLAHE in HSV space."""
    if cv2 is None:
        return img_np
    try:
        hsv = cv2.cvtColor(img_np, cv2.COLOR_RGB2HSV)
        h, s, v = cv2.split(hsv)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        v_eq = clahe.apply(v)
        hsv_eq = cv2.merge((h, s, v_eq))
        return cv2.cvtColor(hsv_eq, cv2.COLOR_HSV2RGB)
    except Exception as e:
        logger.warning(f"CLAHE enhancement failed: {e}")
        return img_np

def detect_and_crop_face(img_np):
    """
    Detect face in image, apply backlight correction if needed, and crop to face ROI.
    Returns (cropped_face_np, success_flag).
    """
    if img_np is None or cv2 is None or face_cascade is None or face_cascade.empty():
        return img_np, False

    try:
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        
        # Strategy 1: Detect face on original grayscale image
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(50, 50)
        )

        # Strategy 2: If no face detected, apply CLAHE backlight equalization and retry
        if len(faces) == 0:
            enhanced = enhance_and_equalize_image(img_np)
            gray_enhanced = cv2.cvtColor(enhanced, cv2.COLOR_RGB2GRAY)
            faces = face_cascade.detectMultiScale(
                gray_enhanced,
                scaleFactor=1.05,
                minNeighbors=3,
                minSize=(40, 40)
            )
            if len(faces) > 0:
                img_np = enhanced

        if len(faces) > 0:
            # Select largest face by bounding box area
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            (x, y, w, h) = faces[0]

            # Add 15% margin around face
            img_h, img_w = img_np.shape[:2]
            margin_w = int(w * 0.15)
            margin_h = int(h * 0.15)

            x1 = max(0, x - margin_w)
            y1 = max(0, y - margin_h)
            x2 = min(img_w, x + w + margin_w)
            y2 = min(img_h, y + h + margin_h)

            cropped_face = img_np[y1:y2, x1:x2]
            logger.info(f"Face bounding box detected and cropped: ({x1},{y1}) -> ({x2},{y2})")
            return cropped_face, True

    except Exception as e:
        logger.warning(f"Face detection and cropping failed: {e}")

    return img_np, False

# ============================================
# EMBEDDING COMPARISON
# ============================================

def compare_embeddings(emb1, emb2, threshold: float = 0.40):
    """
    Compare two 128-dim Facenet embeddings using cosine distance.
    Returns (is_match, distance).
    """
    try:
        a = np.array(emb1, dtype=np.float32)
        b = np.array(emb2, dtype=np.float32)

        # Validate vector shapes (both must be 128-dim Facenet vectors)
        if a.shape != b.shape:
            logger.warning(f"Embedding shape mismatch: {a.shape} vs {b.shape}")
            return False, 1.0

        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)

        if norm_a == 0 or norm_b == 0:
            logger.warning("Zero vector embedding detected")
            return False, 1.0

        # Cosine distance
        cosine_dist = float(1.0 - (np.dot(a, b) / (norm_a * norm_b)))

        logger.info(f"Cosine Distance: {cosine_dist:.4f} (Threshold: {threshold})")

        return bool(cosine_dist < threshold), cosine_dist

    except Exception as e:
        logger.error(f"Embedding comparison failed: {e}")
        return False, 1.0

def extract_embedding(image_path: str):
    """
    Extract face embedding with lazy loading of DeepFace and PIL image reading.
    Crops face ROI to prevent background false positives.
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
                    img.save(image_path, format='JPEG', quality=85)
                except Exception:
                    pass
            img_np = np.array(img)

        # Detect face and crop image ROI to eliminate background false positives
        cropped_face, face_found = detect_and_crop_face(img_np)
        log_memory("After Image Cropping with OpenCV/CLAHE")

        # Lazy load DeepFace
        deepface_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'deepface_home')
        os.makedirs(deepface_dir, exist_ok=True)
        os.environ['DEEPFACE_HOME'] = deepface_dir

        from deepface import DeepFace

        gc.collect()
        objs = None

        # Strategy 1: Extract embedding from cropped face ROI
        try:
            objs = DeepFace.represent(
                img_path=cropped_face,
                model_name="Facenet",
                detector_backend="skip",
                enforce_detection=False,
                align=False
            )
        except Exception as e1:
            logger.warning(f"Cropped face representation failed: {e1}. Trying full image...")
            try:
                objs = DeepFace.represent(
                    img_path=img_np,
                    model_name="Facenet",
                    detector_backend="skip",
                    enforce_detection=False,
                    align=False
                )
            except Exception as e2:
                logger.error(f"All DeepFace representation strategies failed: {e2}")

        log_memory("After DeepFace.represent")

        if objs and len(objs) > 0:
            logger.info("Face embedding extracted successfully.")
            embedding = objs[0]["embedding"]
            del objs
            if img_np is not None:
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
