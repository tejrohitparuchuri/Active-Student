/**
 * Active Student Portal - Campus Voting System Logic
 */

let currentUser = null;
let currentElectionId = null;
let currentElectionData = null;
let allElections = [];

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = Auth.requireAuth();
  if (!currentUser) return;

  const loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.classList.add('hidden');

  const isAdmin = currentUser.email === 'voting@anurag.edu.in' || currentUser.role === 'voting_admin';

  if (isAdmin) {
    document.getElementById('admin-dashboard')?.classList.remove('hidden');
    loadElectionsList();
  } else {
    document.getElementById('dashboard')?.classList.remove('hidden');
    const nameEl = document.getElementById('user-name-display');
    if (nameEl) nameEl.innerText = currentUser.fullName || currentUser.rollNo || 'Student';
    loadActiveElections();
  }
});

// --- USER DASHBOARD NAVIGATION ---
window.openActiveElections = function () {
  document.getElementById('user-dashboard-home')?.classList.add('hidden');
  document.getElementById('user-active-elections-view')?.classList.remove('hidden');
  loadActiveElections();
};

window.closeActiveElections = function () {
  document.getElementById('user-active-elections-view')?.classList.add('hidden');
  document.getElementById('user-dashboard-home')?.classList.remove('hidden');
};

window.openResults = function () {
  document.getElementById('user-dashboard-home')?.classList.add('hidden');
  document.getElementById('user-results-view')?.classList.remove('hidden');
  loadResultsList();
};

window.closeResults = function () {
  document.getElementById('user-results-view')?.classList.add('hidden');
  document.getElementById('user-dashboard-home')?.classList.remove('hidden');
};

window.closeResultDetails = function () {
  document.getElementById('user-results-detail-view')?.classList.add('hidden');
  document.getElementById('user-results-view')?.classList.remove('hidden');
};

