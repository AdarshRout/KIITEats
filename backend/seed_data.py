"""
seed_data.py  —  Populate MongoDB with the 10 real KIIT food-court vendors
and sample food items so the user-facing pages have data.

Usage:
    cd backend
    python seed_data.py

What it does:
  1. Creates 10 vendor user accounts (one per food court)
  2. Creates corresponding vendor profiles with real campus coordinates
  3. Adds sample food items for each vendor
  4. All data persists in MongoDB and is visible on the user side
"""

import httpx
import sys

BASE = "http://localhost:8000"

# ── Vendors — Real KIIT Food Courts with pinpoint coordinates ────────────
VENDORS = [
    {
        "name": "KIIT Food Court 1",
        "email": "fc1@kiit.ac.in",
        "location": "Campus 6 Area",
        "lat": 20.35320,
        "lng": 85.82050,
        "description": "The original campus food court serving a wide variety of meals & snacks",
        "foods": [
            {"name": "Veg Thali", "price": 80, "category": "Meals", "description": "Dal, sabzi, rice, roti & pickle"},
            {"name": "Chicken Biryani", "price": 120, "category": "Biryani", "description": "Aromatic basmati rice with tender chicken pieces"},
            {"name": "Paneer Butter Masala", "price": 100, "category": "Meals", "description": "Rich creamy paneer curry with butter naan"},
            {"name": "Masala Dosa", "price": 60, "category": "South Indian", "description": "Crispy dosa with potato filling, sambar & chutney"},
        ],
    },
    {
        "name": "KIIT Food Court 7",
        "email": "fc7@kiit.ac.in",
        "location": "Chandaka Industrial Estate",
        "lat": 20.35580,
        "lng": 85.81990,
        "description": "Popular food court near the engineering blocks with diverse cuisine options",
        "foods": [
            {"name": "Chicken Fried Rice", "price": 110, "category": "Chinese", "description": "Wok-tossed rice with chicken & vegetables"},
            {"name": "Egg Roll", "price": 50, "category": "Rolls", "description": "Double egg roll with spicy filling"},
            {"name": "Hakka Noodles", "price": 90, "category": "Chinese", "description": "Indo-Chinese stir-fried noodles with vegetables"},
            {"name": "Mutton Curry Rice", "price": 140, "category": "Meals", "description": "Slow-cooked mutton curry served with steamed rice"},
        ],
    },
    {
        "name": "KIIT Food Court 9",
        "email": "fc9@kiit.ac.in",
        "location": "Campus 6 Rd",
        "lat": 20.35480,
        "lng": 85.81550,
        "description": "Cozy cafe-style food court with quick bites and beverages",
        "foods": [
            {"name": "Cold Coffee", "price": 60, "category": "Beverages", "description": "Creamy iced coffee with chocolate drizzle"},
            {"name": "Veg Sandwich", "price": 50, "category": "Snacks", "description": "Grilled sandwich with cheese, corn & capsicum"},
            {"name": "Chicken Momos", "price": 70, "category": "Snacks", "description": "Steamed dumplings with spicy red chutney"},
            {"name": "French Fries", "price": 60, "category": "Snacks", "description": "Crispy golden fries with peri-peri seasoning"},
        ],
    },
    {
        "name": "KIIT Food Court 2",
        "email": "fc2@kiit.ac.in",
        "location": "Near Campus 6",
        "lat": 20.35250,
        "lng": 85.82200,
        "description": "Bustling food court known for its North Indian specialties and fast service",
        "foods": [
            {"name": "Chole Bhature", "price": 70, "category": "North Indian", "description": "Spiced chickpea curry with fried bread"},
            {"name": "Aloo Paratha", "price": 50, "category": "North Indian", "description": "Stuffed potato flatbread with curd & pickle"},
            {"name": "Rajma Chawal", "price": 70, "category": "North Indian", "description": "Kidney bean curry with steamed rice"},
            {"name": "Lassi", "price": 40, "category": "Beverages", "description": "Sweet Punjabi yogurt drink"},
        ],
    },
    {
        "name": "KIIT Food Court 4",
        "email": "fc4@kiit.ac.in",
        "location": "Central Campus",
        "lat": 20.35400,
        "lng": 85.82300,
        "description": "Central campus food hub with street food stalls and modern dining",
        "foods": [
            {"name": "Pav Bhaji", "price": 60, "category": "Street Food", "description": "Spiced mashed vegetables with buttered pav"},
            {"name": "Chicken Tikka", "price": 130, "category": "Tandoor", "description": "Charcoal-grilled marinated chicken pieces"},
            {"name": "Paneer Tikka Roll", "price": 80, "category": "Rolls", "description": "Spiced paneer with mint mayo in a wrap"},
            {"name": "Samosa Chaat", "price": 40, "category": "Street Food", "description": "Crushed samosa with chutneys, onion & sev"},
        ],
    },
    {
        "name": "KIIT Food Court 6",
        "email": "fc6@kiit.ac.in",
        "location": "Campus 6",
        "lat": 20.35210,
        "lng": 85.82010,
        "description": "Multi-cuisine food court in the heart of Campus 6 with South Indian specials",
        "foods": [
            {"name": "Idli Sambar", "price": 40, "category": "South Indian", "description": "Soft steamed rice cakes with lentil soup"},
            {"name": "Vada Pav", "price": 30, "category": "Street Food", "description": "Mumbai-style spiced potato fritter in a bun"},
            {"name": "Fish Curry Rice", "price": 120, "category": "Meals", "description": "Coastal-style fish curry with steamed rice"},
            {"name": "Filter Coffee", "price": 30, "category": "Beverages", "description": "Traditional South Indian drip coffee"},
        ],
    },
    {
        "name": "Food Court Campus 13",
        "email": "fc13@kiit.ac.in",
        "location": "Campus 13 — Cricket Stadium Area",
        "lat": 20.35680,
        "lng": 85.81700,
        "description": "Food court near the cricket stadium, popular during matches and events",
        "foods": [
            {"name": "Chicken Burger", "price": 90, "category": "Fast Food", "description": "Crispy chicken patty with lettuce & mayo"},
            {"name": "Veggie Pizza Slice", "price": 80, "category": "Fast Food", "description": "Loaded pizza slice with mozzarella & veggies"},
            {"name": "Chocolate Milkshake", "price": 70, "category": "Beverages", "description": "Thick chocolate shake with whipped cream"},
            {"name": "Chicken Wings", "price": 120, "category": "Fast Food", "description": "Spicy buffalo wings (6 pcs) with dip"},
        ],
    },
    {
        "name": "KIIT Food Court 10 — KIMS",
        "email": "fc10@kiit.ac.in",
        "location": "KIMS Hospital Area",
        "lat": 20.35340,
        "lng": 85.81540,
        "description": "Food court adjacent to KIMS Hospital with healthy and hygienic meal options",
        "foods": [
            {"name": "Fruit Bowl", "price": 70, "category": "Healthy", "description": "Seasonal fruits with honey-lime dressing"},
            {"name": "Grilled Chicken Salad", "price": 130, "category": "Healthy", "description": "Grilled chicken with fresh greens & vinaigrette"},
            {"name": "Veg Soup", "price": 50, "category": "Healthy", "description": "Hot mixed vegetable soup with croutons"},
            {"name": "Brown Rice Thali", "price": 100, "category": "Healthy", "description": "Nutritious thali with brown rice, dal & sabzi"},
        ],
    },
    {
        "name": "KIIT Central Canteen 1",
        "email": "cc1@kiit.ac.in",
        "location": "Campus 6 — Above Main Auditorium",
        "lat": 20.35180,
        "lng": 85.82070,
        "description": "The iconic central canteen above the main auditorium — always buzzing with students",
        "foods": [
            {"name": "Mini Thali", "price": 60, "category": "Meals", "description": "Budget-friendly dal, rice, roti & sabzi"},
            {"name": "Egg Curry Rice", "price": 70, "category": "Meals", "description": "Boiled egg curry with steamed rice"},
            {"name": "Tea & Toast", "price": 25, "category": "Snacks", "description": "Classic campus chai with butter toast"},
            {"name": "Maggi", "price": 30, "category": "Snacks", "description": "Classic 2-minute noodles with extra veggies"},
        ],
    },
    {
        "name": "Campus 25 KIIT Kafe",
        "email": "c25@kiit.ac.in",
        "location": "Campus 25",
        "lat": 20.35750,
        "lng": 85.81850,
        "description": "Modern cafe in the new Campus 25 for CS students — coffee, pasta & more",
        "foods": [
            {"name": "Cappuccino", "price": 80, "category": "Beverages", "description": "Rich espresso with steamed milk foam"},
            {"name": "Penne Arrabiata", "price": 130, "category": "Pasta", "description": "Penne in spicy tomato sauce with basil"},
            {"name": "Club Sandwich", "price": 110, "category": "Snacks", "description": "Triple-decker with chicken, lettuce & mayo"},
            {"name": "Blueberry Cheesecake", "price": 150, "category": "Desserts", "description": "New York style cheesecake with blueberry compote"},
        ],
    },
]

