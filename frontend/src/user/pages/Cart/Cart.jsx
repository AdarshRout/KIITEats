import React, { useContext } from 'react'
import './Cart.css'
import { StoreContext } from '../../Context/StoreContext.js'
import { useNavigate } from 'react-router-dom'

const Cart = () => {
  const { groupedCartItems, removeFromCart, addToCart, getTotalCartAmount } = useContext(StoreContext)
  const navigate = useNavigate()
  const subtotal = getTotalCartAmount()
  const deliveryFee = subtotal === 0 ? 0 : 5

  return (
    <div className='cart'>
      <div className='cart-heading'>
        <h1>Your cart</h1>
        <p>Grouped by vendor for cleaner campus ordering.</p>
      </div>

      <div className='cart-items'>
        {groupedCartItems.length ? groupedCartItems.map((vendorGroup) => (
          <div key={vendorGroup.vendor.id} className='vendor-cart-group section-card'>
            <div className='vendor-cart-header'>
              <div>
                <h3>{vendorGroup.vendor.name}</h3>
                <p>{vendorGroup.vendor.specialty} • {vendorGroup.vendor.eta}</p>
              </div>
              <strong>₹{vendorGroup.subtotal}</strong>
            </div>

            {vendorGroup.items.map((item) => (
              <div className='cart-item-row' key={item.food_id}>
                <div className='cart-item-main'>
                  <img src={item.food_image} alt={item.food_name} />
                  <div>
                    <h4>{item.food_name}</h4>
                    <p>{item.food_type} • {item.calories} kcal</p>
                  </div>
                </div>
                <div className='cart-item-actions'>
                  <button onClick={() => removeFromCart(item.food_id)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => addToCart(item.food_id)}>+</button>
                  <strong>₹{item.total}</strong>
                </div>
              </div>
            ))}
          </div>
        )) : (
          <div className='empty-cart section-card'>
            <h2>Your cart is empty</h2>
            <p>Add dishes from any vendor to start a campus order.</p>
          </div>
        )}
      </div>

      <div className='cart-bottom'>
        <div className='cart-total'>
          <h2>Cart totals</h2>
          <div>
            <div className='cart-total-details'><p>Subtotal</p><p>₹{subtotal}</p></div>
            <hr />
            <div className='cart-total-details'><p>Delivery Fee</p><p>₹{deliveryFee}</p></div>
            <hr />
            <div className='cart-total-details'><b>Total</b><b>₹{subtotal + deliveryFee}</b></div>
          </div>
          <button onClick={() => navigate('/user/order')} disabled={!groupedCartItems.length}>Proceed to checkout</button>
        </div>
        <div className='cart-promocode'>
          <div>
            <p>Promo and perks</p>
            <div className='promo-note'>Use <strong>KIITGREEN</strong> at demo checkout for a mock eco-friendly discount badge.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
