/**
 * Active Student Portal - Student Canteen Client Logic
 */

let currentUser = null;
let menuItems = [];
let cart = [];
let activeFilter = 'All';

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = Auth.requireAuth();
  if (!currentUser) return;

  if (currentUser.email === 'canteen@anurag.edu.in') {
    window.location.href = 'admin_canteen.html';
    return;
  }

  const userDisplay = document.getElementById('user-display');
  if (userDisplay) {
    userDisplay.innerText = `Hello, ${currentUser.fullName || currentUser.email.split('@')[0]}`;
  }

  await loadMenu();
  await loadCart();

  // Periodic polling for menu and orders
  setInterval(loadMenu, 10000);
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

async function loadMenu() {
  try {
    menuItems = await API.getCanteenMenu();
    renderMenu();
  } catch (err) {
    console.error("Failed to load menu:", err);
  }
}

async function loadCart() {
  if (!currentUser) return;
  try {
    const data = await API.getCart(currentUser.id);
    cart = data.items || [];
    updateCartCount();
  } catch (e) {
    console.error("Error loading cart:", e);
  }
}

async function saveCart() {
  if (!currentUser) return;
  try {
    await API.saveCart(currentUser.id, cart);
  } catch (e) {
    console.error("Error saving cart:", e);
  }
}

function renderMenu() {
  const grid = document.getElementById('menu-grid');
  if (!grid) return;
  grid.innerHTML = '';

  menuItems.forEach(item => {
    if (activeFilter === 'Veg' && item.category !== 'Veg') return;
    if (activeFilter === 'Non-Veg' && item.category !== 'Non-Veg') return;
    if (activeFilter === 'Essentials' && item.category !== 'Essentials') return;
    if (activeFilter !== 'All' && activeFilter !== 'Veg' && activeFilter !== 'Non-Veg' && activeFilter !== 'Essentials' && item.category !== activeFilter) return;

    const stock = item.stock !== undefined ? item.stock : 20;
    const isOutOfStock = stock <= 0;

    grid.innerHTML += `
      <div class="card-dark p-4 rounded-xl relative overflow-hidden ${isOutOfStock ? 'opacity-75 grayscale' : ''}">
          ${isOutOfStock ? '<div class="absolute inset-0 bg-black/50 flex items-center justify-center z-10"><span class="bg-red-600 text-white px-4 py-1 rounded font-bold -rotate-12 border border-white">OUT OF STOCK</span></div>' : ''}
          
          <div class="h-40 bg-gray-800 rounded-lg mb-4 overflow-hidden flex items-center justify-center text-gray-500">
               <img src="${item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}" 
                    alt="${item.name}" 
                    class="w-full h-full object-cover"
                    onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'">
          </div>
          
          <div class="flex justify-between items-start mb-2">
               <div>
                  <div class="flex items-center gap-1.5 mb-1">
                      ${item.category === 'Veg' ? '<span class="w-2 h-2 rounded-full bg-green-500"></span>' : ''}
                      ${item.category === 'Non-Veg' ? '<span class="w-2 h-2 rounded-full bg-red-600"></span>' : ''}
                      <span class="text-[9px] ${item.category === 'Non-Veg' ? 'text-red-500' : (item.category === 'Veg' ? 'text-green-500' : 'text-orange-500')} font-bold uppercase tracking-widest">${item.category || 'Veg'}</span>
                  </div>
                  <h4 class="font-bold text-lg leading-tight flex-1 mr-2">${item.name}</h4>
               </div>
               ${!isOutOfStock ? `
                  <span class="text-[10px] px-2 py-0.5 rounded border whitespace-nowrap font-bold ${stock < 10 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}">
                      ${stock} Available
                  </span>`
          : ''}
          </div>

          <p class="text-gray-400 text-sm mb-4 h-10 overflow-hidden line-clamp-2">${item.desc || ''}</p>
          <div class="flex justify-between items-center">
              <span class="accent-orange font-bold">₹${item.price}</span>
              <button onclick="window.addToCart(this, '${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price}, ${stock})" 
                  ${isOutOfStock ? 'disabled' : ''}
                  class="bg-accent-orange text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center">
                  ${isOutOfStock ? 'Sold Out' : 'Add to Cart'}
              </button>
          </div>
      </div>
    `;
  });
}

