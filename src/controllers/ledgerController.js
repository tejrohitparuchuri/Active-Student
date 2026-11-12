const store = require('../data/store');

exports.getEvents = (req, res) => {
  res.json(store.getEvents());
};

exports.getEvent = (req, res) => {
  const event = store.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
};

exports.createEvent = (req, res) => {
  try {
    const { fundTitle, fundsGiven, minContribution, fixedContribution } = req.body;
    if (!fundTitle) {
      return res.status(400).json({ error: 'fundTitle is required' });
    }

    const event = store.createEvent({
      fundTitle,
      fundsGiven: Number(fundsGiven) || 0,
      minContribution: Number(minContribution) || 0,
      fixedContribution: Number(fixedContribution) || 0
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEvent = (req, res) => {
  try {
    const event = store.getEvent(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    Object.assign(event, req.body);
    store.saveData();
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteEvent = (req, res) => {
  const ok = store.deleteEvent(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Event not found' });
  res.json({ success: true });
};

exports.getTransactions = (req, res) => {
  const { eventId } = req.query;
  const txs = store.getLedger(eventId);
  res.json(txs);
};

exports.addTransaction = (req, res) => {
  try {
    const { eventId, type, title, contributor, amount, note, purpose } = req.body;
    if (!type || !amount) {
      return res.status(400).json({ error: 'type and amount are required' });
    }

    const tx = store.addTransaction({
      eventId: eventId || 'general',
      type, // 'credit' or 'debit'
      title: title || (type === 'credit' ? 'Contribution' : 'Expenditure'),
      contributor: contributor || 'Anonymous',
      amount: Number(amount),
      note: note || '',
      purpose: purpose || ''
    });

    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

