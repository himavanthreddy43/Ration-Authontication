import logging
import cv2
import os
import tempfile
from deepface import DeepFace
import numpy as np

logger = logging.getLogger(__name__)

def enhance_image(image_path: str) -> str | None:
    """Enhance image brightness and contrast for low-light conditions."""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None
        
        # Convert to HSV to enhance brightness (V channel)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        
        # Increase brightness using proper numpy uint8 scalar
        v = cv2.add(v, np.uint8([40]))
        
        final_hsv = cv2.merge((h, s, v))
        enhanced_img = cv2.cvtColor(final_hsv, cv2.COLOR_HSV2BGR)
        
        # Save to temp file
        fd, temp_path = tempfile.mkstemp(suffix='.jpg')
        os.close(fd)
        cv2.imwrite(temp_path, enhanced_img)
        return temp_path
    except Exception as e:
        logger.error(f"Image enhancement failed: {e}")
        return None

def extract_embedding(image_path: str) -> list | None:
    """
    Extract face embedding with a robust fallback mechanism:
    1. Try opencv (enforce_detection=True)
    2. Try mtcnn (enforce_detection=True)
    3. Try image enhancement + opencv
    4. Fallback to enforce_detection=False
    """
    logger.info(f"Starting face extraction for {image_path}")
    
    # Check Image Format: Convert BGR to RGB so detection models see colors correctly
    img = cv2.imread(image_path)
    if img is None:
        logger.error(f"Failed to read image from path: {image_path}")
        return None
        
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Add Debug Prints right before detection
    logger.info(f"Image successfully converted to RGB. Shape: {rgb_img.shape}, Type: {type(rgb_img)}")
    
    # Strategy 1: Fast Detection with OpenCV
    try:
        logger.debug("Attempting detection with OpenCV (Fast)...")
        objs = DeepFace.represent(img_path=rgb_img, model_name="ArcFace", detector_backend="opencv", enforce_detection=True, align=True)
        if objs:
            logger.info("Face detected successfully with OpenCV.")
            return objs[0]['embedding']
    except Exception as e:
        logger.warning(f"OpenCV strict detection failed: {e}")
        
    # Strategy 2: High Accuracy Fallback with MTCNN
    try:
        logger.debug("Attempting fallback detection with MTCNN (Accurate)...")
        objs = DeepFace.represent(img_path=rgb_img, model_name="ArcFace", detector_backend="mtcnn", enforce_detection=True, align=True)
        if objs:
            logger.info("Face detected successfully with MTCNN.")
            return objs[0]['embedding']
    except Exception as e:
        logger.warning(f"MTCNN strict detection failed: {e}")

    # Strategy 3: Enhance image brightness and retry with OpenCV
    try:
        logger.debug("Attempting detection with enhanced image + OpenCV...")
        enhanced_path = enhance_image(image_path)
        if enhanced_path:
            enhanced_img = cv2.imread(enhanced_path)
            if enhanced_img is not None:
                enhanced_rgb = cv2.cvtColor(enhanced_img, cv2.COLOR_BGR2RGB)
                objs = DeepFace.represent(img_path=enhanced_rgb, model_name="ArcFace", detector_backend="opencv", enforce_detection=True, align=True)
                if objs:
                    logger.info("Face detected successfully with enhanced image + OpenCV.")
                    return objs[0]['embedding']
            # Clean up temp file
            try:
                os.remove(enhanced_path)
            except OSError:
                pass
    except Exception as e:
        logger.warning(f"Enhanced image detection failed: {e}")

    # Strategy 4: Last resort — skip face detection entirely
    try:
        logger.debug("Attempting fallback with enforce_detection=False...")
        objs = DeepFace.represent(img_path=rgb_img, model_name="ArcFace", detector_backend="skip", enforce_detection=False, align=False)
        if objs:
            logger.info("Face embedding extracted with skip detection (last resort).")
            return objs[0]['embedding']
    except Exception as e:
        logger.error(f"Complete face extraction failure. All 4 strategies exhausted.", exc_info=False)

    return None

def compare_embeddings(emb1: list, emb2: list, threshold: float = 0.50):
    """Compare two embeddings using Cosine Distance. Returns (is_match, distance)."""
    try:
        a = np.array(emb1)
        b = np.array(emb2)
        
        # Check if model outputs are incompatible (e.g. Facenet vs ArcFace)
        if a.shape != b.shape:
            logger.warning("Incompatible embedding shapes. Did you switch models?")
            return False, 1.0
        # Calculate Cosine Distance
        cosine_dist = 1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
        logger.info(f"Comparing faces - Cosine Distance: {cosine_dist}, Threshold: {threshold}")
        return bool(cosine_dist < threshold), float(cosine_dist)
    except Exception as e:
        logger.error(f"Error comparing embeddings: {e}")
        return False, 1.0
