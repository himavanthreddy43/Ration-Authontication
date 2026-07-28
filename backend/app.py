import sys
import os

# Completely disable GPU/CUDA to prevent XLA/StreamExecutor factory registration crashes
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
# Suppress TensorFlow CUDA/GPU logs (must be set before TF import)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
# Set DEEPFACE_HOME to a writable local directory inside backend
deepface_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'deepface_home')
os.makedirs(deepface_dir, exist_ok=True)
os.environ['DEEPFACE_HOME'] = deepface_dir

# Set UTF-8 encoding for standard output and standard error to prevent DeepFace logging crashes on Windows
try:
    if hasattr(sys.stdout, 'reconfigure') and sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure') and sys.stderr.encoding and sys.stderr.encoding.lower() != 'utf-8':
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

import logging
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from models import db
from routes import api_bp

# Load environment variables from .env file
load_dotenv()

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
    # Allow CORS for Vercel frontend, Railway, and local development
    CORS(app, resources={r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": "*",
        "supports_credentials": False
    }})
    
    # Configure Database — uses Supabase PostgreSQL from .env, falls back to SQLite for local dev
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///ration.db')
    
    # Strip out pgbouncer parameter and normalize protocol scheme
    if database_url:
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
            
        if 'pgbouncer=true' in database_url:
            database_url = database_url.replace('&pgbouncer=true', '').replace('?pgbouncer=true', '')
            if database_url.endswith('?'):
                database_url = database_url[:-1]
            
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'pool_timeout': 30
    }
    app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB for base64 image payloads
    
    db.init_app(app)
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Health Check Endpoint
    @app.route('/')
    def health_check():
        return jsonify({
            "status": "success",
            "message": "Backend Running"
        })
        
    @app.route('/test-500')
    def test_500():
        raise Exception("Test 500")
    
    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(error):
        logger.error(f"Bad Request: {error}")
        return jsonify({"error": "Bad Request", "message": str(error)}), 400

    @app.errorhandler(404)
    def not_found(error):
        logger.warning(f"Not Found: {error}")
        return jsonify({"error": "Not Found", "message": str(error)}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        logger.error(f"Server Error: {error}")
        return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred"}), 500
    
    try:
        with app.app_context():
            db.create_all()
            logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        logger.info("Continuing startup... Database connection will be retried on request.")
        
    return app

# Export app globally for Gunicorn
app = create_app()

if __name__ == '__main__':
    logger.info("Starting Smart Ration Backend Server...")
    app.run(debug=True, port=5000)
