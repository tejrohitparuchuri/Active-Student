const express = require('express');
const router = express.Router();
const canteenController = require('../controllers/canteenController');

// Menu
router.get('/menu', canteenController.getMenu);
router.post('/menu', canteenController.addMenuItem);
router.patch('/menu/:id', canteenController.updateMenuItem);
router.delete('/menu/:id', canteenController.deleteMenuItem);

// Orders
router.get('/orders', canteenController.getOrders);
router.post('/orders', canteenController.createOrder);
router.patch('/orders/:id/status', canteenController.updateOrderStatus);

// Cart
router.get('/cart', canteenController.getCart);
router.post('/cart', canteenController.saveCart);

// Stats
router.get('/stats', canteenController.getStats);

module.exports = router;

