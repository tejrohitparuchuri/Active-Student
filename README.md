# 🎓 Active Student Portal

> **Unified Digital Campus Platform for Anurag University**  
> A complete full-stack Node.js & JavaScript application featuring Campus Elections & Voting, Online Canteen with Barcode Verification, and Tracurrency Financial Ledger.

---

## 🚀 Key Features

### 🗳️ 1. Campus Voting & Elections
* **Public & Private Polls**: Create university-wide elections or batch-specific private rooms protected by secret access keys.
* **Instant Vote Counting & Live Bars**: Real-time result visualization with animated percentage bars.
* **Voter Integrity**: Prevents duplicate voting using institutional roll numbers and account IDs.
* **Admin Control Center**: Start, pause, or end elections and manage candidates and manifestos.

### 🍔 2. Online Canteen Ordering
* **Interactive Menu**: Category filtering for Veg, Non-Veg, and Essentials with live stock counts.
* **Live Orders Queue**: Real-time status tracking (`Pending` ➔ `Ready` ➔ `Picked Up`).
* **Digital Barcode Receipts**: Instant Code128 barcode generation for queue-less verification at food counters.
* **Performance Analytics**: Revenue metrics, average ticket size, and Chart.js pie chart breakdown of best-selling dishes.

### 📊 3. Tracurrency Ledger
* **Financial Event Rooms**: Manage funds for fests, hackathons, and departmental budgets.
* **Double-Entry Ledger**: Transparent tracking of incoming contributions and outgoing expenditures.
* **Live Balance Engine**: Automatically computes real-time liquidity and reserve balances.
* **Direct Campus UPI**: Integrated dynamic UPI QR code generator for student deposits.

---

## 📁 Project Structure

```text
activestudent/
├── package.json               # Node.js project manifest & dependencies
├── server.js                  # Express backend server entry point
├── .gitignore                 # Standard git ignore rules (node_modules, logs)
├── .gitattributes             # GitHub Linguist language detection rules
├── src/
│   ├── controllers/           # Express route controllers
│   │   ├── authController.js
│   │   ├── canteenController.js
│   │   ├── votingController.js
│   │   └── ledgerController.js
│   ├── routes/                # Modular REST API routes
│   │   ├── authRoutes.js
│   │   ├── canteenRoutes.js
│   │   ├── votingRoutes.js
│   │   └── ledgerRoutes.js
│   └── data/
│       ├── store.js           # File-backed JSON data store engine
│       └── initialData.json   # Seed data for Anurag University
└── public/                    # Client-side static assets
    ├── css/                   # Dedicated stylesheets
    │   ├── hub.css
    │   ├── auth.css
    │   ├── voting.css
    │   ├── canteen.css
    │   └── tracurrency.css
    ├── js/                    # Modular client JavaScript
    │   ├── api.js             # Centralized fetch API client
    │   ├── auth.js            # Authentication state manager
    │   ├── auth-pages.js      # Login and signup form logic
    │   ├── hub.js             # Portal home page live counters
    │   ├── voting.js          # Voting system client logic
    │   ├── student-canteen.js # Student food ordering & cart logic
    │   ├── admin-canteen.js   # Canteen operator dashboard & barcode scanner
    │   └── tracurrency.js     # Financial rooms & ledger logic
    ├── index.html             # Active Student Main Hub
    ├── login.html             # Login portal (@anurag.edu.in)
    ├── register.html          # Student account registration
    ├── home.html              # Campus Voting portal
    ├── student_canteen.html   # Canteen student food ordering
    ├── admin_canteen.html     # Canteen management & verification
    └── tracurrency.html       # Financial dashboard & transactions
```

---

## 🛠️ Getting Started

### 1. Installation
Clone this repository and install dependencies:
```bash
npm install
```

### 2. Start the Server
Run the application locally:
```bash
npm start
```
For development with auto-reload:
```bash
npm run dev
```

Visit the application in your browser:
👉 **`http://localhost:3000`**

---

## 🔑 Default Accounts

| Role | Email | Password | Destination |
| :--- | :--- | :--- | :--- |
| **Canteen Admin** | `canteen@anurag.edu.in` | `password123` | Canteen Control Center |
| **Voting Commissioner** | `voting@anurag.edu.in` | `password123` | Election Admin Center |
| **Finance Secretary** | `tracurrency@anurag.edu.in` | `password123` | Tracurrency Ledger Admin |
| **Student** | `student@anurag.edu.in` | `password123` | Student Dashboard Hub |

> *Any email ending in `@anurag.edu.in` can register or sign in.*

---

## 📜 License
MIT License • Developed for Anurag University
