const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', '..', 'data', 'db.json');
const INITIAL_DATA_FILE = path.join(__dirname, 'initialData.json');

class Store {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to read db.json, falling back to initial data:', err.message);
    }

    try {
      const initialRaw = fs.readFileSync(INITIAL_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(initialRaw);
      this.saveData(parsed);
      return parsed;
    } catch (err) {
      console.error('Failed to load initial seed data:', err.message);
      return {
        users: [],
        canteen_menu: [],
        canteen_orders: [],
        carts: {},
        elections: [],
        tracurrency_events: [],
        ledger: []
      };
    }
  }

  saveData(customData = null) {
    const toSave = customData || this.data;
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db.json:', err.message);
    }
  }

  // --- USERS ---
  findUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  createUser(userData) {
    const user = {
      id: 'usr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      ...userData
    };
    this.data.users.push(user);
    this.saveData();
    return user;
  }

  updateUser(id, updates) {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    this.saveData();
    return this.data.users[index];
  }

  // --- CANTEEN MENU ---
  getMenu() {
    return this.data.canteen_menu;
  }

  getMenuItem(id) {
    return this.data.canteen_menu.find(i => i.id === id);
  }

  addMenuItem(itemData) {
    const item = {
      id: 'item-' + Date.now(),
      ...itemData
    };
    this.data.canteen_menu.push(item);
    this.saveData();
    return item;
  }

  updateMenuItem(id, updates) {
    const idx = this.data.canteen_menu.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.data.canteen_menu[idx] = { ...this.data.canteen_menu[idx], ...updates };
    this.saveData();
    return this.data.canteen_menu[idx];
  }

  deleteMenuItem(id) {
    const idx = this.data.canteen_menu.findIndex(i => i.id === id);
    if (idx === -1) return false;
    this.data.canteen_menu.splice(idx, 1);
    this.saveData();
    return true;
  }

  // --- CANTEEN ORDERS ---
  getOrders(filter = {}) {
    let result = [...this.data.canteen_orders];
    if (filter.userId) {
      result = result.filter(o => o.userId === filter.userId);
    }
    if (filter.status && Array.isArray(filter.status)) {
      result = result.filter(o => filter.status.includes(o.status));
    } else if (filter.status) {
      result = result.filter(o => o.status === filter.status);
    }
    return result;
  }

  createOrder(orderData) {
    // 1. Check stock for each item
    for (const cartItem of orderData.items) {
      const menuItem = this.getMenuItem(cartItem.id);
      if (!menuItem) {
        throw new Error(`Item ${cartItem.name} not found`);
      }
      const stock = menuItem.stock !== undefined ? menuItem.stock : 20;
      if (stock < cartItem.qty) {
        throw new Error(`Insufficient stock for ${cartItem.name} (only ${stock} available)`);
      }
    }

    // 2. Decrement stock
    for (const cartItem of orderData.items) {
      const menuItem = this.getMenuItem(cartItem.id);
      menuItem.stock -= cartItem.qty;
    }

    const orderId = 'ORD-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 1000);
    const order = {
      id: 'order-' + Date.now(),
      orderId: orderId,
      status: 'pending',
      timestamp: new Date().toISOString(),
      barcodeUrl: `https://bwipjs-api.metafloor.com/?bcid=code128&text=${orderId}&scale=3&height=10&incltext=true`,
      ...orderData
    };

    this.data.canteen_orders.push(order);
    this.saveData();
    return order;
  }

  updateOrderStatus(orderIdOrId, status) {
    const order = this.data.canteen_orders.find(o => o.orderId === orderIdOrId || o.id === orderIdOrId);
    if (!order) return null;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    this.saveData();
    return order;
  }

  // --- CARTS ---
  getUserCart(userId) {
    return this.data.carts[userId] || [];
  }

  saveUserCart(userId, items) {
    this.data.carts[userId] = items;
    this.saveData();
    return items;
  }

  // --- ELECTIONS & VOTING ---
  getElections() {
    return this.data.elections;
  }

  getElection(id) {
    return this.data.elections.find(e => e.id === id);
  }

  createElection(electionData) {
    const election = {
      id: 'elec-' + Date.now(),
      status: 'active',
      createdAt: new Date().toISOString(),
      candidates: [],
      voters: [],
      ...electionData
    };
    this.data.elections.push(election);
    this.saveData();
    return election;
  }

  updateElection(id, updates) {
    const idx = this.data.elections.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.data.elections[idx] = { ...this.data.elections[idx], ...updates };
    this.saveData();
    return this.data.elections[idx];
  }

  deleteElection(id) {
    const idx = this.data.elections.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this.data.elections.splice(idx, 1);
    this.saveData();
    return true;
  }

  vote(electionId, candidateId, userId, voterInfo = {}) {
    const election = this.getElection(electionId);
    if (!election) throw new Error('Election not found');
    if (election.status !== 'active') throw new Error('Election is not currently active');

    election.voters = election.voters || [];
    if (election.voters.some(v => v.userId === userId || v.rollNo === voterInfo.rollNo)) {
      throw new Error('You have already cast your vote in this election');
    }

    const candidate = election.candidates.find(c => c.id === candidateId);
    if (!candidate) throw new Error('Candidate not found');

    candidate.votes = (candidate.votes || 0) + 1;
    election.voters.push({
      userId,
      rollNo: voterInfo.rollNo || '',
      votedAt: new Date().toISOString()
    });

    this.saveData();
    return { success: true, election };
  }

  // --- TRACURRENCY / LEDGER ---
  getEvents() {
    return this.data.tracurrency_events;
  }

  getEvent(id) {
    return this.data.tracurrency_events.find(e => e.id === id);
  }

  createEvent(eventData) {
    const evt = {
      id: 'evt-' + Date.now(),
      createdAt: new Date().toISOString(),
      ...eventData
    };
    this.data.tracurrency_events.push(evt);
    this.saveData();
    return evt;
  }

  deleteEvent(id) {
    const idx = this.data.tracurrency_events.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this.data.tracurrency_events.splice(idx, 1);
    this.saveData();
    return true;
  }

  getLedger(eventId = null) {
    if (eventId) {
      return this.data.ledger.filter(l => l.eventId === eventId);
    }
    return this.data.ledger;
  }

  addTransaction(txData) {
    const tx = {
      id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      ...txData
    };
    this.data.ledger.push(tx);
    this.saveData();
    return tx;
  }
}

module.exports = new Store();

