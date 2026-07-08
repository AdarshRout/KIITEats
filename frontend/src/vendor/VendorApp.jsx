import { useCallback, useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { StoreContext } from "../user/Context/StoreContext";
import AppLayout from "../components/AppLayout";
import VendorHome from "./components/VendorHome";
import VendorOrders from "./components/VendorOrders";
import VendorEditItem from "./components/VendorEditItem";
import VendorMyItems from "./components/VendorMyItems";
import VendorProfile from "./components/VendorProfile";
import api from "./apiClient";
import "../components/dashboard.css";

export default function VendorApp() {
  const [activeTab, setActiveTab] = useState("Home");
  const { theme, toggleTheme } = useContext(StoreContext);
  const { logout } = useAuth();
  const { logoutUser } = useContext(StoreContext);
  const navigate = useNavigate();

  // Data from backend
  const [vendor, setVendor] = useState(null);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit‑item form state
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "Rolls",
    stock: "",
    description: "",
    image_url: "",
    isAdding: false,
  });

  // Backend returns "_id" (Pydantic alias). Normalize to "id" for frontend use.
  const norm = (obj) => (obj && obj._id ? { ...obj, id: obj._id } : obj);
  const normList = (arr) => (Array.isArray(arr) ? arr.map(norm) : []);

  // ── Fetch helpers ─────────────────────────────────────────
  const fetchVendor = useCallback(async () => {
    try {
      const v = norm(await api.get("/vendors/me"));
      setVendor(v);
      return v;
    } catch {
      setVendor(null);
      return null;
    }
  }, []);

  const fetchItems = useCallback(
    async (vendorId) => {
      try {
        const data = normList(await api.get(`/foods/vendor/${vendorId}`));
        setItems(data);
      } catch {
        setItems([]);
      }
    },
    []
  );

  const fetchOrders = useCallback(async () => {
    try {
      const data = normList(await api.get("/orders/vendor"));
      setOrders(data);
    } catch {
      setOrders([]);
    }
  }, []);

  // ── Initial data load ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      const v = await fetchVendor();
      if (v) {
        await Promise.all([fetchItems(v.id), fetchOrders()]);
      }
      setLoading(false);
    })();
  }, [fetchVendor, fetchItems, fetchOrders]);

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    return {
      totalItems: items.length,
      activeItems: items.filter((i) => i.available).length,
      pendingOrders: orders.filter(
        (o) => o.status !== "delivered" && o.status !== "cancelled"
      ).length,
    };
  }, [items, orders]);

  // ── Item CRUD ─────────────────────────────────────────────
  const submitItem = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || form.stock === "") return;

    const payload = {
      name: form.name,
      price: Number(form.price),
      category: form.category,
      stock: Number(form.stock),
      description: form.description || "",
      image_url: form.image_url || "",
      available: true,
    };

    try {
      if (editingId) {
        await api.put(`/foods/${editingId}`, payload);
        setEditingId(null);
      } else {
        await api.post("/foods/", payload);
      }
      if (vendor) await fetchItems(vendor.id);
      setForm({
        name: "",
        price: "",
        category: "Rolls",
        stock: "",
        description: "",
        image_url: "",
      });
      setActiveTab("Menu");
      setEditingId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const editItem = (item) => {
    setActiveTab("Menu");
    setEditingId(item.id);
    setForm({
      name: item.name,
      price: String(item.price),
      category: item.category,
      stock: String(item.stock),
      description: item.description || "",
      image_url: item.image_url || "",
    });
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await api.del(`/foods/${id}`);
      setItems((curr) => curr.filter((i) => i.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleItem = async (id) => {
    try {
      const updated = await api.patch(`/foods/${id}/toggle`);
      setItems((curr) =>
        curr.map((i) => (i.id === id ? { ...i, available: updated.available } : i))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Order actions ─────────────────────────────────────────
  const handleAcceptOrder = async (id) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: "preparing" });
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReadyOrder = async (id) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: "ready" });
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectOrder = async (id) => {
    if (!window.confirm("Reject this order?")) return;
    try {
      await api.patch(`/orders/${id}/status`, { status: "cancelled" });
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompleteOrder = async (tokenNumber, verificationId) => {
    try {
      await api.post("/payments/verify-delivery", {
        token_number: Number(tokenNumber),
        verification_id: verificationId,
      });
      await fetchOrders();
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  };

  const handleManualApprove = async (id) => {
    if (!window.confirm("Approve payment manually? Make sure you have received the money.")) return;
    try {
      await api.post(`/payments/manual-approve/${id}`);
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Profile ───────────────────────────────────────────────
  const handleSaveProfile = async (updatedProfile) => {
    if (!vendor) return;
    try {
      const payload = {
        name: updatedProfile.shopName,
        location: updatedProfile.location,
        description: updatedProfile.description,
        images: vendor.images || [],
        qr_image_url: updatedProfile.qr_image_url,
        upi_id: updatedProfile.upi_id,
      };
      await api.put(`/vendors/${vendor.id}`, payload);
      await fetchVendor();
      alert("Vendor profile updated successfully!");
    } catch (err) {
      const errorMsg = typeof err.message === "object" ? JSON.stringify(err.message) : err.message;
      alert(`Failed to update profile: ${errorMsg}`);
    }
  };

  const handleToggleStatus = async () => {
    if (!vendor) return;
    try {
      await api.patch(`/vendors/${vendor.id}/toggle`);
      await fetchVendor();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    logoutUser();
    logout();
    navigate("/login", { replace: true });
  };

  const vendorTabs = [
    { id: "Home", label: "Home", icon: "🏠", onClick: () => setActiveTab("Home"), active: activeTab === "Home" },
    { id: "Orders", label: "Orders", icon: "📦", onClick: () => setActiveTab("Orders"), active: activeTab === "Orders" },
    { id: "Menu", label: "Menu", icon: "🍔", onClick: () => setActiveTab("Menu"), active: activeTab === "Menu" },
    { id: "My Profile", label: "My Profile", icon: "👤", onClick: () => setActiveTab("My Profile"), active: activeTab === "My Profile" },
  ];

  if (loading) {
    return (
      <AppLayout tabLinks={vendorTabs}>
        <div className="module-page" style={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)" }}>
            Loading vendor dashboard…
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout tabLinks={vendorTabs}>
      <div className="module-page">

      {activeTab === "Home" && <VendorHome stats={stats} items={items} orders={orders} />}

      {activeTab === "Orders" && (
        <VendorOrders
          orders={orders}
          handleAcceptOrder={handleAcceptOrder}
          handleReadyOrder={handleReadyOrder}
          handleRejectOrder={handleRejectOrder}
          handleCompleteOrder={handleCompleteOrder}
          handleManualApprove={handleManualApprove}
        />
      )}

      {activeTab === "Menu" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Form appears if activeTab is "Menu" AND (editingId exists OR we want to Add) */}
          {(editingId || form.isAdding) && (
             <VendorEditItem
               editingId={editingId}
               form={form}
               setForm={setForm}
               submitItem={submitItem}
               onCancel={() => {
                 setEditingId(null);
                 setForm({ ...form, isAdding: false, name: "", price: "", category: "Rolls", stock: "", description: "", image_url: "" });
               }}
             />
          )}

          <VendorMyItems
            items={items}
            editItem={editItem}
            deleteItem={deleteItem}
            toggleItem={toggleItem}
            onAddNew={() => {
               setEditingId(null);
               setForm({ ...form, isAdding: true, name: "", price: "", category: "Rolls", stock: "", description: "", image_url: "" });
            }}
          />
        </div>
      )}

      {activeTab === "My Profile" && (
        <VendorProfile
          vendor={vendor}
          onSaveProfile={handleSaveProfile}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
    </AppLayout>
  );
}