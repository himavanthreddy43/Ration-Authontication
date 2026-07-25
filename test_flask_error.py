from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({"error": "Caught by 500"}), 500

@app.route('/test')
def test():
    raise ValueError("Test unhandled exception")

if __name__ == '__main__':
    with app.test_client() as client:
        response = client.get('/test')
        print("Status:", response.status_code)
        print("Body:", response.data)
        print("Headers:", response.headers)
