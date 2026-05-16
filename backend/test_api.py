import requests
import base64
import os
import glob

# Find an image in the uploads folder
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
images = glob.glob(os.path.join(uploads_dir, '*.jpg'))

if not images:
    print("No images found in uploads.")
else:
    test_img = images[-1] # take the most recent
    print(f"Testing with image: {test_img}")
    
    with open(test_img, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
    res = requests.post('http://127.0.0.1:5000/api/recognize', json={"image": "data:image/jpeg;base64," + encoded_string})
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.json()}")
