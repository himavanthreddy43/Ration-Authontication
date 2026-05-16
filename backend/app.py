import sys
import os

# Set UTF-8 encoding for standard output and standard error to prevent DeepFace logging crashes on Windows
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')

import logging
from flask import Flask, jsonify
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
    app = Flask(__name__)
    # Allow CORS for all domains on API routes to ensure frontend compatibility
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Configure Database — uses Supabase PostgreSQL from .env, falls back to SQLite for local dev
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///ration.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    app.register_blueprint(api_bp, url_prefix='/api')
    
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
    
    with app.app_context():
        db.create_all()
        logger.info("Database initialized successfully.")
        
    return app

if __name__ == '__main__':
    app = create_app()
    logger.info("Starting Smart Ration Backend Server...")
    app.run(debug=True, port=5000)
