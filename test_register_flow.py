import requests
import json
import base64

url = "http://127.0.0.1:5000/api/family/register"
headers = {
    "Origin": "https://ration-authontication.vercel.app",
    "Content-Type": "application/json"
}

# 1 pixel valid base64 JPEG
b64_image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="

data = {
    "head_name": "Test",
    "ration_card_number": "99999",
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

response = requests.post(url, json=data, headers=headers)
print("Status:", response.status_code)
print("Headers:", response.headers)
print("Body:", response.text)
