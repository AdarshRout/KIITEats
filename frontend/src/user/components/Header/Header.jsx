import { useContext } from 'react'
import { StoreContext } from '../../Context/StoreContext.js'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { assets } from '../../assets/assets'
import { ArrowRight, Clock3, Leaf, MapPin, Sparkles, Star } from 'lucide-react'
import './Header.css'

const Header = () => {
  const { vegOnly, currentUser, foodCourts } = useContext(StoreContext)

  return (
    <section className='header'>
      <div className='header-grid'>
        <motion.div
          className='header-hero'
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div
            className='header-hero-bg'
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.5) 60%, transparent 100%), url(${assets.header_img})`,
            }}
          />
          <div className='header-hero-gradient' />

          <div className='header-hero-content'>
            <p className='header-badge'>
              <Sparkles size={14} /> Campus food ordering
            </p>

            <h1 className='header-title'>
              Order from your favourite KIIT food courts.
            </h1>

            <p className='header-desc'>
              Browse nearby food courts, discover menus, save favourites, and add items to cart — all in a cleaner campus-first experience.
            </p>

            <div className='header-tags'>
              <span>{foodCourts.length} food courts live</span>
              <span>{vegOnly ? 'Veg mode ON' : 'Veg + Non-Veg'}</span>
              <span>{currentUser ? `Welcome ${currentUser.name.split(' ')[0]}` : 'Fast campus checkout'}</span>
            </div>

            <div className='header-actions'>
              <Link to='/user/vendors' className='header-primary-btn'>
                Discover vendors <ArrowRight size={18} />
              </Link>
              <a href='#explore-menu' className='header-secondary-btn'>
                Explore popular food
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div
          className='header-cards'
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
        >
          <div className='hero-stat-card'>
            <div className='hero-stat-row'>
              <div>
                <p className='hero-stat-label'>Live convenience</p>
                <h3 className='hero-stat-value'>12–25 min</h3>
                <p className='hero-stat-desc'>Average prep and campus delivery time.</p>
              </div>
              <Clock3 className='hero-stat-icon' size={28} />
            </div>
          </div>

          <div className='hero-stat-card'>
            <div className='hero-stat-row'>
              <div>
                <p className='hero-stat-label'>Student favourite</p>
                <h3 className='hero-stat-value'>4.8★</h3>
                <p className='hero-stat-desc'>Top-rated food courts, reliable prep times.</p>
              </div>
              <Star className='hero-stat-icon' size={28} />
            </div>
          </div>

          <div className='hero-stat-card hero-features'>
            <p className='hero-stat-label'>Why it feels better</p>
            <ul className='hero-features-list'>
              <li><MapPin className='hero-feature-icon' size={16} /> Nearest food courts show up first</li>
              <li><Leaf className='hero-feature-icon' size={16} /> Cleaner menus with search, sorting & favourites</li>
              <li><Sparkles className='hero-feature-icon' size={16} /> Professional design with better readability</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Header
