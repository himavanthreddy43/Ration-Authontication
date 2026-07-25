import requests
import json
import base64

url = "http://127.0.0.1:5000/api/family/register"
headers = {
    "Origin": "https://ration-authontication.vercel.app",
    "Content-Type": "application/json"
}

# A valid 1 pixel JPEG in base64
b64_image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="

data = {
    "head_name": "Test",
    "ration_card_number": "22222",
    "village_name": "TestVillage",
    "phone_number": "1234567890",
    "address": "123 Test St",
    "members": [{
        "name": "TestMember",
        "gender": "Male",
        "age": 30,
        "relationship": "Self",
        "is_default_member": True,
        "images": [b64_image]
    }]
}

try:
    print(f"Sending POST request to {url}")
    response = requests.post(url, json=data, headers=headers)
    print("----- STATUS CODE -----")
    print(response.status_code)
    print("----- RESPONSE HEADERS -----")
    for k, v in response.headers.items():
        print(f"{k}: {v}")
    print("----- RESPONSE BODY -----")
    print(response.text)
except Exception as e:
    print("----- EXCEPTION OCCURRED -----")
    import traceback
    traceback.print_exc()
