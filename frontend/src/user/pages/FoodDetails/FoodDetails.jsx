import  { useContext } from "react";
import "./FoodDetails.css";
import { StoreContext } from "../../Context/StoreContext.js";
import { Link, useParams } from "react-router-dom";

const FoodDetails = () => {
  const { id } = useParams();
  const { getFoodById, addToCart, cartItems, getRecommendedItems } =
    useContext(StoreContext);
  const item = getFoodById(id);
  const recommended = getRecommendedItems(id);

  if (!item) {
    return <div className="food-details-empty">Food item not found.</div>;
  }

  return (
    <div className="food-details">
      <Link to="/user" className="food-details-back">
        ← Back to menu
      </Link>
      <div className="food-details-card section-card">
        <img
          src={item.food_image}
          alt={item.food_name}
          className="food-details-image"
        />
        <div className="food-details-content">
          <div className="food-details-top">
            <div>
              <span
                className={`food-details-type ${item.food_type === "Veg" ? "veg" : "non-veg"}`}
              >
                {item.food_type}
              </span>
              <h1>{item.food_name}</h1>
              <p>{item.food_desc}</p>
            </div>
            <div className="food-details-price">₹{item.food_price}</div>
          </div>

          <div className="food-details-grid">
            <div>
              <strong>Calories</strong>
              <span>{item.calories} kcal</span>
            </div>
            <div>
              <strong>Best paired with</strong>
              <span>{item.best_pair}</span>
            </div>
            <div>
              <strong>Protein</strong>
              <span>{item.protein}</span>
            </div>
            <div>
              <strong>Carbs</strong>
              <span>{item.carbs}</span>
            </div>
            <div>
              <strong>Fats</strong>
              <span>{item.fats}</span>
            </div>
            <div>
              <strong>Spice level</strong>
              <span>{item.spice_level}</span>
            </div>
            <div>
              <strong>Prep time</strong>
              <span>{item.prep_time}</span>
            </div>
            <div>
              <strong>Delivery time</strong>
              <span>{item.delivery_time}</span>
            </div>
            <div>
              <strong>Vendor</strong>
              <span>{item.vendor.name}</span>
            </div>
            <div>
              <strong>Rating</strong>
              <span>{item.rating} / 5</span>
            </div>
            <div>
              <strong>Allergens</strong>
              <span>{item.allergens}</span>
            </div>
            <div>
              <strong>Recommended for</strong>
              <span>{item.recommended_for}</span>
            </div>
          </div>

          <div className="food-details-tags">
            {item.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
            <span>{item.nutrition_source}</span>
          </div>

          <button
            className="food-details-btn"
            onClick={() => addToCart(item.food_id)}
          >
            Add to cart{" "}
            {cartItems[item.food_id] ? `(${cartItems[item.food_id]})` : ""}
          </button>
        </div>
      </div>

      <div className="recommended-block">
        <h2>You may also like</h2>
        <div className="recommended-grid">
          {recommended.map((food) => (
            <Link
              key={food.food_id}
              to={`/user/food/${food.food_id}`}
              className="recommended-card section-card"
            >
              <img src={food.food_image} alt={food.food_name} />
              <div>
                <strong>{food.food_name}</strong>
                <span>{food.vendor.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FoodDetails;
