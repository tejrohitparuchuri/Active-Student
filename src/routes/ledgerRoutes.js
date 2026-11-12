const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');

router.get('/events', ledgerController.getEvents);
router.get('/events/:id', ledgerController.getEvent);
router.post('/events', ledgerController.createEvent);
router.patch('/events/:id', ledgerController.updateEvent);
router.delete('/events/:id', ledgerController.deleteEvent);

router.get('/transactions', ledgerController.getTransactions);
router.post('/transactions', ledgerController.addTransaction);

module.exports = router;

