// Admin login and data management

async function login() {
  const pwd = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');
  
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd })
    });
    
    if (res.ok) {
      document.getElementById('login-overlay').style.display = 'none';
      window._adminPassword = pwd; // Remember for password change
      loadData();
    } else {
      errorEl.style.display = 'block';
    }
  } catch (e) {
    errorEl.textContent = 'Could not connect to server';
    errorEl.style.display = 'block';
  }
}

document.getElementById('password').addEventListener('keyup', (e) => {
  if (e.key === 'Enter') login();
});

function switchTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  
  if (el) el.classList.add('active');
  document.getElementById(tab + '-panel').classList.add('active');
}

async function loadData() {
  loadBookings();
  loadVehicles();
}

async function loadBookings() {
  try {
    const res = await fetch('/api/bookings');
    const bookings = await res.json();
    
    const tbody = document.getElementById('bookings-tbody');
    if (bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No booking requests yet.</td></tr>';
      return;
    }

    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td>${new Date(b.createdAt).toLocaleDateString()}</td>
        <td>
          <strong>${b.name}</strong><br/>
          <a href="mailto:${b.email}">${b.email}</a><br/>
          <a href="tel:${b.phone}">${b.phone}</a>
        </td>
        <td>${b.vehicleId || 'No preference'}</td>
        <td>${b.pickupDate} to ${b.returnDate}</td>
        <td><span class="status status-${b.status}">${b.status}</span></td>
        <td>
          <select onchange="updateBookingStatus(${b.id}, this.value)" style="padding: 0.25rem;">
            <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    console.error(e);
  }
}

async function loadVehicles() {
  try {
    const res = await fetch('/api/vehicles');
    const vehicles = await res.json();
    
    const tbody = document.getElementById('vehicles-tbody');
    tbody.innerHTML = vehicles.map(v => `
      <tr>
        <td><img src="${v.image}" width="80" style="border-radius:4px;" /></td>
        <td><strong>${v.name}</strong></td>
        <td>
          $<input type="number" id="price-${v.id}" class="edit-price-input" value="${v.dailyRate}" /> /day
        </td>
        <td>
          <button class="btn btn-sm" onclick="updatePrice('${v.id}')">Save Price</button>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    console.error(e);
  }
}

async function updateBookingStatus(id, newStatus) {
  try {
    await fetch('/api/bookings/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    loadBookings();
  } catch(e) {
    alert("Failed to update status.");
  }
}

async function updatePrice(id) {
  const newPrice = document.getElementById('price-' + id).value;
  try {
    const res = await fetch('/api/vehicles/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyRate: parseInt(newPrice) })
    });
    if (res.ok) {
      alert("Price updated!");
    } else {
      alert("Failed to update price.");
    }
  } catch(e) {
    alert("Failed to update price.");
  }
}

async function changePassword() {
  const currentPw = document.getElementById('current-password').value;
  const newPw = document.getElementById('new-password').value;
  const confirmPw = document.getElementById('confirm-password').value;
  const msgEl = document.getElementById('pw-message');
  
  msgEl.style.display = 'none';
  
  if (!currentPw || !newPw || !confirmPw) {
    msgEl.textContent = 'Please fill in all fields.';
    msgEl.className = 'pw-message pw-error';
    msgEl.style.display = 'block';
    return;
  }
  
  if (newPw !== confirmPw) {
    msgEl.textContent = 'New passwords do not match.';
    msgEl.className = 'pw-message pw-error';
    msgEl.style.display = 'block';
    return;
  }

  if (newPw.length < 4) {
    msgEl.textContent = 'Password must be at least 4 characters.';
    msgEl.className = 'pw-message pw-error';
    msgEl.style.display = 'block';
    return;
  }
  
  try {
    const res = await fetch('/api/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      msgEl.textContent = '✅ Password changed successfully!';
      msgEl.className = 'pw-message pw-success';
      msgEl.style.display = 'block';
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
      window._adminPassword = newPw;
    } else {
      msgEl.textContent = data.error || 'Failed to change password.';
      msgEl.className = 'pw-message pw-error';
      msgEl.style.display = 'block';
    }
  } catch(e) {
    msgEl.textContent = 'Could not connect to server.';
    msgEl.className = 'pw-message pw-error';
    msgEl.style.display = 'block';
  }
}
