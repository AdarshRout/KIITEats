import httpx
import sys

BASE = "http://localhost:8000"
PASSWORD = "vendor@1234"

# 1. Login to a known vendor (e.g. Green Bowl)
email = "greenbowl@kiitvendor.ac.in"
resp = httpx.post(f"{BASE}/auth/login", json={"email": email, "password": PASSWORD})
if resp.status_code != 200:
    print("Login failed:", resp.text)
    sys.exit(1)

token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get vendor profile
resp = httpx.get(f"{BASE}/vendors/me", headers=headers)
if resp.status_code != 200:
    print("Get vendor failed:", resp.text)
    sys.exit(1)

vendor = resp.json()
print("Keys:", vendor.keys())
