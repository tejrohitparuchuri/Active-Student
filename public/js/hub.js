/**
 * Active Student Portal - Hub / Index Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = Auth.getUser();
  Auth.initHeaderUI();

  // Navigation router with role enforcement
  window.navigate = function (e, url) {
    if (e) e.preventDefault();
    const user = Auth.getUser();

    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    if (url.includes('canteen') && user.email === 'canteen@anurag.edu.in') {
      window.location.href = 'admin_canteen.html';
      return;
    }

    if (url.includes('tracurrency') && user.email === 'tracurrency@anurag.edu.in') {
      window.location.href = 'tracurrency.html';
      return;
    }

    if (user.email === 'voting@anurag.edu.in') {
      window.location.href = 'home.html';
      return;
    }

    window.location.href = url;
  };

  // --- 1. LIVE VOTING STATUS ---
  async function fetchVotingStatus() {
    const statusEl = document.getElementById('voting-status');
    if (!statusEl) return;

    try {
      const elections = await API.getElections();
      const activeElections = elections.filter(e => e.status === 'active');
      const count = activeElections.length;

      if (count > 0) {
        statusEl.innerHTML = `<span style="color:#4CAF50">● LIVE NOW (${count})</span>`;
        statusEl.title = `${count} Active Election(s)`;
      } else {
        statusEl.innerText = "No Active Polls";
      }
    } catch (err) {
      statusEl.innerText = "Ready";
    }
  }

  // --- 2. LIVE TRACURRENCY BALANCE ---
  async function fetchTracurrencyBalance() {
    const balanceEl = document.getElementById('ledger-balance');
    if (!balanceEl) return;

    try {
      const txs = await API.getTransactions();
      let balance = 45250; // Base baseline
      txs.forEach(tx => {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'debit') balance -= amt;
        if (tx.type === 'credit') balance += amt;
      });
      balanceEl.innerText = "₹" + balance.toLocaleString();
      balanceEl.style.color = "#ff9a2c";
    } catch (err) {
      balanceEl.innerText = "₹45,250";
    }
  }

  fetchVotingStatus();
  fetchTracurrencyBalance();

  // Polling for live status updates every 10 seconds
  setInterval(() => {
    fetchVotingStatus();
    fetchTracurrencyBalance();
  }, 10000);
});

