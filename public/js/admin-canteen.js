/**
 * Active Student Portal - Admin Canteen Logic
 */

let menuItems = [];
let isAdmin = false;
let activeFilter = 'All';
let myChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = Auth.requireAuth();
  if (!user) return;

  if (user.email === 'canteen@anurag.edu.in' || user.role === 'canteen_admin') {
    isAdmin = true;
    const checkbox = document.getElementById('adminToggle');
    if (checkbox) checkbox.checked = true;

    document.getElementById('add-item-btn')?.classList.remove('hidden');
    document.getElementById('checkout-btn')?.classList.add('hidden');
    document.getElementById('admin-controls')?.classList.remove('hidden');
    document.getElementById('admin-stats')?.classList.remove('hidden');
    document.getElementById('float-scan-btn')?.classList.remove('hidden');

    await refreshOrders();
    await refreshStats();
    await refreshMenu();

    setInterval(refreshOrders, 5000);
    setInterval(refreshStats, 10000);
    setInterval(refreshMenu, 15000);
  } else {
    alert("Admin access required. Redirecting to student view...");
    window.location.href = 'student_canteen.html';
  }
});

window.setFilter = function (filter) {
  activeFilter = filter;
  document.querySelectorAll('.suggestion-chip').forEach(btn => {
    btn.classList.remove('active-filter');
  });
  const activeBtn = document.getElementById(`filter-${filter}`);
  if (activeBtn) activeBtn.classList.add('active-filter');
  renderMenu();
};

