import requests

url = "http://127.0.0.1:5000/api/family/register"
headers = {
    "Origin": "https://ration-authontication.vercel.app",
    "Content-Type": "application/json"
}

# Sending a payload where "members" is a string instead of a list
# This will cause data.get('members', []) to return a string, 
# and len("string") is valid, but the for loop will iterate over characters!
# member.get('name') will throw AttributeError on a string character!
data = {
    "head_name": "Test",
    "ration_card_number": "99999",
    "village_name": "TestVillage",
    "phone_number": "1234567890",
    "address": "123 Test St",
    "members": "not_a_list"
}

response = requests.post(url, json=data, headers=headers)
print("Status:", response.status_code)
print("Headers:", response.headers)
print("Body:", response.text)
