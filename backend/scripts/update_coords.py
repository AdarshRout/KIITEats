import os
import sys
import requests
import re
import urllib.parse
from pymongo import MongoClient
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("MONGO_URI not found!")
    sys.exit(1)

client = MongoClient(MONGO_URI)
db = client.kiiteats
vendors_collection = db.vendors

links = {
    "Central Canteen 1": "https://maps.app.goo.gl/ESavZfLXTQevtU2b7",
    "KIIT Food Court 1": "https://maps.app.goo.gl/joRk5vjvbeQgiwxb7",
    "KIIT Food Court 2": "https://maps.app.goo.gl/9hMKN7rTV3tE6Hrz8",
    "KIIT Food Court 9": "https://maps.app.goo.gl/xotHJ6UnzzoZYvQ26",
    "KIIT Food Court 7": "https://maps.app.goo.gl/CPxvWBQHr4emdLQK7",
    "KIIT Food Court 4": "https://maps.app.goo.gl/NMKYn2JHsjf6gVsd8",
    "KIIT Food Court 10": "https://maps.app.goo.gl/DaeD76yCCaBxezbS6",
    "Campus 25 KIIT Kafe": "https://maps.app.goo.gl/RiiXnFW3bGcXY5Hn7",
    "Campus 13 Food Court": "https://maps.app.goo.gl/eVccAYrJ5qrGH7EF6",
    "KIIT Food Court 8": "https://maps.app.goo.gl/4C2Xnbv8UCHeYrRe9"
}

def get_coords_from_url(short_url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
        res = requests.get(short_url, headers=headers, allow_redirects=True, timeout=10)
        final_url = res.url
        print(f"Expanded: {final_url}")
        
        match = re.search(r'@([-0-9.]+),([-0-9.]+)', final_url)
        if match:
            return float(match.group(1)), float(match.group(2))
            
        parsed = urllib.parse.urlparse(final_url)
        params = urllib.parse.parse_qs(parsed.query)
        
        for k in ['q', 'll', 'query']:
            if k in params:
                parts = params[k][0].split(',')
                if len(parts) == 2:
                    try:
                        return float(parts[0]), float(parts[1])
                    except:
                        pass
                        
        print(f"Could not parse lat long from {final_url}")
        return None, None
    except Exception as e:
        print(f"Error fetching {short_url}: {e}")
        return None, None

for name_key, url in links.items():
    print(f"\nProcessing {name_key}...")
    lat, lng = get_coords_from_url(url)
    
    if lat and lng:
        print(f"  Got coords: {lat}, {lng}")
        search_term = name_key.replace("KIIT", "").strip()
        num_match = re.search(r'\d+', search_term)
        
        if "Court" in name_key and num_match:
            db_regex = f"Food Court {num_match.group(0)}"
        else:
            db_regex = search_term

        vendor = vendors_collection.find_one({"name": {"$regex": db_regex, "$options": "i"}})
        
        if vendor:
            print(f"  Found vendor: {vendor['name']}")
            vendors_collection.update_one(
                {"_id": vendor["_id"]},
                {"$set": {"coords": {"lat": lat, "lng": lng}}}
            )
            print(f"  Mapped efficiently!")
        else:
            print(f"  !! Vendor not found in DB matching '{db_regex}'. Trying explicit fallbacks.")
            fallback = vendors_collection.find_one({"name": {"$regex": num_match.group(0) if num_match else "Kafe", "$options": "i"}})
            if fallback:
                print(f"  Fallback Found: {fallback['name']}")
                vendors_collection.update_one(
                    {"_id": fallback["_id"]},
                    {"$set": {"coords": {"lat": lat, "lng": lng}}}
                )
    else:
        print("  !! Could not get coordinates.")

print("\nDatabase coordination migration fully complete.")
