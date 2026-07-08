---
title: KiitEats
emoji: 🍔
colorFrom: yellow
colorTo: red
sdk: docker
pinned: false
---

# KiiTEats 🍔 - KIIT's Own Fooding App

**KiiTEats** is a localized food ordering and queue management platform designed specifically for **KIIT University**. It eliminates physical wait times at food courts by allowing students to browse menus, place group orders, pay via UPI, and track their preparation status in real-time.

---

## 🚀 Key Features

### 🎓 For Students
- **Real-time Tracking**: Live preparation status via WebSockets (Placed → Preparing → Ready → Completed).
- **Secure Pickup**: Alphanumeric 4-character Verification IDs to ensure the right person gets the right food.
- **Group Ordering**: Create sessions for your group and split the bill automatically.
- **Scheduled Orders**: Pre-book your meal for a specific time slot (e.g., after your lab ends).

### 👨‍🍳 For Vendors
- **Dynamic Dashboard**: Real-time sales analytics and inventory health monitoring.
- **Queue Management**: Efficiently transition order statuses with one-click actions.
- **Automatic Stock Control**: Inventory levels decrement automatically as orders are placed.
- **Profile Management**: Toggle shop status (Open/Closed) and update UPI/QR credentials.

### ⚙️ For Administrators
- **Global Overview**: Monitor platform performance and vendor sales.
- **Review & Feedback**: AI-powered sentiment analysis on student complaints and reviews.
- **Fraud Prevention**: Manual approval system for edge-case payment verifications.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/) (Vite)
- **Styling**: [Vanilla CSS](https://vanillaframework.io/) (Modern Design System with Dark Mode)
- **Icons**: [Lucide-React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Communication**: WebSockets & Axios

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/) (Motor - Async Driver)
- **Auth**: JWT (JSON Web Tokens) with `python-jose`
- **Analytics**: `scikit-learn` & `TextBlob` for sentiment analysis.
- **Real-time**: FastAPI WebSockets & `broadcast` manager.

- **Verification**: [Google Apps Script](https://www.google.com/script/start/) (Bridging UPI SMS/Emails to the backend for automatic UTR verification)

---

## 🏗 System Architecture & Data Flow

### 1. The Order Flow
1. **Selection**: User adds items to cart (restricted to one vendor per order to simplify pickup).
2. **Placement**: User chooses a pickup slot. Backend generates a unique **Order ID**.
3. **Payment**:
   - App generates a dynamic **UPI Intent Link** and **QR Code**.
   - User submits the **UTR (Transaction ID)**.
   - Status becomes `pending` (verification in progress).
4. **Processing**: 
   - Vendor clicks **Accept** → Status becomes `preparing`.
   - Vendor clicks **Ready** → Status becomes `ready` (User receives notification).
5. **Pickup**: 
   - User shows **Token Number** to vendor.
   - User provides the **OTP**.
   - Vendor enters ID → Order transitions to `delivered`.

### 2. Payment Verification Architecture
- **UTR Submission**: User inputs the 12-digit UTR.
- **Automated Check**: Our custom **Google Apps Script** monitors payment notifications.
- **Status Sync**: Once the script matches the UTR with a received payment, it pings the `/payments/webhook` endpoint to approve the order instantly.

### 3. Real-time Communication
- The **WebSocket Manager** maintains persistent connections for every active order.
- When a vendor updates a status in the database, a broadcast signal is sent to the specific User's tracking page, enabling **instant UI updates** without page refreshes.

---

## 🚦 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas Account

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Activate venv (Windows: venv\Scripts\activate | Unix: source venv/bin/activate)
pip install -r requirements.txt
```

**Configure `.env` in `/backend`**:
```env
MONGO_URI=your_mongodb_atlas_uri
DB_NAME=your_db_name_from_mongo
JWT_SECRET=your_super_secret_key
```

**Run Backend**:
```bash
uvicorn app.main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

**Run Frontend**:
```bash
npm run dev
```

The app uses a proxy (configured in `vite.config.js`) to route API calls and WebSockets to the FastAPI server at `localhost:8000`.

---

## 🔐 Credentials for Demo
| Role | Email | Password |
|---|---|---|
| **Student** | `student@kiit.ac.in` | `pass123` |
| **Vendor** | `vendor@kiitvendor.ac.in` | `pass123` |
| **Admin** | `admin@kiitadmin.ac.in` | `pass123` |

---

## 📜 Development & Scaling
- **Modularity**: The backend follows a router-service-model pattern for high maintainability.
- **Concurrency**: Fully asynchronous database operations using `motor` to handle high-traffic bursts during lunch/dinner hours.
- **Security**: Strict role-based access control (RBAC) on all critical API endpoints.

Developed with ❤️ for the KIIT University community.
