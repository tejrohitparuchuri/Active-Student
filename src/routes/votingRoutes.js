const express = require('express');
const router = express.Router();
const votingController = require('../controllers/votingController');

router.get('/elections', votingController.getElections);
router.get('/elections/:id', votingController.getElection);
router.post('/elections', votingController.createElection);
router.patch('/elections/:id', votingController.updateElection);
router.delete('/elections/:id', votingController.deleteElection);

router.post('/elections/:id/vote', votingController.castVote);
router.post('/elections/:id/candidates', votingController.addCandidate);
router.delete('/elections/:id/candidates/:candidateId', votingController.deleteCandidate);

module.exports = router;

