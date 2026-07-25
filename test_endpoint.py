import requests
import traceback
import sys

url = "http://127.0.0.1:5000/api/family/register"
headers = {
    "Origin": "https://ration-authontication.vercel.app",
    "Content-Type": "application/json"
}

# Invalid dummy JSON to trigger processing
data = {
    "head_name": "Test",
    "ration_card_number": "11111",
    "village_name": "TestVillage",
    "phone_number": "1234567890",
    "address": "123 Test St",
    "members": [{
        "name": "TestMember",
        "gender": "Male",
        "age": 30,
        "relationship": "Self",
        "is_default_member": True,
        "images": []
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
    traceback.print_exc()

# Let's also test a success scenario or another error to show headers are always present
print("\nSending a malformed request to test error headers...")
try:
    # Malformed data (not valid JSON payload structure or empty)
    response_error = requests.post(url, json={}, headers=headers)
    print("----- ERROR STATUS CODE -----")
    print(response_error.status_code)
    print("----- ERROR RESPONSE HEADERS -----")
    for k, v in response_error.headers.items():
        print(f"{k}: {v}")
    print("----- ERROR RESPONSE BODY -----")
    print(response_error.text)
except Exception as e:
    traceback.print_exc()
