const store = require('../data/store');

exports.getMenu = (req, res) => {
  res.json(store.getMenu());
};

exports.addMenuItem = (req, res) => {
  try {
    const item = store.addMenuItem(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMenuItem = (req, res) => {
  try {
    const updated = store.updateMenuItem(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMenuItem = (req, res) => {
  const ok = store.deleteMenuItem(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Item not found' });
  res.json({ success: true });
};

exports.getOrders = (req, res) => {
  const { userId, status } = req.query;
  const filter = {};
  if (userId) filter.userId = userId;
  if (status) {
    filter.status = status.includes(',') ? status.split(',') : status;
  }
  const orders = store.getOrders(filter);
  res.json(orders);
};

exports.createOrder = (req, res) => {
  try {
    const { items, userId, userName, userEmail } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain items' });
    }
    const order = store.createOrder({
      items,
      userId,
      userName: userName || 'Student',
      userEmail: userEmail || '',
      totalAmount: items.reduce((sum, i) => sum + (i.price * i.qty), 0) * 1.05
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateOrderStatus = (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  const updated = store.updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
};

exports.getCart = (req, res) => {
  const userId = req.query.userId || req.headers['x-user-id'];
  if (!userId) return res.json({ items: [] });
  res.json({ items: store.getUserCart(userId) });
};

exports.saveCart = (req, res) => {
  const userId = req.body.userId || req.headers['x-user-id'];
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const items = store.saveUserCart(userId, req.body.items || []);
  res.json({ items });
};

exports.getStats = (req, res) => {
  const orders = store.getOrders();
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'picked_up' || o.status === 'completed').length;
  res.json({
    totalOrders: orders.length,
    totalRevenue,
    pendingOrders,
    completedOrders
  });
};

