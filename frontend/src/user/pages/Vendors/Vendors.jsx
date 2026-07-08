import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StoreContext } from '../../Context/StoreContext.js';
import { MapPin, Navigation, Search, Clock3, Sparkles, ArrowUpRight, Star } from 'lucide-react';
import MapModal from '../../components/MapModal/MapModal';
import './Vendors.css';

const categoryTabs = ['All courts', 'Biryani', 'Fast Food', 'Skills', 'Other'];

const Vendors = () => {
  const { foodCourts, getFoodCourtsSortedByDistance, getOsrmBulkDistances } = useContext(StoreContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All courts');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [osrmMap, setOsrmMap] = useState({});
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showMap, setShowMap] = useState(null);

  useEffect(() => {
    if (currentLocation && foodCourts.length > 0) {
      getOsrmBulkDistances(currentLocation, foodCourts).then(res => {
        if (res) setOsrmMap(res);
      });
    }
  }, [currentLocation, foodCourts, getOsrmBulkDistances]);

  const sortedCourts = useMemo(() => {
    let courts = getFoodCourtsSortedByDistance(currentLocation);
    if (Object.keys(osrmMap).length > 0) {
      courts = courts.map(court => ({
        ...court,
        distanceKm: osrmMap[court.id]?.distanceKm ?? court.distanceKm,
        walkTime: osrmMap[court.id]?.walkTime,
      })).sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return courts;
  }, [getFoodCourtsSortedByDistance, currentLocation, osrmMap]);

  const nearestCourt = currentLocation && sortedCourts.length > 0 ? sortedCourts[0] : null;



  const filteredCourts = useMemo(() => {
    return sortedCourts.filter((court) => {
      const categoryMatch = activeCategory === 'All courts' || court.category === activeCategory;
      const searchText = `${court.name} ${court.specialty} ${court.tags.join(' ')}`.toLowerCase();
      const searchMatch = searchText.includes(searchTerm.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [sortedCourts, activeCategory, searchTerm]);

  const findNearestFoodCourt = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser.');
      return;
    }

    setLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(userPosition);
        setLocating(false);
      },
      () => {
        setLocationError('Unable to fetch your location. Please allow location access.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    findNearestFoodCourt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDistance = (km) => {
    if (!km || km > 100) return null;
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  };

  return (
    <section className="vendors-page">
      {/* ── Page Header ──────────────────────────── */}
      <div className="vendors-hero">
        <div className="vendors-hero-content">
          <span className="vendors-badge">
            <Sparkles size={14} /> Campus food directory
          </span>
          <h1 className="vendors-title">Discover food courts</h1>
          <p className="vendors-subtitle">
            Browse all on-campus food courts. Search by name, filter by category, or find the nearest one.
          </p>
        </div>

        {currentLocation && (
          <div className="vendors-hero-note">
            <Navigation size={14} />
            Sorted by distance
          </div>
        )}
      </div>

      {/* ── Search + Location ────────────────────── */}
      <div className="vendors-toolbar">
        <div className="vendors-search">
          <Search className="vendors-search-icon" size={18} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search food courts, cuisines…"
            aria-label="Search food courts"
            className="vendors-search-input"
          />
        </div>
        <button onClick={findNearestFoodCourt} className="vendors-locate-btn" type="button">
          <Navigation size={16} />
          {locating ? 'Locating…' : 'My location'}
        </button>
      </div>


      {/* ── Nearest Court Banner ──────────────────── */}
      {nearestCourt && (
        <div className="vendors-nearest">
          <div className="vendors-nearest-info">
            <span className="vendors-nearest-label">
              <MapPin size={14} /> Nearest food court
            </span>
            <h3 className="vendors-nearest-name">{nearestCourt.name}</h3>
            <p className="vendors-nearest-desc">
              {formatDistance(nearestCourt.distanceKm)
                ? `About ${formatDistance(nearestCourt.distanceKm)} from you`
                : 'Closest to your current location'}
              {' · '}{nearestCourt.specialty}
            </p>
          </div>
          <div className="vendors-nearest-actions">
            <Link to={`/user/vendors/${nearestCourt.id}/menu`} className="vendors-btn-primary">
              <Sparkles size={15} /> Explore menu
            </Link>
            <button
              onClick={() => setShowMap(nearestCourt)}
              className="vendors-btn-outline"
            >
              Maps <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      )}

      {locationError && <p className="vendors-error">{locationError}</p>}

      {/* ── Vendor Grid ──────────────────────────── */}
      <div className="vendors-grid">
        {filteredCourts.map((court) => (
          <article key={court.id} className="vendor-card">
            <div className="vendor-card-img-wrap">
              <img src={court.image} alt={court.name} className="vendor-card-img" />
              <span className={`vendor-card-status ${court.isClosingSoon ? 'closing' : 'open'}`}>
                {court.status}
              </span>
            </div>

            <div className="vendor-card-body">
              <div className="vendor-card-top">
                <div>
                  <h3 className="vendor-card-name">{court.name}</h3>
                  <p className="vendor-card-specialty">{court.specialty}</p>
                </div>
                <div className="vendor-card-rating">
                  <Star size={14} /> {court.rating}
                </div>
              </div>

              <div className="vendor-card-meta">
                <span><Clock3 size={13} /> {court.eta}</span>
                <span><MapPin size={13} /> KIIT Campus</span>
                {formatDistance(court.distanceKm) && (
                  <span className="vendor-card-distance">{formatDistance(court.distanceKm)}</span>
                )}
              </div>

              <div className="vendor-card-tags">
                {court.tags.map((tag) => (
                  <span key={tag} className="vendor-card-tag">{tag}</span>
                ))}
              </div>

              <div className="vendor-card-actions">
                <Link to={`/user/vendors/${court.id}/menu`} className="vendors-btn-primary">
                  Explore menu
                </Link>
                <button
                  onClick={() => setShowMap(court)}
                  className="vendors-btn-outline"
                >
                  Maps <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredCourts.length === 0 && (
        <div className="vendors-empty">
          <Search size={36} />
          <h3>No food courts found</h3>
          <p>Try adjusting your search or category filter.</p>
        </div>
      )}

      {showMap && (
        <MapModal 
          court={showMap} 
          onClose={() => setShowMap(null)} 
        />
      )}
    </section>
  );
};

export default Vendors;
