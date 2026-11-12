const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./src/routes/authRoutes');
const canteenRoutes = require('./src/routes/canteenRoutes');
const votingRoutes = require('./src/routes/votingRoutes');
const ledgerRoutes = require('./src/routes/ledgerRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/canteen', canteenRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/ledger', ledgerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback to index.html for root if needed
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Active Student Portal server running at http://localhost:${PORT}`);
});