async function refreshOrders() {
  try {
    const orders = await API.getCanteenOrders({ status: 'pending,ready' });
    const container = document.getElementById('orders-queue');
    const countBadge = document.getElementById('order-count');

    if (!container || !countBadge) return;

    if (orders.length === 0) {
      countBadge.innerText = `0 Pending`;
      container.innerHTML = '<div class="text-center py-10 text-gray-600 italic">No active orders in queue</div>';
      return;
    }

    orders.sort((a, b) => {
      if (a.status === 'pending' && b.status === 'ready') return -1;
      if (a.status === 'ready' && b.status === 'pending') return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    const pendingCount = orders.filter(d => d.status === 'pending').length;
    countBadge.innerText = `${pendingCount} Pending`;

    container.innerHTML = '';
    orders.forEach(data => {
      const itemsStr = data.items.map(i => `${i.qty}x ${i.name}`).join(', ');
      const isReady = data.status === 'ready';

      container.innerHTML += `
        <div class="bg-zinc-800/50 p-3 rounded-xl border ${isReady ? 'border-green-500/30 bg-green-500/5' : 'border-zinc-700'} flex justify-between items-center transition-all">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-white text-sm">${data.orderId}</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded ${isReady ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'} uppercase font-bold">${data.status}</span>
                </div>
                <p class="text-gray-400 text-xs truncate max-w-[200px]">${itemsStr}</p>
                <div class="text-[10px] text-gray-500 mt-1">${data.userName || 'Student'}</div>
            </div>
            <div class="flex gap-2">
                ${!isReady ? `
                    <button onclick="window.updateOrderStatus('${data.id}', 'ready')" class="bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded transition-colors">READY</button>
                ` : ''}
                <button onclick="window.fillScanner('${data.orderId}')" class="bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] font-bold px-3 py-1.5 rounded transition-colors">SCAN</button>
            </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error refreshing orders:", err);
  }
}

async function refreshStats() {
  try {
    const orders = await API.getCanteenOrders();
    const pickedOrders = orders.filter(o => o.status === 'picked_up' || o.status === 'completed');

    let totalRevenue = 0;
    let totalOrders = pickedOrders.length;
    let productMap = {};

    pickedOrders.forEach(data => {
      totalRevenue += data.totalAmount || 0;
      if (data.items) {
        data.items.forEach(item => {
          productMap[item.name] = (productMap[item.name] || 0) + item.qty;
        });
      }
    });

    document.getElementById('stat-revenue').innerText = totalRevenue.toLocaleString('en-IN');
    document.getElementById('stat-orders').innerText = totalOrders;
    document.getElementById('stat-avg').innerText = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0;

    const productContainer = document.getElementById('top-products');
    if (productContainer) {
      productContainer.innerHTML = '';
      const sortedProducts = Object.entries(productMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

      if (sortedProducts.length === 0) {
        productContainer.innerHTML = '<div class="col-span-full text-center py-4 text-gray-600 italic text-xs">No sales data yet</div>';
      }

      sortedProducts.forEach(([name, count]) => {
        productContainer.innerHTML += `
          <div class="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
              <span class="text-xs text-white font-medium truncate pr-2">${name}</span>
              <span class="bg-orange-500/10 text-orange-500 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-500/20">${count} sold</span>
          </div>
        `;
      });

      updatePieChart(sortedProducts);
    }
  } catch (err) {
    console.error("Error refreshing stats:", err);
  }
}

function updatePieChart(sortedProducts) {
  const chartCanvas = document.getElementById('salesChart');
  if (!chartCanvas || typeof Chart === 'undefined') return;

  const ctx = chartCanvas.getContext('2d');
  const labels = sortedProducts.map(p => p[0]);
  const values = sortedProducts.map(p => p[1]);

  if (myChart) {
    myChart.destroy();
  }

  myChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#ff9a2c', '#4ade80', '#6366f1', '#f43f5e',
          '#eab308', '#a855f7', '#06b6d4', '#ec4899'
        ],
        borderWidth: 0,
        hoverOffset: 20
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#9a9a9a',
            font: { size: 10, weight: 'bold' },
            padding: 20
          }
        }
      }
    }
  });
}

window.updateOrderStatus = async function (id, newStatus) {
  try {
    await API.updateOrderStatus(id, newStatus);
    await refreshOrders();
    await refreshStats();
  } catch (e) {
    console.error("Error updating status:", e);
    alert("Status update failed: " + e.message);
  }
};

window.fillScanner = function (id) {
  const input = document.getElementById('barcode-input');
  if (input) {
    input.value = id;
    input.focus();
    processScan();
  }
};

window.processScan = async function () {
  const input = document.getElementById('barcode-input');
  const queryId = input.value.trim();
  if (!queryId) return;

  try {
    const orders = await API.getCanteenOrders();
    const order = orders.find(o => o.orderId === queryId || o.id === queryId);

    const resultBox = document.getElementById('scan-result');
    if (!order) {
      if (resultBox) {
        resultBox.innerHTML = `<div class="p-3 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/30">Order '${queryId}' not found.</div>`;
      }
      return;
    }

    if (order.status !== 'ready' && order.status !== 'pending') {
      if (resultBox) {
        resultBox.innerHTML = `<div class="p-3 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-bold border border-yellow-500/30">Order '${queryId}' is already marked as ${order.status.toUpperCase()}.</div>`;
      }
      return;
    }

    // Mark as picked up
    await API.updateOrderStatus(order.id, 'picked_up');
    if (resultBox) {
      resultBox.innerHTML = `
        <div class="p-4 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30">
          <div class="font-bold text-sm">✅ Verified & Handed Over!</div>
          <div class="text-xs text-white mt-1">${order.orderId} - ${order.userName}</div>
          <div class="text-xs text-gray-400 mt-1">${order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</div>
        </div>
      `;
    }
    input.value = '';
    await refreshOrders();
    await refreshStats();
  } catch (err) {
    alert("Scan failed: " + err.message);
  }
};

async function refreshMenu() {
  try {
    menuItems = await API.getCanteenMenu();
    renderMenu();
  } catch (err) {
    console.error("Error refreshing menu:", err);
  }
}

function renderMenu() {
  const grid = document.getElementById('menu-grid');
  if (!grid) return;
  grid.innerHTML = '';

  menuItems.forEach((item) => {
    if (activeFilter === 'Veg' && item.category !== 'Veg') return;
    if (activeFilter === 'Non-Veg' && item.category !== 'Non-Veg') return;
    if (activeFilter === 'Essentials' && item.category !== 'Essentials') return;
    if (activeFilter !== 'All' && activeFilter !== 'Veg' && activeFilter !== 'Non-Veg' && activeFilter !== 'Essentials' && item.category !== activeFilter) return;

    grid.innerHTML += `
      <div class="card-dark rounded-xl p-5 border border-zinc-800">
          <div class="h-40 bg-zinc-800 rounded-lg mb-4 overflow-hidden">
              <img src="${item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}" 
                   alt="${item.name}" 
                   class="w-full h-full object-cover"
                   onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'">
          </div>
          
          <div class="space-y-3">
              <div>
                  <label class="text-[10px] text-orange-500 font-bold uppercase">Item Name</label>
                  <input type="text" value="${item.name}" onchange="window.updateItem('${item.id}', 'name', this.value)" class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white">
              </div>
              <div class="grid grid-cols-2 gap-2">
                  <div>
                      <label class="text-[10px] text-orange-500 font-bold uppercase">Price (₹)</label>
                      <input type="number" value="${item.price}" onchange="window.updateItem('${item.id}', 'price', Number(this.value))" class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white">
                  </div>
                  <div>
                      <label class="text-[10px] text-orange-500 font-bold uppercase">Stock</label>
                      <input type="number" value="${item.stock !== undefined ? item.stock : 20}" onchange="window.updateItem('${item.id}', 'stock', Number(this.value))" class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white">
                  </div>
              </div>
              <div>
                  <label class="text-[10px] text-orange-500 font-bold uppercase">Category</label>
                  <select onchange="window.updateItem('${item.id}', 'category', this.value)" class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white">
                      <option value="Veg" ${item.category === 'Veg' ? 'selected' : ''}>Veg</option>
                      <option value="Non-Veg" ${item.category === 'Non-Veg' ? 'selected' : ''}>Non-Veg</option>
                      <option value="Essentials" ${item.category === 'Essentials' ? 'selected' : ''}>Essentials</option>
                  </select>
              </div>
              <button onclick="window.deleteItem('${item.id}')" class="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 rounded py-2 text-xs font-bold transition-colors">
                  Delete Item
              </button>
          </div>
      </div>
    `;
  });
}

window.updateItem = async function (id, field, value) {
  try {
    await API.updateCanteenMenuItem(id, { [field]: value });
    await refreshMenu();
  } catch (err) {
    alert("Failed to update item: " + err.message);
  }
};

window.deleteItem = async function (id) {
  if (!confirm("Are you sure you want to delete this menu item?")) return;
  try {
    await API.deleteCanteenMenuItem(id);
    await refreshMenu();
  } catch (err) {
    alert("Failed to delete item: " + err.message);
  }
};

window.saveNewItem = async function () {
  const name = document.getElementById('new-name').value.trim();
  const price = Number(document.getElementById('new-price').value);
  const stock = Number(document.getElementById('new-stock').value) || 20;
  const category = document.getElementById('new-cat').value;
  const desc = document.getElementById('new-desc').value.trim();
  const img = document.getElementById('new-img').value.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';

  if (!name || isNaN(price)) {
    return alert("Name and price are required");
  }

  try {
    await API.addCanteenMenuItem({ name, price, stock, category, desc, img });
    document.getElementById('add-modal').style.display = 'none';
    await refreshMenu();
  } catch (err) {
    alert("Failed to add item: " + err.message);
  }
};

window.openAddModal = function () {
  document.getElementById('add-modal').style.display = 'flex';
};

window.closeAddModal = function () {
  document.getElementById('add-modal').style.display = 'none';
};

window.scrollToScanner = function () {
  document.getElementById('scanner-section')?.scrollIntoView({ behavior: 'smooth' });
};

