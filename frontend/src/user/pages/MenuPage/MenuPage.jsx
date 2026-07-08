import { useContext, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Clock3, Flame, Heart, Search,
  Star, Sparkles, Plus, Minus, MapPin,
} from 'lucide-react';
import { StoreContext } from '../../Context/StoreContext.js';
import './MenuPage.css';

const sortOptions = [
  { value: 'popular', label: 'Best rated' },
  { value: 'priceLow', label: 'Price ↑' },
  { value: 'priceHigh', label: 'Price ↓' },
  { value: 'calories', label: 'Calories' },
  { value: 'fastest', label: 'Fastest' },
];

/* ── Detail Modal ──────────────────────────────── */
const DetailModal = ({ item, onClose, onAdd, onRemove, qty, toggleFavorite, isFavorite }) => {
  if (!item) return null;

  return (
    <div className="menu-modal-overlay" onClick={onClose}>
      <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
        <div className="menu-modal-grid">
          {/* Image */}
          <div className="menu-modal-img-wrap">
            <img src={item.food_image} alt={item.food_name} className="menu-modal-img" />
            <button onClick={onClose} className="menu-modal-close">✕</button>
            <div className="menu-modal-img-badges">
              <span className="menu-modal-type-badge">{item.food_type}</span>
              <span className="menu-modal-prep-badge">⏱ {item.prep_time} min</span>
              <span className="menu-modal-rating-badge">★ {item.rating}</span>
            </div>
          </div>

          {/* Details */}
          <div className="menu-modal-body">
            <div className="menu-modal-header">
              <div>
                <p className="menu-modal-label">Item details</p>
                <h2 className="menu-modal-title">{item.food_name}</h2>
                <p className="menu-modal-desc">{item.food_desc}</p>
              </div>
              <button
                onClick={() => toggleFavorite(item.food_id)}
                className={`menu-modal-fav ${isFavorite(item.food_id) ? 'active' : ''}`}
              >
                <Heart size={18} fill={isFavorite(item.food_id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="menu-modal-stats">
              <div className="menu-modal-stat"><span>Price</span><strong>₹{item.food_price}</strong></div>
              <div className="menu-modal-stat"><span>Calories</span><strong>{item.calories} kcal</strong></div>
              <div className="menu-modal-stat"><span>Prep time</span><strong>{item.prep_time} min</strong></div>
              <div className="menu-modal-stat"><span>Delivery</span><strong>{item.delivery_time} min</strong></div>
              <div className="menu-modal-stat"><span>Protein</span><strong>{item.protein}</strong></div>
              <div className="menu-modal-stat"><span>Best pair</span><strong>{item.best_pair}</strong></div>
            </div>

            <div className="menu-modal-tags">
              {item.tags.map((tag) => (
                <span key={tag} className="menu-item-tag">{tag}</span>
              ))}
              <span className="menu-item-allergen">{item.allergens}</span>
            </div>

            <div className="menu-modal-info-bar">
              Great for: <strong>{item.recommended_for}</strong> · Spice level: <strong>{item.spice_level}</strong>
            </div>

            <div className="menu-modal-actions">
              {qty > 0 && (
                <div className="menu-qty-control">
                  <button onClick={() => onRemove(item.food_id)}><Minus size={16} /></button>
                  <span>{qty}</span>
                  <button onClick={() => onAdd(item.food_id)}><Plus size={16} /></button>
                </div>
              )}
              <button onClick={() => onAdd(item.food_id)} className="menu-add-btn">
                {qty ? 'Add one more' : 'Add to cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Menu Page ─────────────────────────────────── */
const MenuPage = () => {
  const { vendorId } = useParams();
  const {
    cartItems, addToCart, removeFromCart,
    getFoodCourtById, getMenuForCourt, getPopularItemsForCourt,
    toggleFavorite, isFavorite,
  } = useContext(StoreContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedItem, setSelectedItem] = useState(null);

  const court = getFoodCourtById(vendorId);
  const menu = useMemo(() => getMenuForCourt(vendorId), [getMenuForCourt, vendorId]);
  const popularItems = useMemo(() => getPopularItemsForCourt(vendorId), [getPopularItemsForCourt, vendorId]);

  const filteredMenu = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const list = menu.filter((item) => {
      const searchBase = `${item.food_name} ${item.food_desc} ${item.food_category} ${item.tags.join(' ')}`.toLowerCase();
      return searchBase.includes(query);
    });

    const sorted = [...list];
    switch (sortBy) {
      case 'priceLow': sorted.sort((a, b) => a.food_price - b.food_price); break;
      case 'priceHigh': sorted.sort((a, b) => b.food_price - a.food_price); break;
      case 'calories': sorted.sort((a, b) => a.calories - b.calories); break;
      case 'fastest': sorted.sort((a, b) => a.prep_time - b.prep_time); break;
      default: sorted.sort((a, b) => b.rating - a.rating); break;
    }
    return sorted;
  }, [menu, searchTerm, sortBy]);

  if (!court) {
    return <div className="menu-not-found">Food court not found.</div>;
  }

  return (
    <section className="menu-page">
      {/* ── Hero ──────────────────────────────── */}
      <div className="menu-hero">
        <div className="menu-hero-bg" style={{ backgroundImage: `url(${court.image})` }} />
        <div className="menu-hero-overlay" />
        <div className="menu-hero-content">
          <Link to="/user/vendors" className="menu-back-btn">
            <ArrowLeft size={16} /> All vendors
          </Link>
          <h1 className="menu-hero-title">{court.name}</h1>
          <p className="menu-hero-desc">{court.specialty}</p>
          <div className="menu-hero-chips">
            <span><Star size={14} /> {court.rating}</span>
            <span><Clock3 size={14} /> {court.eta}</span>
            <span><MapPin size={14} /> {court.hours}</span>
            <span className={`menu-hero-status ${court.isClosingSoon ? 'closing' : 'open'}`}>
              {court.status}
            </span>
          </div>
        </div>
      </div>

      {/* ── Quick Filters ─────────────────────── */}
      <div className="menu-filters-bar">
        <div className="menu-filters-scroll">
          {court.serves.map((category) => (
            <button
              key={category}
              onClick={() => setSearchTerm(searchTerm === category ? '' : category)}
              className={`menu-filter-chip ${searchTerm === category ? 'active' : ''}`}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Grid ──────────────────────── */}
      <div className="menu-content-grid">
        {/* Sidebar: Popular Items */}
        <aside className="menu-sidebar">
          <div className="menu-popular-card">
            <div className="menu-popular-header">
              <div>
                <p className="menu-popular-label"><Sparkles size={14} /> Popular picks</p>
                <h2 className="menu-popular-title">Campus favourites</h2>
              </div>
            </div>
            <div className="menu-popular-list">
              {popularItems.map((item) => (
                <button
                  key={item.food_id}
                  onClick={() => setSelectedItem(item)}
                  className="menu-popular-item"
                  type="button"
                >
                  <img src={item.food_image} alt={item.food_name} className="menu-popular-img" />
                  <div className="menu-popular-info">
                    <p className="menu-popular-name">{item.food_name}</p>
                    <p className="menu-popular-meta">₹{item.food_price} · {item.prep_time} min</p>
                  </div>
                  <span className="menu-popular-rating"><Star size={12} /> {item.rating}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main: Menu Items */}
        <div className="menu-main">
          {/* Search + Sort Bar */}
          <div className="menu-toolbar">
            <div className="menu-search">
              <Search className="menu-search-icon" size={17} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search dishes, cuisines…"
                className="menu-search-input"
              />
            </div>
            <div className="menu-sort">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="menu-sort-select">
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="menu-result-count">{filteredMenu.length} items</p>

          {/* Item List */}
          <div className="menu-items-list">
            {filteredMenu.map((item) => {
              const qty = cartItems[item.food_id] || 0;
              const favorite = isFavorite(item.food_id);

              return (
                <article key={item.food_id} className="menu-item-card">
                  <div className="menu-item-img-wrap">
                    <img src={item.food_image} alt={item.food_name} className="menu-item-img" />
                    <button
                      onClick={() => toggleFavorite(item.food_id)}
                      className={`menu-item-fav ${favorite ? 'active' : ''}`}
                    >
                      <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="menu-item-body">
                    <div className="menu-item-top">
                      <div>
                        <div className="menu-item-badges">
                          <span className="menu-item-type">{item.food_type}</span>
                          <span className="menu-item-category">{item.food_category}</span>
                        </div>
                        <h3 className="menu-item-name">{item.food_name}</h3>
                        <p className="menu-item-desc">{item.food_desc}</p>
                      </div>
                      <div className="menu-item-rating"><Star size={13} /> {item.rating}</div>
                    </div>

                    <div className="menu-item-meta">
                      <span className="menu-item-price">₹{item.food_price}</span>
                      <span><Flame size={13} /> {item.calories} kcal</span>
                      <span><Clock3 size={13} /> {item.prep_time} min</span>
                    </div>

                    <div className="menu-item-bottom">
                      <button onClick={() => setSelectedItem(item)} className="menu-detail-btn" type="button">
                        View details
                      </button>

                      {qty > 0 ? (
                        <div className="menu-qty-control">
                          <button onClick={() => removeFromCart(item.food_id)}><Minus size={15} /></button>
                          <span>{qty}</span>
                          <button onClick={() => addToCart(item.food_id)}><Plus size={15} /></button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(item.food_id)} className="menu-add-btn" type="button">
                          <Plus size={15} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredMenu.length === 0 && (
            <div className="menu-empty">
              <Search size={32} />
              <h3>No items found</h3>
              <p>Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </div>

      <DetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onAdd={addToCart}
        onRemove={removeFromCart}
        qty={selectedItem ? cartItems[selectedItem.food_id] || 0 : 0}
        toggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
      />
    </section>
  );
};

export default MenuPage;
