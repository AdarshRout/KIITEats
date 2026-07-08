import { useContext } from "react";
import PropTypes from "prop-types";
import "./FoodItem.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext.js";
import { useNavigate } from "react-router-dom";

const FoodItem = ({
  image,
  name,
  price,
  desc,
  id,
  type,
  calories,
  vendor,
  rating,
}) => {
  const { cartItems, addToCart, removeFromCart } = useContext(StoreContext);
  const navigate = useNavigate();

  const goToDetails = () => navigate(`/user/food/${id}`);

  return (
    <div className="food-item section-card" onClick={goToDetails}>
      <div className="food-item-img-container">
        <img className="food-item-image" src={image} alt={name} />
        <span className={`food-type ${type === "Veg" ? "veg" : "non-veg"}`}>
          {type}
        </span>
        {!cartItems[id] ? (
          <img
            className="add"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(id);
            }}
            src={assets.add_icon_white}
            alt="Add to cart"
          />
        ) : (
          <div
            className="food-item-counter"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={assets.remove_icon_red}
              onClick={() => removeFromCart(id)}
              alt="Remove"
            />
            <p>{cartItems[id]}</p>
            <img
              src={assets.add_icon_green}
              onClick={() => addToCart(id)}
              alt="Add more"
            />
          </div>
        )}
      </div>
      <div className="food-item-info">
        <div className="food-item-name-rating">
          <div>
            <p>{name}</p>
            <small>{vendor}</small>
          </div>
          <div className="food-rating-chip">★ {rating}</div>
        </div>
        <p className="food-item-desc">{desc}</p>
        <div className="food-item-meta">
          <span>{calories} kcal</span>
          <span>{type}</span>
          <span>Pickup-ready</span>
        </div>
        <p className="food-item-price">₹{price}</p>
      </div>
    </div>
  );
};

FoodItem.propTypes = {
  image: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  desc: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  type: PropTypes.string.isRequired,
  calories: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  vendor: PropTypes.string.isRequired,
  rating: PropTypes.number.isRequired,
};

export default FoodItem;
