import asyncio
import os
import shutil
from motor.motor_asyncio import AsyncIOMotorClient

async def reset_db():
    print("Connecting to DB...")
    uri = 'mongodb+srv://swagatpatel03_db_user:X45ONtgXEJQAx2w0@kiiteats.q3glutb.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['kiiteats']
    foods = db['food_items']
    vendors = db['vendors']

    # Delete all foods
    await foods.delete_many({})
    print("Cleared all old foods")

    # Ensure Vendor exists
    vendor = await vendors.find_one({'name': 'FC Vendor 1'})
    if not vendor:
        vendor = await vendors.find_one()
    if not vendor:
        print("Error: No vendor found.")
        return
        
    v_id = vendor['_id']

    # Curated Menu (20 unique items)
    menu_data = [
        # Premium uploaded items
        {"name": "Paneer Butter Masala", "price": 180, "description": "Rich and creamy cottage cheese curry in tomato gravy", "category": "Curry", "image_url": "/food/paneer_butter_masala.jpg", "available": True},
        {"name": "Chicken Biryani", "price": 220, "description": "Aromatic basmati rice cooked with tender chicken and spices", "category": "Biryani", "image_url": "/food/biryani.png", "available": True},
        {"name": "Greek Salad", "price": 140, "description": "Fresh veggies with feta cheese and olives", "category": "Salad", "image_url": "/food/greek_salad.png", "available": True},
        {"name": "Caesar Salad", "price": 150, "description": "Romaine lettuce, croutons, and classic dressing", "category": "Salad", "image_url": "/food/caesar_salad.png", "available": True},
        {"name": "Quinoa Power Bowl", "price": 190, "description": "Protein-packed quinoa with roasted vegetables", "category": "Salad", "image_url": "/food/quinoa_power_bowl.png", "available": True},
        {"name": "Fruit Salad", "price": 120, "description": "Fresh seasonal fruits mixed to perfection", "category": "Salad", "image_url": "/food/fruit_salad.png", "available": True},
        {"name": "Kathi Rolls", "price": 110, "description": "Spicy mixed wrap filled with fresh ingredients", "category": "Rolls", "image_url": "/food/rolls.png", "available": True},
        
        # Copied local assets
        {"name": "Ripple Ice Cream", "price": 80, "description": "Smooth and creamy ripple dessert", "category": "Desserts", "image_url": "/food/food_9.png", "available": True},
        {"name": "Butterscotch Cake", "price": 150, "description": "Soft butterscotch cake slice", "category": "Cake", "image_url": "/food/food_19.png", "available": True},
        {"name": "Garlic Mushroom", "price": 160, "description": "Sautéed mushrooms with robust garlic flavor", "category": "Pure Veg", "image_url": "/food/food_21.png", "available": True},
        {"name": "Fried Cauliflower", "price": 140, "description": "Crispy fried cauliflower florets tossed with spices", "category": "Pure Veg", "image_url": "/food/food_22.png", "available": True},
        {"name": "Mix Veg Pulao", "price": 130, "description": "Fragrant rice mixed with colorful vegetables", "category": "Pure Veg", "image_url": "/food/food_23.png", "available": True},
        {"name": "Cheese Pasta", "price": 180, "description": "Creamy cheese pasta perfect for cheese lovers", "category": "Pasta", "image_url": "/food/food_25.png", "available": True},
        {"name": "Tomato Pasta", "price": 170, "description": "Tangy tomato-based pasta topped with herbs", "category": "Pasta", "image_url": "/food/food_26.png", "available": True},
        {"name": "Veg Noodles", "price": 130, "description": "Classic stir-fried vegetable noodles", "category": "Noodles", "image_url": "/food/food_30.png", "available": True},
        {"name": "Chicken Sandwich", "price": 120, "description": "Toasted bread with seasoned chicken filling", "category": "Sandwich", "image_url": "/food/food_13.png", "available": True},
        {"name": "Vegan Sandwich", "price": 110, "description": "Healthy vegan filling inside toasted bread", "category": "Sandwich", "image_url": "/food/food_14.png", "available": True},
        {"name": "Chicken Rolls", "price": 130, "description": "Crispy roll stuffed with spicy chicken chunks", "category": "Rolls", "image_url": "/food/food_7.png", "available": True},
        {"name": "Chicken Salad", "price": 160, "description": "Healthy salad bowl topped with grilled chicken", "category": "Salad", "image_url": "/food/food_4.png", "available": True},
        {"name": "Cup Cake", "price": 60, "description": "Sweet vanilla cupcake with buttercream frosting", "category": "Desserts", "image_url": "/food/food_17.png", "available": True},
    ]

    for item in menu_data:
        item["vendor_id"] = str(v_id)
        item["stock"] = 50

    await foods.insert_many(menu_data)
    print(f"Successfully inserted {len(menu_data)} beautifully curated items!")
    client.close()

if __name__ == '__main__':
    # Copy images first
    src_dir = os.path.join("..", "frontend", "src", "user", "assets")
    dest_dir = os.path.join("..", "frontend", "public", "food")
    
    print("Copying asset images to public directory...")
    for i in range(1, 33):
        src_file = os.path.join(src_dir, f"food_{i}.png")
        dest_file = os.path.join(dest_dir, f"food_{i}.png")
        if os.path.exists(src_file):
            shutil.copy2(src_file, dest_file)
    print("Images copied!")

    asyncio.run(reset_db())
