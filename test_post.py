import requests

url = "http://127.0.0.1:5000/api/family/register"
headers = {
    "Origin": "https://ration-authontication.vercel.app",
    "Content-Type": "application/json"
}
data = {
    "head_name": "Test",
    "ration_card_number": "12345",
    "village_name": "TestVillage",
    "phone_number": "1234567890",
    "address": "123 Test St",
    "members": [{
        "name": "TestMember",
        "gender": "Male",
        "age": 30,
        "relationship": "Self",
        "is_default_member": True,
        "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAZABkAAD/7AARRHVja3kAAQAEAAAAPAAA/+4ADkFkb2JlAGTAAAAAAf/bAIQABgQEBAUEBgUFBgkGBQYJCwgGBggLDAoKCwoKDBAMDAwMDAwQDA4PEA8ODBMTFBQTExwbGxscHx8fHx8fHx8fHwEHBwcNDA0YEBAYGhURFRofHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8f/8AAEQgAAQABAwERAAIRAQMRAf/EABwAAQAAAAAAAAAAAAAAAAAAAAf/xAAcEAQAAAAAAAAAAAAAAAAAAAAA/8QAHAEBAAAAAAAAAAAAAAAAAAAAAP/EABwRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJmH/9k="]
    }]
}

print("Sending request...")
response = requests.post(url, json=data, headers=headers)
print("Status Code:", response.status_code)
print("Headers:", response.headers)
print("Response:", response.text)
