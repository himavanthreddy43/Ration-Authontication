import requests

url = "http://127.0.0.1:5000/api/family/register"
headers = {
    "Origin": "https://ration-authontication.vercel.app",
    "Content-Type": "application/json"
}
data = '{"large": "' + 'a' * (51 * 1024 * 1024) + '"}'

print("Sending request...")
response = requests.post(url, data=data, headers=headers)
print("Status Code:", response.status_code)
print("Headers:", response.headers)
print("Response:", response.text[:200])
