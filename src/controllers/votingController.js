const store = require('../data/store');

exports.getElections = (req, res) => {
  const elections = store.getElections();
  res.json(elections);
};

exports.getElection = (req, res) => {
  const election = store.getElection(req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  res.json(election);
};

exports.createElection = (req, res) => {
  try {
    const { electionTitle, roomType, accessCode, candidates } = req.body;
    if (!electionTitle) {
      return res.status(400).json({ error: 'Election title is required' });
    }

    const election = store.createElection({
      electionTitle,
      roomType: roomType || 'public',
      accessCode: accessCode || '',
      candidates: candidates || []
    });

    res.status(201).json(election);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateElection = (req, res) => {
  try {
    const updated = store.updateElection(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Election not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteElection = (req, res) => {
  const ok = store.deleteElection(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Election not found' });
  res.json({ success: true });
};

exports.castVote = (req, res) => {
  try {
    const { candidateId, userId, voterInfo } = req.body;
    if (!candidateId || !userId) {
      return res.status(400).json({ error: 'candidateId and userId are required' });
    }

    const result = store.vote(req.params.id, candidateId, userId, voterInfo);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.addCandidate = (req, res) => {
  try {
    const election = store.getElection(req.params.id);
    if (!election) return res.status(404).json({ error: 'Election not found' });

    const { name, tagline, manifesto } = req.body;
    if (!name) return res.status(400).json({ error: 'Candidate name is required' });

    const candidate = {
      id: 'cand-' + Date.now(),
      name,
      tagline: tagline || '',
      manifesto: manifesto || '',
      votes: 0
    };

    election.candidates.push(candidate);
    store.saveData();
    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCandidate = (req, res) => {
  try {
    const election = store.getElection(req.params.id);
    if (!election) return res.status(404).json({ error: 'Election not found' });

    const idx = election.candidates.findIndex(c => c.id === req.params.candidateId);
    if (idx === -1) return res.status(404).json({ error: 'Candidate not found' });

    election.candidates.splice(idx, 1);
    store.saveData();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