PASSWORD = "vendor@1234"  # shared demo password


def seed():
    print("🌱 KiitEats Seed Script — 10 Real KIIT Food Courts")
    print("=" * 55)

    with httpx.Client(base_url=BASE, timeout=15) as client:
        for vendor_data in VENDORS:
            name = vendor_data["name"]
            email = vendor_data["email"]
            print(f"\n── {name} ────────────────────────")

            # 1) Sign up (role = vendor)
            resp = client.post("/auth/signup", json={
                "name": name,
                "email": email,
                "password": PASSWORD,
                "role": "vendor",
            })
            if resp.status_code == 201:
                print(f"   ✅ User created: {email}")
            elif resp.status_code == 400 and "already" in resp.text.lower():
                print(f"   ⏭  User exists: {email}")
            else:
                print(f"   ❌ Signup failed ({resp.status_code}): {resp.text}")

            # 2) Login
            resp = client.post("/auth/login", json={
                "email": email,
                "password": PASSWORD,
            })
            if resp.status_code != 200:
                print(f"   ❌ Login failed ({resp.status_code}): {resp.text}")
                continue
            token = resp.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            print(f"   🔑 Logged in")

            # 3) Create vendor profile
            resp = client.post("/vendors/", json={
                "name": vendor_data["name"],
                "location": vendor_data["location"],
                "description": vendor_data["description"],
                "email": vendor_data["email"],
                "lat": vendor_data["lat"],
                "lng": vendor_data["lng"],
            }, headers=headers)
            if resp.status_code == 201:
                vendor_id = resp.json().get("_id")
                print(f"   🏪 Vendor created (id: {vendor_id})")
            elif resp.status_code == 400 and "already" in resp.text.lower():
                # Fetch existing vendor
                resp2 = client.get("/vendors/me", headers=headers)
                vendor_id = resp2.json().get("_id") if resp2.status_code == 200 else None
                print(f"   ⏭  Vendor exists (id: {vendor_id})")
            else:
                print(f"   ❌ Vendor creation failed ({resp.status_code}): {resp.text}")
                continue

            # 4) Add food items
            for food in vendor_data["foods"]:
                resp = client.post("/foods/", json={
                    "name": food["name"],
                    "price": food["price"],
                    "category": food["category"],
                    "description": food["description"],
                    "available": True,
                    "stock": 100,
                }, headers=headers)
                if resp.status_code == 201:
                    print(f"   🍽  Added: {food['name']} (₹{food['price']})")
                else:
                    print(f"   ⚠  Food failed: {food['name']} — {resp.text[:80]}")

    print("\n" + "=" * 55)
    print("✅ Seeding complete! Refresh the frontend at http://localhost:5173")
    print("   Vendor login: any email above / password: vendor@1234")


if __name__ == "__main__":
    try:
        seed()
    except httpx.ConnectError:
        print("❌ Cannot connect to backend at http://localhost:8000")
        print("   Make sure the backend is running: uvicorn app.main:app --reload")
        sys.exit(1)
