import os
import glob
from app import create_app
from models import db, FailedScanLog

app = create_app()

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

def clear_failed_scans():
    with app.app_context():
        # Delete from DB
        count = FailedScanLog.query.delete()
        db.session.commit()
        print(f"Deleted {count} failed scan logs from database.")

        # Delete image files
        failed_images = glob.glob(os.path.join(UPLOAD_FOLDER, 'failed_noface_*.jpg'))
        failed_images.extend(glob.glob(os.path.join(UPLOAD_FOLDER, 'failed_unknown_*.jpg')))
        
        for img_path in failed_images:
            try:
                os.remove(img_path)
            except Exception as e:
                print(f"Could not remove {img_path}: {e}")
                
        print(f"Deleted {len(failed_images)} failed scan images from uploads folder.")

if __name__ == '__main__':
    clear_failed_scans()
