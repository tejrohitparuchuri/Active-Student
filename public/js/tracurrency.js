/**
 * Active Student Portal - Tracurrency Ledger Logic
 */

let currentUser = null;
let userMode = 'Viewer';
let currentEventId = null;
let currentEventData = null;

let rawLedgerDocs = [];

document.addEventListener('DOMContentLoaded', () => {
  currentUser = Auth.requireAuth();
  if (!currentUser) return;

  checkAdmin(currentUser);
  loadLobby();

  // Polling
  setInterval(() => {
    if (currentEventId) {
      refreshEventData();
    } else {
      loadLobby();
    }
  }, 10000);
});

function checkAdmin(user) {
  if (user.email === 'tracurrency@anurag.edu.in' || user.role === 'ledger_admin') {
    enableAdminMode();
    document.getElementById('create-room-btn')?.classList.remove('hidden');
  }
}

function enableAdminMode() {
  userMode = 'Admin';
  const badge = document.getElementById('active-badge');
  if (badge) {
    badge.innerText = 'ADMIN MODE';
    badge.className = 'px-4 py-1 rounded-full text-xs font-bold border border-orange-500 text-orange-500 bg-orange-500/10 block';
  }
  document.getElementById('admin-controls')?.classList.remove('hidden');
}

async function loadLobby() {
  document.getElementById('event-view')?.classList.add('hidden');
  document.getElementById('lobby-view')?.classList.remove('hidden');

  const grid = document.getElementById('events-grid');
  if (!grid) return;

  try {
    const events = await API.getLedgerEvents();
    grid.innerHTML = '';

    if (events.length === 0) {
      grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10">No active financial rooms found. Admins can create one.</p>';
      return;
    }

    events.forEach(d => {
      const createdDate = d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent';

      const card = document.createElement('div');
      card.className = "card-dark p-6 rounded-2xl hover:border-orange-500 transition-colors cursor-pointer group relative overflow-hidden";
      card.onclick = () => window.enterEvent(d.id, d);

      card.innerHTML = `
        <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span class="text-6xl">💰</span>
        </div>
        <h3 class="text-xl font-bold mb-2 z-10 relative group-hover:text-orange-500 transition-colors">${d.fundTitle}</h3>
        <p class="text-xs text-gray-500 mb-4 z-10 relative">Created: ${createdDate}</p>
        
        <div class="flex gap-4 mt-4 text-sm z-10 relative">
            <div>
                <div class="text-[10px] text-gray-500 uppercase font-bold">Initial Budget</div>
                <div class="font-mono text-white">₹${d.fundsGiven ? Number(d.fundsGiven).toLocaleString() : '0'}</div>
            </div>
            ${d.minContribution ? `
            <div>
                <div class="text-[10px] text-gray-500 uppercase font-bold">Min Deposit</div>
                <div class="font-mono text-orange-400">₹${d.minContribution}</div>
            </div>` : ''}
        </div>
        
        <div class="mt-6 pt-4 border-t border-white/5 flex justify-between items-center z-10 relative">
           <span class="text-xs font-bold text-orange-500">View Ledger →</span>
           ${userMode === 'Admin' ? `<button onclick="event.stopPropagation(); window.deleteRoom('${d.id}')" class="text-xs text-red-500 hover:text-red-400 px-2 py-1">Delete</button>` : ''}
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading events lobby:", err);
  }
}

window.enterEvent = async function (id, data) {
  currentEventId = id;
  currentEventData = data;

  document.getElementById('lobby-view')?.classList.add('hidden');
  document.getElementById('event-view')?.classList.remove('hidden');

  document.getElementById('fund-title-display').innerText = data.fundTitle;
  document.getElementById('live-balance').innerText = "Loading...";

  if (document.getElementById('fund-title-input')) {
    document.getElementById('fund-title-input').value = data.fundTitle;
    document.getElementById('min-amount').value = data.minContribution || '';
    document.getElementById('fixed-amount').value = data.fixedContribution || '';
  }

  await refreshEventData();
};

window.exitEvent = function () {
  currentEventId = null;
  currentEventData = null;
  loadLobby();
};

async function refreshEventData() {
  if (!currentEventId) return;

  try {
    currentEventData = await API.getLedgerEvent(currentEventId);
    document.getElementById('fund-title-display').innerText = currentEventData.fundTitle;

    const txs = await API.getTransactions(currentEventId);
    rawLedgerDocs = txs || [];

    const allCredits = rawLedgerDocs.filter(d => d.type === 'credit').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const allDebits = rawLedgerDocs.filter(d => d.type === 'debit').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    renderLists(allCredits, allDebits);
    updateLiveBalance(allCredits, allDebits);
  } catch (err) {
    console.error("Error fetching event transactions:", err);
  }
}

function renderLists(credits, debits) {
  const creditList = document.getElementById('credit-list');
  const debitList = document.getElementById('debit-list');
  if (!creditList || !debitList) return;

  creditList.innerHTML = '';
  debitList.innerHTML = '';

  credits.forEach(item => {
    creditList.innerHTML += `
      <tr class="border-b border-zinc-800/50">
          <td class="py-3">
              <div class="font-semibold text-white">${item.contributor || item.userName || 'Anonymous'}</div>
              <div class="text-xs text-gray-500">${formatDate(item.timestamp)}</div>
          </td>
          <td class="py-3 text-right font-mono text-green-500">
              +₹${item.amount}
          </td>
      </tr>`;
  });

  debits.forEach(item => {
    debitList.innerHTML += `
      <tr class="border-b border-zinc-800/50">
          <td class="py-3">
              <div class="text-xs text-gray-500">${formatDate(item.timestamp)}</div>
              <div class="font-semibold text-white">${item.purpose || item.title || item.desc}</div>
              <div class="text-[10px] text-gray-600">by ${item.contributor || 'Admin'}</div>
          </td>
          <td class="py-3 text-right font-mono text-red-500">
              -₹${item.amount}
          </td>
      </tr>`;
  });
}

function updateLiveBalance(credits, debits) {
  if (!currentEventData) return;

  const initial = parseFloat(currentEventData.fundsGiven || 0);
  let totalCredits = 0;
  let totalDebits = 0;

  credits.forEach(c => totalCredits += parseFloat(c.amount));
  debits.forEach(d => totalDebits += parseFloat(d.amount));

  const live = initial + totalCredits - totalDebits;

  document.getElementById('live-balance').innerText = live.toLocaleString();
  const collectedEl = document.getElementById('total-collected');
  if (collectedEl) collectedEl.innerText = totalCredits.toLocaleString();
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-GB');
}

window.openCreateRoomModal = () => {
  document.getElementById('create-room-modal')?.classList.remove('hidden');
};

window.closeCreateRoomModal = () => {
  document.getElementById('create-room-modal')?.classList.add('hidden');
};

window.createNewRoom = async function () {
  const name = document.getElementById('new-room-name').value.trim();
  const budget = document.getElementById('new-room-budget').value;
  const min = document.getElementById('new-room-min').value;
  const fixed = document.getElementById('new-room-fixed').value;

  if (!name) return alert("Room Name is required");

  try {
    await API.createLedgerEvent({
      fundTitle: name,
      fundsGiven: budget ? parseFloat(budget) : 0,
      minContribution: min ? parseFloat(min) : 0,
      fixedContribution: fixed ? parseFloat(fixed) : 0
    });
    window.closeCreateRoomModal();
    await loadLobby();
  } catch (e) {
    alert("Error creating room: " + e.message);
  }
};

window.deleteRoom = async function (id) {
  if (!confirm("Are you sure you want to delete this room and all associated transactions?")) return;
  try {
    await API.deleteLedgerEvent(id);
    await loadLobby();
  } catch (e) {
    alert("Delete failed: " + e.message);
  }
};

window.saveSettings = async function () {
  if (!currentEventId) return;

  const name = document.getElementById('fund-title-input').value.trim();
  const min = document.getElementById('min-amount').value;
  const fixed = document.getElementById('fixed-amount').value;

  try {
    await API.updateLedgerEvent(currentEventId, {
      fundTitle: name,
      minContribution: min ? parseFloat(min) : 0,
      fixedContribution: fixed ? parseFloat(fixed) : 0
    });
    alert("Settings updated!");
    await refreshEventData();
  } catch (e) {
    alert("Update failed: " + e.message);
  }
};

window.processPayment = async function () {
  if (!currentEventId) return alert("No active room selected.");

  const mode = document.getElementById('pay-mode').value;
  const details = document.getElementById('pay-details').value.trim();
  const amount = parseFloat(document.getElementById('pay-amount').value);
  const purpose = document.getElementById('pay-purpose').value.trim();

  if (!amount || amount <= 0) return alert("Enter a valid amount.");
  if (!purpose) return alert("Enter purpose.");

  try {
    await API.addTransaction({
      eventId: currentEventId,
      type: 'debit',
      title: purpose,
      contributor: currentUser ? currentUser.fullName : 'Admin',
      amount: amount,
      purpose: `${purpose} (${mode}: ${details || 'N/A'})`
    });

    document.getElementById('pay-amount').value = '';
    document.getElementById('pay-purpose').value = '';
    document.getElementById('pay-details').value = '';

    alert("Transfer logged successfully!");
    await refreshEventData();
  } catch (e) {
    alert("Failed: " + e.message);
  }
};