// --- USER: LOAD ACTIVE ELECTIONS ---
async function loadActiveElections() {
  const votingArea = document.getElementById('voting-area');
  if (!votingArea) return;

  votingArea.innerHTML = '<p class="text-gray-500">Loading active elections...</p>';

  try {
    const elections = await API.getElections();
    allElections = elections;
    const active = elections.filter(e => e.status === 'active');

    if (active.length === 0) {
      votingArea.innerHTML = `
        <div class="card" style="text-align:center; padding:40px;">
          <h3>No Active Elections</h3>
          <p style="color:var(--text-muted)">There are currently no active polls open for voting.</p>
        </div>
      `;
      return;
    }

    votingArea.innerHTML = '';
    active.forEach(election => {
      const hasVoted = election.voters && election.voters.some(v => v.userId === currentUser.id || v.rollNo === currentUser.rollNo);

      const elecCard = document.createElement('div');
      elecCard.className = 'card';
      elecCard.style.marginBottom = '24px';

      let candidatesHtml = '';
      if (!election.candidates || election.candidates.length === 0) {
        candidatesHtml = '<p style="color:var(--text-muted)">No candidates declared yet.</p>';
      } else {
        candidatesHtml = election.candidates.map(c => `
          <div style="background:var(--bg-input); padding:16px; border-radius:8px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; margin-top:12px">
            <div>
              <h4 style="margin:0; font-size:1.1rem">${c.name}</h4>
              <p style="color:var(--accent); margin:4px 0 0; font-size:0.85rem">${c.tagline || ''}</p>
              ${c.manifesto ? `<p style="color:var(--text-muted); margin:4px 0 0; font-size:0.8rem">${c.manifesto}</p>` : ''}
            </div>
            <div>
              <button class="btn filled" 
                      ${hasVoted ? 'disabled style="opacity:0.5; cursor:not-allowed"' : ''}
                      onclick="window.castVote('${election.id}', '${c.id}', this)">
                ${hasVoted ? 'Voted' : 'Vote'}
              </button>
            </div>
          </div>
        `).join('');
      }

      elecCard.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:12px;">
          <div>
            <h3 style="margin:0">${election.electionTitle || election.name}</h3>
            <span style="color:#4CAF50; font-size:0.8rem; font-weight:bold">● ACTIVE</span>
          </div>
          ${hasVoted ? '<span style="background:rgba(76,175,80,0.2); color:#4CAF50; padding:4px 12px; border-radius:12px; font-size:0.8rem; font-weight:bold">You have cast your vote</span>' : ''}
        </div>
        <div class="candidates-list">
          ${candidatesHtml}
        </div>
      `;

      votingArea.appendChild(elecCard);
    });
  } catch (err) {
    votingArea.innerHTML = `<p style="color:red">Failed to load elections: ${err.message}</p>`;
  }
}

window.castVote = async function (electionId, candidateId, btn) {
  if (!confirm("Are you sure you want to cast your vote? This action is final and cannot be modified.")) return;

  btn.disabled = true;
  btn.innerText = "Voting...";

  try {
    await API.castVote(electionId, candidateId, currentUser.id, {
      rollNo: currentUser.rollNo,
      fullName: currentUser.fullName
    });

    alert("Vote cast successfully! Thank you for participating.");
    loadActiveElections();
  } catch (err) {
    alert("Voting failed: " + err.message);
    btn.disabled = false;
    btn.innerText = "Vote";
  }
};

// --- USER: RESULTS ---
async function loadResultsList() {
  const container = document.getElementById('results-list-area');
  if (!container) return;

  container.innerHTML = '<p class="text-gray-500">Loading results...</p>';

  try {
    const elections = await API.getElections();
    container.innerHTML = '';

    if (elections.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted)">No past elections available.</p>';
      return;
    }

    elections.forEach(e => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cursor = 'pointer';
      card.onclick = () => window.openResultDetails(e.id);

      const totalVotes = (e.candidates || []).reduce((acc, c) => acc + (c.votes || 0), 0);

      card.innerHTML = `
        <h3 style="margin:0 0 8px">${e.electionTitle || e.name}</h3>
        <p style="color:var(--text-muted); font-size:0.85rem; margin:0">Status: <strong style="color:${e.status === 'active' ? '#4CAF50' : '#f44336'}">${e.status.toUpperCase()}</strong></p>
        <p style="color:var(--accent); font-size:0.9rem; margin:8px 0 0">Total Votes: ${totalVotes}</p>
        <span style="font-size:0.8rem; color:var(--text-muted); margin-top:12px; display:inline-block">Click to view results breakdown →</span>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load results: ${err.message}</p>`;
  }
}

window.openResultDetails = async function (id) {
  const detailArea = document.getElementById('results-detail-area');
  document.getElementById('user-results-view')?.classList.add('hidden');
  document.getElementById('user-results-detail-view')?.classList.remove('hidden');

  try {
    const election = await API.getElection(id);
    const totalVotes = (election.candidates || []).reduce((acc, c) => acc + (c.votes || 0), 0);

    let barsHtml = '';
    (election.candidates || []).forEach(c => {
      const pct = totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0;
      barsHtml += `
        <div style="margin-top:16px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <strong style="color:white">${c.name}</strong>
            <span style="color:var(--accent); font-family:monospace">${c.votes || 0} votes (${pct}%)</span>
          </div>
          <div style="background:var(--bg-input); height:16px; border-radius:8px; overflow:hidden; border:1px solid var(--border)">
            <div style="background:var(--accent); width:${pct}%; height:100%; transition:width 0.5s ease"></div>
          </div>
        </div>
      `;
    });

    detailArea.innerHTML = `
      <div class="card">
        <h2>${election.electionTitle || election.name}</h2>
        <p style="color:var(--text-muted)">Total ballots cast: ${totalVotes}</p>
        <div style="margin-top:24px">
          ${barsHtml}
        </div>
      </div>
    `;
  } catch (err) {
    detailArea.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
  }
};

// --- ADMIN DASHBOARD ---
window.openAllRooms = function () {
  document.getElementById('admin-view-home')?.classList.add('hidden');
  document.getElementById('admin-view-all-rooms')?.classList.remove('hidden');
  loadElectionsList();
};

window.closeAllRooms = function () {
  document.getElementById('admin-view-all-rooms')?.classList.add('hidden');
  document.getElementById('admin-view-home')?.classList.remove('hidden');
};

window.toggleCreationSecret = function () {
  const type = document.getElementById('new-election-type').value;
  const secretWrap = document.getElementById('new-election-secret-wrapper');
  if (secretWrap) {
    if (type === 'private') secretWrap.classList.remove('hidden');
    else secretWrap.classList.add('hidden');
  }
};

window.createElection = async function () {
  const name = document.getElementById('new-election-name').value.trim();
  const roomType = document.getElementById('new-election-type').value;
  const secret = document.getElementById('new-election-secret')?.value.trim() || '';

  if (!name) return alert("Election name is required");

  try {
    const created = await API.createElection({
      electionTitle: name,
      roomType,
      accessCode: secret
    });
    alert("Election room created!");
    document.getElementById('new-election-name').value = '';
    window.openElectionDetails(created.id);
  } catch (err) {
    alert("Failed to create election: " + err.message);
  }
};

window.loadElectionsList = async function () {
  const listDiv = document.getElementById('election-rooms-list');
  if (!listDiv) return;

  listDiv.innerHTML = '<p class="text-gray-500">Fetching elections...</p>';

  try {
    const elections = await API.getElections();
    listDiv.innerHTML = '';

    if (elections.length === 0) {
      listDiv.innerHTML = '<p class="text-gray-500">No election rooms found. Create one above.</p>';
      return;
    }

    elections.forEach(data => {
      const statusColor = data.status === 'active' ? '#4CAF50' : (data.status === 'ended' ? '#f44336' : '#9e9e9e');
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cursor = 'pointer';
      card.style.border = `1px solid ${statusColor}`;
      card.onclick = () => window.openElectionDetails(data.id);

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="margin:0; font-size:1.2rem">${data.electionTitle || 'Untitled'}</h3>
            <span style="color:${statusColor}; font-weight:bold; font-size:0.75rem; border:1px solid ${statusColor}; padding:2px 8px; border-radius:12px">${(data.status || 'draft').toUpperCase()}</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.8rem; margin:8px 0 0">Candidates: ${(data.candidates || []).length}</p>
        <span style="font-size:0.8rem; color:var(--accent); margin-top:8px; display:inline-block">Manage Room →</span>
      `;
      listDiv.appendChild(card);
    });
  } catch (err) {
    listDiv.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
  }
};

