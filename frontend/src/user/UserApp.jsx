import React, { useContext, useState } from 'react'
import Home from './pages/Home/Home'
import { Route, Routes } from 'react-router-dom'
import Cart from './pages/Cart/Cart'
import LoginPopup from './components/LoginPopup/LoginPopup'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import MyOrders from './pages/MyOrders/MyOrders'
import FoodDetails from './pages/FoodDetails/FoodDetails'
import { StoreContext } from './Context/StoreContext.js'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import OrderTracking from './pages/OrderTracking/OrderTracking'
import GroupOrder from './pages/GroupOrder/GroupOrder'
import Vendors from './pages/Vendors/Vendors'
import MenuPage from './pages/MenuPage/MenuPage'
import AppLayout from '../components/AppLayout'
import PaymentVerification from './pages/PaymentVerification/PaymentVerification'
import {
  ShoppingBasket,
  Leaf,
  Home as HomeIcon,
  Store,
  PackageCheck,
  MapPin,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const USER_NAV_LINKS = [
  { to: '/user', label: 'Home', icon: <HomeIcon size={16} /> },
  { to: '/user/vendors', label: 'Vendors', icon: <Store size={16} /> },
  { to: '/user/myorder', label: 'Orders', icon: <PackageCheck size={16} /> },
  { to: '/user/tracking', label: 'Tracking', icon: <MapPin size={16} /> },
  { to: '/user/group-order', label: 'Group', icon: <Users size={16} /> },
]

const App = () => {
  const [showLogin, setShowLogin] = useState(false)
  const { getTotalCartItems, vegOnly, toggleVegOnly } = useContext(StoreContext)

  const totalItems = getTotalCartItems()

  // Action buttons rendered inside the AppHeader
  const headerActions = (
    <>
      <button
        className={`app-header-action-btn ${vegOnly ? 'active' : ''}`}
        onClick={toggleVegOnly}
        type="button"
      >
        <Leaf size={16} />
        <span>{vegOnly ? 'Veg only' : 'Veg'}</span>
      </button>

      <Link to="/user/cart" className="app-header-cart">
        <ShoppingBasket size={18} />
        {totalItems > 0 && (
          <span className="app-header-cart-count">{totalItems}</span>
        )}
      </Link>
    </>
  )

  return (
    <AppLayout navLinks={USER_NAV_LINKS} actions={headerActions}>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : null}
      <div className='container' style={{ paddingTop: '24px', paddingBottom: '48px' }}>
        <ErrorBoundary>
          <Routes>
            <Route index element={<Home />} />
            <Route path='cart' element={<Cart />} />
            <Route path='order' element={<PlaceOrder />} />
            <Route path='myorder' element={<MyOrders />} />
            <Route path='food/:id' element={<FoodDetails />} />
            <Route path='tracking' element={<OrderTracking />} />
            <Route path='group-order' element={<GroupOrder />} />
            <Route path='vendors' element={<Vendors />} />
            <Route path='vendors/:vendorId/menu' element={<MenuPage />} />
            <Route path='payment-verify/:orderId' element={<PaymentVerification />} />
            <Route path='*' element={<Home />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </AppLayout>
  )
}

export default App
