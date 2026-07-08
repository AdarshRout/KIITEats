import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import "../components/dashboard.css";
import AdminAnalytics from "./AdminAnalytics";
import AdminReviews from "./AdminReviews";

const API_BASE = import.meta.env.VITE_API_URL || "";

const users = [
  { id: 1, name: "Abhi Ray", email: "abhi@kiit.ac.in", status: "Active" },
  { id: 2, name: "Riya Das", email: "riya@kiit.ac.in", status: "Active" },
  { id: 3, name: "Aman Jain", email: "aman@kiit.ac.in", status: "Blocked" },
];



const TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "reviews", label: "Reviews & Feedback", icon: "💬" },
  { id: "management", label: "Management", icon: "⚙️" },
];

export default function AdminApp() {
  const [activeTab, setActiveTab] = useState("overview");
  const [backendVendors, setBackendVendors] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/vendors/`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setBackendVendors(data); })
      .catch(console.error);
  }, []);

  const vendorNames = backendVendors.map(v => v.name);

  const adminTabs = [
    { id: "overview", label: "Overview", icon: "📊", onClick: () => setActiveTab("overview"), active: activeTab === "overview" },
    { id: "reviews", label: "Reviews & Feedback", icon: "⭐", onClick: () => setActiveTab("reviews"), active: activeTab === "reviews" },
    { id: "management", label: "Management", icon: "👥", onClick: () => setActiveTab("management"), active: activeTab === "management" },
  ];

  return (
    <AppLayout tabLinks={adminTabs}>
      <div className="admin-dashboard-wrapper">
        {/* Header without Tab Navbar (now in top nav) */}
        <div className="admin-dashboard-header">
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Review all platform activity, manage access, and monitor order flow.</p>
        </div>

        {/* Tab Content */}
        <div className="admin-tab-content">
          {activeTab === "overview" && (
            <>
              <section className="stats-grid">
                <div className="stat-card section-card">
                  <span>Users</span>
                  <strong>1,248</strong>
                </div>
                <div className="stat-card section-card">
                  <span>Vendors</span>
                  <strong>38</strong>
                </div>
                <div className="stat-card section-card">
                  <span>Orders today</span>
                  <strong>426</strong>
                </div>
              </section>
              <AdminAnalytics vendors={backendVendors} />
            </>
          )}

          {activeTab === "reviews" && <AdminReviews vendorNames={vendorNames} />}

          {activeTab === "management" && (
            <div className="module-grid">
              <section className="panel section-card">
                <h2>Manage Users</h2>
                <p className="panel-subtitle">View and control user accounts.</p>
                <table className="table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td><span className={`status-dot ${user.status.toLowerCase()}`}>{user.status}</span></td>
                        <td><button className="secondary-btn">Manage</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="panel section-card">
                <h2>Manage Vendors</h2>
                <p className="panel-subtitle">Approve or review vendor activity.</p>
                <div className="list-stack">
                  {backendVendors.length === 0 ? (
                    <p className="muted">No vendors found in database.</p>
                  ) : (
                    backendVendors.map((vendor) => (
                      <div key={vendor._id || vendor.id} className="list-card">
                        <div>
                          <strong>{vendor.name}</strong>
                          <p>{vendor.location || 'N/A'}</p>
                          <div className="tag-row">
                            <span className="tag">{vendor.is_open ? 'Open' : 'Closed'}</span>
                          </div>
                        </div>
                        <div className="card-actions">
                          <button className="secondary-btn">Approve</button>
                          <button className="warning-btn">Suspend</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
