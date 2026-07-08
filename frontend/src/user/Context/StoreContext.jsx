import { useEffect, useMemo, useState } from "react";
import PropTypes from 'prop-types';
import { StoreContext } from "./StoreContext";
import { menu_list, fc_images } from "../assets/assets";
import api from "../../vendor/apiClient";
const getSlots = () => [
  "10:30 AM - 10:45 AM",
  "11:00 AM - 11:15 AM",
  "11:30 AM - 11:45 AM",
  "12:00 PM - 12:15 PM",
  "12:30 PM - 12:45 PM",
  "01:00 PM - 01:15 PM",
  "01:30 PM - 01:45 PM",
  "02:00 PM - 02:15 PM",
  "06:00 PM - 06:15 PM",
  "06:30 PM - 06:45 PM",
];

const haversineDistanceKm = (start, end) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(end.lat - start.lat);
  const dLng = toRad(end.lng - start.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(start.lat)) *
      Math.cos(toRad(end.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const initialUser = () => {
  const savedUser = localStorage.getItem("kiitUser");
  return savedUser ? JSON.parse(savedUser) : null;
};

const StoreContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(initialUser);

  // Helper: scope localStorage keys by user email
  const userKey = (key) => {
    const uid = currentUser?.email || '__guest__';
    return `${uid}_${key}`;
  };

  const [cartItems, setCartItems] = useState(() => {
    const uid = initialUser()?.email || '__guest__';
    const saved = localStorage.getItem(`${uid}_cartItems`);
    return saved ? JSON.parse(saved) : {};
  });
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [vegOnly, setVegOnly] = useState(() => localStorage.getItem("vegOnly") === "true");
  const [orders, setOrders] = useState(() => {
    const uid = initialUser()?.email || '__guest__';
    const saved = localStorage.getItem(`${uid}_orders`);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map(o => ({
        ...o,
        vendors: Array.isArray(o.vendors) ? o.vendors : ["Vendor"],
        items: Array.isArray(o.items) ? o.items : [],
        total: o.total || 0,
      })) : [];
    } catch { return []; }
  });
  const [activeOrderId, setActiveOrderId] = useState(() => {
    const uid = initialUser()?.email || '__guest__';
    return localStorage.getItem(`${uid}_activeOrderId`) || "";
  });
  const [favorites, setFavorites] = useState(() => {
    const uid = initialUser()?.email || '__guest__';
    const saved = localStorage.getItem(`${uid}_favoriteItems`);
    return saved ? JSON.parse(saved) : [];
  });
  const [backendVendors, setBackendVendors] = useState([]);
  const [backendFoods, setBackendFoods] = useState([]);

  const fetchCatalog = () => {
    api.get("/vendors/")
      .then((data) => {
        if (Array.isArray(data)) {
          setBackendVendors(data.filter((v) => v.is_active !== false));
        }
      })
      .catch((err) => console.error("Failed to fetch vendors:", err));

    api.get("/foods/")
      .then((data) => {
        if (Array.isArray(data)) setBackendFoods(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchCatalog();
    const intervalId = setInterval(fetchCatalog, 15000);
    return () => clearInterval(intervalId);
  }, []);

  // Exact GPS coordinates and Google Maps links for each food court
  const VENDOR_COORDS = {
    'central canteen 1': { lat: 20.3529875, lng: 85.8173187, link: 'https://maps.app.goo.gl/ESavZfLXTQevtU2b7' },
    'food court 1': { lat: 20.3527679, lng: 85.8193125, link: 'https://maps.app.goo.gl/joRk5vjvbeQgiwxb7' },
    'food court 2': { lat: 20.352305, lng: 85.8194512, link: 'https://maps.app.goo.gl/9hMKN7rTV3tE6Hrz8' },
    'food court 9': { lat: 20.3494194, lng: 85.8196628, link: 'https://maps.app.goo.gl/xotHJ6UnzzoZYvQ26' },
    'food court 7': { lat: 20.3489153, lng: 85.8154408, link: 'https://maps.app.goo.gl/CPxvWBQHr4emdLQK7' },
    'food court 4': { lat: 20.3508529, lng: 85.8157024, link: 'https://maps.app.goo.gl/NMKYn2JHsjf6gVsd8' },
    'food court 10': { lat: 20.3511719, lng: 85.8141807, link: 'https://maps.app.goo.gl/DaeD76yCCaBxezbS6' },
    'campus 25': { lat: 20.3643734, lng: 85.8170037, link: 'https://maps.app.goo.gl/RiiXnFW3bGcXY5Hn7' },
    'kiit kafe': { lat: 20.3643734, lng: 85.8170037, link: 'https://maps.app.goo.gl/RiiXnFW3bGcXY5Hn7' },
    'campus 13': { lat: 20.3567664, lng: 85.8186863, link: 'https://maps.app.goo.gl/eVccAYrJ5qrGH7EF6' },
    'food court 8': { lat: 20.3571898, lng: 85.817335, link: 'https://maps.app.goo.gl/4C2Xnbv8UCHeYrRe9' },
  };

  const getVendorLocationData = (vendorName) => {
    const nameLower = vendorName.toLowerCase();
    for (const [key, data] of Object.entries(VENDOR_COORDS)) {
      if (nameLower.includes(key)) return data;
    }
    return null;
  };

  const foodCourts = useMemo(() => {
    return backendVendors.map((v, index) => {
      let fcNum = (index % 8) + 1;
      const match = v.name.match(/Court\s+(\d+)/i) || v.name.match(/Canteen\s+(\d+)/i);
      if (match) {
        fcNum = parseInt(match[1]);
        if (fcNum > 8) fcNum = (fcNum % 8) || 8;
      }
      const fallbackImg = fc_images[`fc_${fcNum}`] || fc_images.fc_1;
      const locationData = getVendorLocationData(v.name);
      return {
      id: v.id || v._id,
      name: v.name,
      shortName: v.name.substring(0, 4).toUpperCase(),
      rating: 4.5,
      eta: "10-15 min",
      specialty: v.description || "Campus Vendor",
      category: "All courts", 
      tags: ["Meals"],
      status: v.is_active ? "Open" : "Closed",
      isClosingSoon: false,
      image: (v.images && v.images.length > 0) ? v.images[0] : fallbackImg,
      coords: locationData ? { lat: locationData.lat, lng: locationData.lng } : { lat: v.lat || 20.35, lng: v.lng || 85.82 },
      mapsLink: locationData ? locationData.link : null,
      serves: ["Meals", "Fast Food"],
      hours: "9:00 AM - 10:00 PM"
    };
  });
}, [backendVendors]);

  const food_list = useMemo(() => {
    return backendFoods.filter(f => f.available !== false).map(f => {
      const vendor = backendVendors.find(v => (v.id || v._id) === f.vendor_id);
      return {
        food_id: String(f.id || f._id),
        food_name: f.name,
        food_image: f.image_url || menu_list[0].menu_image,
        food_price: f.price,
        food_desc: f.description || "",
        food_category: f.category || "Other",
        vendor_id: f.vendor_id,
        vendor: { id: f.vendor_id, name: vendor ? vendor.name : "Unknown Vendor", rating: 4.5 },
        rating: 4.5,
        original_price: f.price + 20,
        prep_time: 10,
        delivery_time: 15,
        food_type: /chicken|mutton|fish|egg|meat|prawn|non-veg/i.test(f.name + " " + (f.category || "")) ? "Non-Veg" : "Veg",
        calories: 300,
        protein: "10g",
        best_pair: "Coke",
        stock: f.stock,
        tags: ["Fresh"],
        allergens: "None",
        spice_level: "Mild",
        recommended_for: "Lunch",
      };
    });
  }, [backendFoods, backendVendors]);

  const vendors = useMemo(() => {
    const grouped = new Map();
    food_list.forEach((item) => {
      if (!grouped.has(item.vendor.id)) {
        grouped.set(item.vendor.id, {
          ...item.vendor,
          image: item.food_image,
          categories: new Set([item.food_category]),
          menuCount: 1,
        });
      } else {
        const current = grouped.get(item.vendor.id);
        current.categories.add(item.food_category);
        current.menuCount += 1;
      }
    });

    return Array.from(grouped.values()).map((vendor) => ({
      ...vendor,
      categories: Array.from(vendor.categories),
    }));
  }, [food_list]);

  const groupedCartItems = useMemo(() => {
    const grouped = {};
    Object.entries(cartItems).forEach(([itemId, qty]) => {
      const item = food_list.find((entry) => String(entry.food_id) === String(itemId));
      if (!item || !qty) return;
      const key = item.vendor.name;
      if (!grouped[key]) {
        grouped[key] = { vendor: key, items: [], subtotal: 0 };
      }
      grouped[key].items.push({ ...item, quantity: qty });
      grouped[key].subtotal += qty * item.food_price;
    });
    return Object.values(grouped);
  }, [cartItems, food_list]);

  const activeOrder = useMemo(
    () => orders.find((order) => order.id === activeOrderId) || null,
    [orders, activeOrderId]
  );

  // Persist per-user data with scoped keys
  useEffect(() => {
    localStorage.setItem(userKey("cartItems"), JSON.stringify(cartItems));
  }, [cartItems, currentUser]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("vegOnly", vegOnly);
  }, [vegOnly]);

  useEffect(() => {
    localStorage.setItem(userKey("orders"), JSON.stringify(orders));
  }, [orders, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("kiitUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("kiitUser");
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeOrderId) {
      localStorage.setItem(userKey("activeOrderId"), activeOrderId);
    } else {
      localStorage.removeItem(userKey("activeOrderId"));
    }
  }, [activeOrderId, currentUser]);

  useEffect(() => {
    localStorage.setItem(userKey("favoriteItems"), JSON.stringify(favorites));
  }, [favorites, currentUser]);

  const fetchCart = async () => {
    if (!currentUser) return;
    try {
      const resp = await api.get("/cart/");
      const data = resp.data || resp;
      if (data && Array.isArray(data.items)) {
        const cartObj = {};
        data.items.forEach((item) => {
          cartObj[item.food_id] = item.quantity;
        });
        setCartItems(cartObj);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [currentUser]);

  const addToCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    if (currentUser) {
      try {
        await api.post("/cart/add", { food_id: String(itemId), quantity: 1 });
        fetchCart(); 
      } catch (err) {
        console.error("Failed to explicitly add to cart", err);
        fetchCart();
      }
    }
  };

  const removeFromCart = async (itemId) => {
    const nextQty = Math.max(0, (cartItems[itemId] || 1) - 1);
    setCartItems((prev) => {
      const updated = { ...prev };
      if (nextQty > 0) updated[itemId] = nextQty;
      else delete updated[itemId];
      return updated;
    });
    if (currentUser) {
      try {
        await api.put(`/cart/item/${itemId}`, { quantity: nextQty });
        fetchCart();
      } catch (err) {
        console.error("Failed to remove from cart", err);
        fetchCart();
      }
    }
  };

  const clearCart = async () => {
    setCartItems({});
    if (currentUser) {
      try {
        await api.delete("/cart/");
      } catch (err) {
        console.error("Failed to clear cart", err);
      }
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const itemInfo = food_list.find((product) => String(product.food_id) === String(item));
        if (itemInfo) totalAmount += itemInfo.food_price * cartItems[item];
      }
    }
    return totalAmount;
  };

  const getTotalCartItems = () => Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  const getFoodById = (id) => food_list.find((item) => String(item.food_id) === String(id));

  const getFoodCourtById = (courtId) => foodCourts.find((court) => court.id === courtId) || null;

  const getMenuForCourt = (courtId) => {
    return food_list.filter((item) => item.vendor_id === courtId);
  };

  const getPopularItemsForCourt = (courtId) => getMenuForCourt(courtId)
    .slice()
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  const getNearestFoodCourt = (currentLocation) => {
    if (!currentLocation?.lat || !currentLocation?.lng) return null;

    return foodCourts
      .map((court) => ({
        ...court,
        distanceKm: haversineDistanceKm(currentLocation, court.coords),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0] || null;
  };

  const getFoodCourtsSortedByDistance = (currentLocation) => {
    if (!currentLocation?.lat || !currentLocation?.lng) return foodCourts;
    return foodCourts
      .map((court) => ({ ...court, distanceKm: haversineDistanceKm(currentLocation, court.coords) }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  };

  const getOsrmBulkDistances = async (startLoc, courtsList) => {
    try {
      if (!startLoc?.lat || !startLoc?.lng || courtsList.length === 0) return null;
      // Truncate to avoid URI too long, though OSRM Table API handles 100 coords fine
      const targets = courtsList.slice(0, 50); 
      const coordsString = [startLoc, ...targets.map(c => c.coords)]
        .map(c => `${c.lng},${c.lat}`)
        .join(';');
        
      const url = `https://router.project-osrm.org/table/v1/foot/${coordsString}?sources=0&annotations=distance,duration`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.code === 'Ok' && data.distances && data.distances[0]) {
        const result = {};
        targets.forEach((court, i) => {
          const distM = data.distances[0][i + 1];
          const durS = data.durations[0][i + 1];
          if (distM !== undefined && distM !== null) {
            result[court.id] = {
              distanceKm: distM / 1000,
              walkTime: Math.round(durS / 60)
            };
          }
        });
        return result;
      }
    } catch (err) {
      console.warn('Bulk OSRM Table routing failed', err);
    }
    return null;
  };

  const toggleFavorite = (itemId) => {
    setFavorites((prev) => prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]);
  };

  const isFavorite = (itemId) => favorites.includes(itemId);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  const toggleVegOnly = () => setVegOnly((prev) => !prev);

  const loginUser = (user) => {
    const profile = {
      name: user.name || user.email.split("@")[0],
      email: user.email,
      role: user.role || 'student',
      upi_id: user.upi_id || '',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(profile);
    // Load this user's persisted data
    const uid = profile.email;
    const savedCart = localStorage.getItem(`${uid}_cartItems`);
    setCartItems(savedCart ? JSON.parse(savedCart) : {});
    const savedOrders = localStorage.getItem(`${uid}_orders`);
    setOrders(savedOrders ? JSON.parse(savedOrders) : []);
    const savedFavs = localStorage.getItem(`${uid}_favoriteItems`);
    setFavorites(savedFavs ? JSON.parse(savedFavs) : []);
    setActiveOrderId(localStorage.getItem(`${uid}_activeOrderId`) || "");
    return profile;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setCartItems({});
    setOrders([]);
    setFavorites([]);
    setActiveOrderId("");
  };

  const fetchOrders = async () => {
    if (!currentUser) return;
    try {
      const resp = await api.get("/orders/");
      const data = Array.isArray(resp) ? resp : (resp?.data || resp);
      if (!Array.isArray(data)) return;
      
      const mappedOrders = data.map(o => ({
         id: o.id || o._id,
         createdAt: o.created_at || o.createdAt || new Date().toISOString(),
         status: o.status === "pending" ? "Placed" : 
                 o.status === "preparing" ? "Preparing" :
                 o.status === "ready" ? "Ready" :
                 o.status === "delivered" ? "Completed" : "Cancelled",
         statusStep: o.status === "pending" ? 0 :
                     o.status === "preparing" ? 1 :
                     o.status === "ready" ? 2 :
                     o.status === "delivered" ? 3 : 4,
         customer: o.customer || currentUser,
         items: Array.isArray(o.items) ? o.items.map(i => ({ id: i.food_id, name: i.name, price: i.price, quantity: i.quantity, vendor: "Vendor" })) : [],
         slot: o.scheduled_time ? new Date(o.scheduled_time).toLocaleTimeString() : "Immediate",
         subtotal: o.total_amount || 0,
         total: o.total_amount || 0,
         vendors: Array.isArray(o.vendors) ? o.vendors : ["Vendor"],
         estimatedReadyIn: 18,
         token_number: o.token_number ?? null,
         verification_id: o.verification_id ?? null,
      }));
      setOrders(mappedOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const placeOrder = async (deliveryData, promoCode = '') => {
    const directItems = [];
    let backendVendorId = null;

    food_list.forEach((item) => {
      const qty = cartItems[item.food_id] || 0;
      if (qty > 0) {
        directItems.push({ food_id: item.food_id, quantity: qty });
        if (!backendVendorId) backendVendorId = item.vendor_id;
      }
    });

    if (directItems.length === 0) {
      console.warn("No valid items in cart matched to backend catalog.");
      return null;
    }

    try {
      const resp = await api.post("/orders/", {
        items: directItems,
        vendor_id: backendVendorId,
        scheduled_time: null,
        promo_code: promoCode ? promoCode : undefined
      });
      const orderData = resp.data || resp;

      const vendorName = foodCourts.find((c) => String(c.id) === String(backendVendorId))?.name || "Vendor";
      
      const newOrder = {
        ...orderData,
        id: orderData.id || orderData._id,
        customer: deliveryData,
        statusStep: 1,
        estimatedReadyIn: 18,
        total: orderData.total_amount || 0,
        vendors: [vendorName],
        slot: deliveryData.slot || "Immediate",
        items: orderData.items || directItems,
        token_number: orderData.token_number ?? null,
        verification_id: orderData.verification_id ?? null,
      };

      setOrders((prev) => [newOrder, ...prev]);
      setActiveOrderId(newOrder.id);
      await clearCart();
      return newOrder;
    } catch (err) {
      console.error("Order placement failed:", err);
      alert(err.message || "Failed to place order.");
      return null;
    }
  };

  const updateOrderStatus = (orderId, statusStep, extra = {}) => {
    const statuses = ["Placed", "Preparing", "Ready", "Completed"];
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              statusStep,
              status: statuses[statusStep] || order.status,
              ...(extra.token_number != null ? { token_number: extra.token_number } : {}),
              ...(extra.verification_id != null ? { verification_id: extra.verification_id } : {}),
            }
          : order
      )
    );
    if (statusStep >= 3) setActiveOrderId("");
  };

  const getRecommendedItems = (currentId) => food_list.filter((item) => String(item.food_id) !== String(currentId)).slice(0, 4);

  const contextValue = {
    food_list,
    menu_list,
    vendors,
    foodCourts,
    cartItems,
    favorites,
    groupedCartItems,
    addToCart,
    removeFromCart,
    clearCart,
    getTotalCartAmount,
    getTotalCartItems,
    getFoodById,
    getFoodCourtById,
    getMenuForCourt,
    getPopularItemsForCourt,
    getRecommendedItems,
    getNearestFoodCourt,
    getFoodCourtsSortedByDistance,
    getOsrmBulkDistances,
    toggleFavorite,
    isFavorite,
    placeOrder,
    orders,
    activeOrder,
    activeOrderId,
    updateOrderStatus,
    theme,
    toggleTheme,
    vegOnly,
    toggleVegOnly,
    currentUser,
    loginUser,
    logoutUser,
    pickupSlots: getSlots(),
  };

  return <StoreContext.Provider value={contextValue}>{children}</StoreContext.Provider>;
};

StoreContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default StoreContextProvider;