window.addToCart = function (btn, id, name, price, maxStock) {
  const existing = cart.find(item => item.id === id);
  const currentQty = existing ? existing.qty : 0;

  if (currentQty >= maxStock) {
    if (btn) {
      btn.classList.add('animate-bounce');
      setTimeout(() => btn.classList.remove('animate-bounce'), 500);
    }
    alert(`Sorry, only ${maxStock} ${name} available.`);
    return;
  }

  if (btn) {
    const originalContent = btn.innerHTML;
    const originalClasses = btn.className;

    btn.innerHTML = `<span>Added</span> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    btn.classList.remove('bg-accent-orange', 'text-black', 'hover:bg-orange-400');
    btn.classList.add('bg-green-500', 'text-white', 'scale-105', 'shadow-lg', 'shadow-green-500/50');

    setTimeout(() => {
      btn.innerHTML = originalContent;
      btn.className = originalClasses;
    }, 1500);
  }

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, qty: 1, maxStock });
  }
  updateCartCount();
  saveCart();
};

function updateCartCount() {
  const count = cart.reduce((acc, item) => acc + item.qty, 0);
  const badge = document.getElementById('cart-count');
  if (!badge) return;

  badge.innerText = `Cart (${count})`;

  const container = badge.parentElement;
  if (container) {
    container.classList.add('scale-125', 'bg-orange-500', 'text-white');
    container.classList.remove('bg-orange-500/20', 'text-accent-orange');

    setTimeout(() => {
      container.classList.remove('scale-125', 'bg-orange-500', 'text-white');
      container.classList.add('bg-orange-500/20', 'text-accent-orange');
    }, 200);
  }
}

window.updateQty = function (id, change) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  const newQty = item.qty + change;
  if (change > 0 && newQty > item.maxStock) {
    alert(`Sorry, cannot add more. Only ${item.maxStock} available.`);
    return;
  }

  item.qty = newQty;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  updateCartCount();
  saveCart();
  showBill();
};

window.showBill = function () {
  if (cart.length === 0) {
    const itemsContainer = document.getElementById('bill-items');
    if (itemsContainer && itemsContainer.offsetParent !== null) {
      document.getElementById('bill-modal').style.display = 'none';
    } else {
      alert("Cart is empty!");
    }
    return;
  }

  const itemsContainer = document.getElementById('bill-items');
  const totalContainer = document.getElementById('bill-total');
  let total = 0;

  itemsContainer.innerHTML = '';
  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    itemsContainer.innerHTML += `
      <div class="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
          <div class="flex-1">
              <h4 class="font-bold text-white">${item.name}</h4>
              <span class="text-xs text-gray-400">₹${item.price} x ${item.qty}</span>
          </div>
          <div class="flex items-center gap-3">
              <button onclick="window.updateQty('${item.id}', -1)" class="w-6 h-6 flex items-center justify-center bg-zinc-700 rounded text-accent hover:bg-zinc-600 font-bold">-</button>
              <span class="w-4 text-center font-mono font-bold">${item.qty}</span>
              <button onclick="window.updateQty('${item.id}', 1)" class="w-6 h-6 flex items-center justify-center bg-zinc-700 rounded text-accent hover:bg-zinc-600 font-bold">+</button>
          </div>
          <div class="w-16 text-right font-bold text-orange-400">₹${itemTotal}</div>
      </div>`;
  });

  const gst = total * 0.05;
  itemsContainer.innerHTML += `
      <div class="flex justify-between text-xs text-gray-500 mt-4 px-2 italic border-t border-zinc-800 pt-2">
          <span>Subtotal</span>
          <span>₹${total.toFixed(2)}</span>
      </div>
      <div class="flex justify-between text-xs text-gray-500 px-2 italic">
          <span>GST (5%)</span>
          <span>₹${gst.toFixed(2)}</span>
      </div>`;

  totalContainer.innerText = `₹${(total + gst).toFixed(2)}`;

  const footerBtn = document.querySelector('#bill-modal .border-t button');
  if (footerBtn) {
    footerBtn.innerText = "Pay & Place Order";
    footerBtn.onclick = window.placeOrder;
  }

  document.getElementById('bill-modal').style.display = 'flex';
};

window.hideBill = function () {
  document.getElementById('bill-modal').style.display = 'none';
};

window.placeOrder = async function () {
  if (cart.length === 0) return;
  if (!currentUser) return alert("Please login to order");

  const btn = document.querySelector('#bill-modal .border-t button');
  const originalText = btn.innerText;
  btn.innerText = "Processing...";
  btn.disabled = true;

  try {
    const order = await API.placeCanteenOrder({
      items: cart,
      userId: currentUser.id,
      userName: currentUser.fullName || "Student",
      userEmail: currentUser.email
    });

    const receiptData = {
      id: order.orderId,
      time: new Date(order.timestamp).toLocaleString(),
      items: [...cart],
      total: order.totalAmount,
      barcode: order.barcodeUrl
    };

    cart = [];
    updateCartCount();
    saveCart();
    document.getElementById('bill-modal').style.display = 'none';

    showReceipt(receiptData);
    await loadMenu(); // Refresh stock counts
  } catch (e) {
    console.error("Order Failed:", e);
    alert("Order Failed: " + e.message);
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
};

window.showOrders = function () {
  document.getElementById('orders-modal').style.display = 'flex';
  loadUserOrders();
};

window.hideOrders = function () {
  document.getElementById('orders-modal').style.display = 'none';
};

async function loadUserOrders() {
  if (!currentUser) return;
  const container = document.getElementById('orders-list');
  container.innerHTML = '<div class="text-center text-gray-500">Loading...</div>';

  try {
    const orders = await API.getCanteenOrders({ userId: currentUser.id });
    orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (orders.length === 0) {
      container.innerHTML = '<div class="text-center text-gray-500 mt-10">No active orders found.</div>';
      return;
    }

    container.innerHTML = '';
    orders.forEach(order => {
      const date = order.timestamp ? new Date(order.timestamp).toLocaleString() : 'Just now';
      const itemsStr = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');

      let statusColor = 'text-yellow-500';
      if (order.status === 'ready') statusColor = 'text-green-500';
      if (order.status === 'picked_up' || order.status === 'completed') statusColor = 'text-gray-500';

      const receiptDataSafe = JSON.stringify({
        id: order.orderId,
        time: date,
        items: order.items,
        total: order.totalAmount,
        barcode: order.barcodeUrl
      }).replace(/"/g, "&quot;");

      container.innerHTML += `
        <div class="bg-zinc-800 p-4 rounded-xl border border-zinc-700 flex flex-col md:flex-row gap-4 items-center">
            <div class="bg-white p-2 rounded flex-shrink-0">
                <img src="${order.barcodeUrl}" alt="Barcode" class="h-16 w-48 object-contain">
            </div>
            <div class="flex-1 text-center md:text-left">
                <div class="flex justify-between items-center mb-1">
                    <h4 class="font-bold text-white text-lg">${order.orderId}</h4>
                    <span class="text-xs font-bold uppercase ${statusColor}">${order.status.replace('_', ' ')}</span>
                </div>
                <p class="text-gray-400 text-sm mb-1">${itemsStr}</p>
                <p class="text-xs text-gray-500">${date} • ₹${order.totalAmount.toFixed(2)}</p>
            </div>
            <button onclick='window.showReceipt(${receiptDataSafe})' class="bg-zinc-700 hover:bg-zinc-600 text-white p-2 rounded-lg" title="Print Receipt">
                🖨️
            </button>
        </div>
      `;
    });
  } catch (error) {
    container.innerHTML = `<div class="text-red-500 text-center">Error loading orders.</div>`;
    console.error(error);
  }
}

window.showReceipt = function (data) {
  document.getElementById('receipt-id').innerText = data.id;
  document.getElementById('receipt-time').innerText = data.time.toUpperCase();
  document.getElementById('receipt-total').innerText = '₹' + data.total.toFixed(2);
  document.getElementById('receipt-barcode').src = data.barcode;

  const list = document.getElementById('receipt-items');
  list.innerHTML = '';
  data.items.forEach(item => {
    list.innerHTML += `
      <div class="flex justify-between text-xs">
          <span class="w-8 font-bold">${item.qty} x</span>
          <span class="flex-1 truncate mr-2">${item.name}</span>
          <span>₹${(item.price * item.qty).toFixed(2)}</span>
      </div>
    `;
  });

  list.innerHTML += `
       <div class="flex justify-between text-xs border-t border-dashed border-gray-300 mt-2 pt-2 text-gray-500">
           <span>GST (5%)</span>
           <span>₹${(data.total - (data.total / 1.05)).toFixed(2)}</span>
       </div>
  `;

  const modal = document.getElementById('receipt-modal');
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
};

window.closeReceipt = function () {
  const modal = document.getElementById('receipt-modal');
  modal.classList.add('hidden');
  modal.style.display = 'none';
};

window.closeClaimModal = function () {
  document.getElementById('claim-modal').classList.add('hidden');
  document.getElementById('claim-modal').style.display = 'none';
};