window.openElectionDetails = async function (id) {
  currentElectionId = id;
  document.getElementById('admin-view-home')?.classList.add('hidden');
  document.getElementById('admin-view-all-rooms')?.classList.add('hidden');
  document.getElementById('admin-view-details')?.classList.remove('hidden');

  await refreshAdminElectionDetails();
};

window.exitElectionRoom = function () {
  currentElectionId = null;
  currentElectionData = null;
  document.getElementById('admin-view-details')?.classList.add('hidden');
  document.getElementById('admin-view-home')?.classList.remove('hidden');
};

async function refreshAdminElectionDetails() {
  if (!currentElectionId) return;

  try {
    currentElectionData = await API.getElection(currentElectionId);
    const data = currentElectionData;

    document.getElementById('current-room-title').innerText = data.electionTitle;
    document.getElementById('admin-election-status').innerText = (data.status || 'Draft').toUpperCase();
    if (document.getElementById('admin-edit-title')) {
      document.getElementById('admin-edit-title').value = data.electionTitle;
    }

    // Status controls
    const controlsDiv = document.getElementById('admin-controls');
    if (controlsDiv) {
      if (data.status === 'active') {
        controlsDiv.innerHTML = `
          <button onclick="window.updateElectionStatus('ended')" class="btn" style="border-color:#f44336; color:#f44336">End Election 🛑</button>
          <button onclick="window.updateElectionStatus('paused')" class="btn">Pause Election ⏸️</button>
        `;
      } else {
        controlsDiv.innerHTML = `
          <button onclick="window.updateElectionStatus('active')" class="btn filled" style="background:#4CAF50">Start / Resume Election ▶️</button>
        `;
      }
    }

    // Candidate list in admin
    const candsListDiv = document.getElementById('admin-candidates-list');
    if (candsListDiv) {
      candsListDiv.innerHTML = '';
      (data.candidates || []).forEach(c => {
        candsListDiv.innerHTML += `
          <div style="background:var(--bg-input); padding:16px; border-radius:8px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div>
              <h4 style="margin:0; font-size:1.1rem">${c.name}</h4>
              <p style="color:var(--accent); margin:4px 0 0; font-size:0.85rem">${c.tagline || ''}</p>
              <span style="color:var(--text-muted); font-size:0.8rem">Votes received: ${c.votes || 0}</span>
            </div>
            <button onclick="window.deleteCandidate('${c.id}')" class="btn" style="color:#f44336; border-color:#f44336; padding:6px 12px; font-size:0.8rem">Remove</button>
          </div>
        `;
      });
    }
  } catch (err) {
    console.error("Error loading election details:", err);
  }
}

window.updateElectionStatus = async function (newStatus) {
  if (!currentElectionId) return;
  try {
    await API.updateElection(currentElectionId, { status: newStatus });
    await refreshAdminElectionDetails();
  } catch (err) {
    alert("Status update failed: " + err.message);
  }
};

window.saveElectionSettings = async function () {
  if (!currentElectionId) return;
  const newTitle = document.getElementById('admin-edit-title').value.trim();
  if (!newTitle) return alert("Title cannot be empty");

  try {
    await API.updateElection(currentElectionId, { electionTitle: newTitle });
    alert("Saved!");
    await refreshAdminElectionDetails();
  } catch (err) {
    alert("Failed: " + err.message);
  }
};

window.addNewCandidate = async function () {
  if (!currentElectionId) return;
  const name = document.getElementById('cand-name').value.trim();
  const tagline = document.getElementById('cand-tagline').value.trim();
  const manifesto = document.getElementById('cand-manifesto').value.trim();

  if (!name) return alert("Candidate name is required");

  try {
    await API.addCandidate(currentElectionId, { name, tagline, manifesto });
    document.getElementById('cand-name').value = '';
    document.getElementById('cand-tagline').value = '';
    document.getElementById('cand-manifesto').value = '';
    alert("Candidate added!");
    await refreshAdminElectionDetails();
  } catch (err) {
    alert("Failed: " + err.message);
  }
};

window.deleteCandidate = async function (candidateId) {
  if (!confirm("Remove candidate?")) return;
  try {
    await API.deleteCandidate(currentElectionId, candidateId);
    await refreshAdminElectionDetails();
  } catch (err) {
    alert("Failed: " + err.message);
  }
};

window.deleteCurrentElection = async function () {
  if (!confirm("Are you sure you want to permanently delete this election room?")) return;
  try {
    await API.deleteElection(currentElectionId);
    alert("Room deleted.");
    window.exitElectionRoom();
    loadElectionsList();
  } catch (err) {
    alert("Failed: " + err.message);
  }
};

