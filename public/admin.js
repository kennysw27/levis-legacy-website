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

let _vehiclesCache = [];

async function loadVehicles() {
  try {
    const res = await fetch('/api/vehicles');
    _vehiclesCache = await res.json();
    
    const tbody = document.getElementById('vehicles-tbody');
    if (_vehiclesCache.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No vehicles yet. Click "Add New Vehicle" above.</td></tr>';
      return;
    }
    tbody.innerHTML = _vehiclesCache.map(v => `
      <tr>
        <td><img src="${v.image || ''}" width="80" style="border-radius:4px; background:#eee;" onerror="this.style.display='none'" /></td>
        <td>
          <strong>${v.name}</strong><br/>
          <span style="color:#888; font-size:0.8rem;">${v.type || ''} · ${v.seats || 0} seats</span>
        </td>
        <td>
          $<input type="number" id="price-${v.id}" class="edit-price-input" value="${v.dailyRate}" /> /day
        </td>
        <td>
          <button class="btn btn-sm" onclick="updatePrice('${v.id}')">Save</button>
        </td>
        <td>
          <button class="btn btn-sm" style="background:#3b82f6;" onclick="openEditModal('${v.id}')">✏️ Edit</button>
        </td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteVehicle('${v.id}', '${v.name.replace(/'/g, "\\'")}')">🗑️</button>
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

// --- VEHICLE ADD / DELETE ---

function toggleAddForm() {
  const form = document.getElementById('add-vehicle-form');
  form.classList.toggle('open');
}

async function addVehicle() {
  const name = document.getElementById('av-name').value.trim();
  const dailyRate = document.getElementById('av-rate').value;
  const msgEl = document.getElementById('add-vehicle-msg');
  
  msgEl.style.display = 'none';

  if (!name || !dailyRate) {
    msgEl.textContent = 'Vehicle name and daily rate are required.';
    msgEl.className = 'pw-message pw-error';
    msgEl.style.display = 'block';
    return;
  }

  const vehicleData = {
    name,
    type: document.getElementById('av-type').value.trim() || 'Vehicle',
    category: document.getElementById('av-category').value,
    seats: parseInt(document.getElementById('av-seats').value) || 5,
    bags: parseInt(document.getElementById('av-bags').value) || 3,
    dailyRate: parseInt(dailyRate),
    transmission: document.getElementById('av-transmission').value.trim(),
    fuelType: document.getElementById('av-fuel').value.trim(),
    shortDescription: document.getElementById('av-short-desc').value.trim(),
    fullDescription: document.getElementById('av-full-desc').value.trim(),
    bestFor: document.getElementById('av-bestfor').value.trim(),
    deposit: document.getElementById('av-deposit').value.trim(),
    mileagePolicy: document.getElementById('av-mileage').value.trim(),
    fuelPolicy: document.getElementById('av-fuelpolicy').value.trim(),
    pickupDropoff: document.getElementById('av-pickup').value.trim()
  };

  try {
    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicleData)
    });

    if (res.ok) {
      msgEl.textContent = '✅ Vehicle added successfully!';
      msgEl.className = 'pw-message pw-success';
      msgEl.style.display = 'block';
      
      // Clear the form
      document.getElementById('av-name').value = '';
      document.getElementById('av-type').value = '';
      document.getElementById('av-rate').value = '';
      document.getElementById('av-short-desc').value = '';
      document.getElementById('av-full-desc').value = '';
      document.getElementById('av-bestfor').value = '';
      document.getElementById('av-deposit').value = '';
      document.getElementById('av-mileage').value = '';
      document.getElementById('av-fuelpolicy').value = '';
      document.getElementById('av-pickup').value = '';
      
      // Reload the vehicles table
      loadVehicles();
      
      // Close form after a moment
      setTimeout(() => { toggleAddForm(); msgEl.style.display = 'none'; }, 1500);
    } else {
      const data = await res.json();
      msgEl.textContent = data.error || 'Failed to add vehicle.';
      msgEl.className = 'pw-message pw-error';
      msgEl.style.display = 'block';
    }
  } catch(e) {
    msgEl.textContent = 'Could not connect to server.';
    msgEl.className = 'pw-message pw-error';
    msgEl.style.display = 'block';
  }
}

async function deleteVehicle(id, name) {
  if (!confirm(`Are you sure you want to remove "${name}" from your fleet? This cannot be undone.`)) {
    return;
  }
  
  try {
    const res = await fetch('/api/vehicles/' + id, { method: 'DELETE' });
    if (res.ok) {
      alert(`"${name}" has been removed.`);
      loadVehicles();
    } else {
      alert('Failed to remove vehicle.');
    }
  } catch(e) {
    alert('Could not connect to server.');
  }
}

// --- EDIT VEHICLE MODAL ---

function openEditModal(vehicleId) {
  const v = _vehiclesCache.find(x => x.id === vehicleId);
  if (!v) return alert('Vehicle not found');
  
  document.getElementById('ev-id').value = v.id;
  document.getElementById('ev-name').value = v.name || '';
  document.getElementById('ev-type').value = v.type || '';
  document.getElementById('ev-category').value = v.category || 'suv';
  document.getElementById('ev-rate').value = v.dailyRate || '';
  document.getElementById('ev-seats').value = v.seats || 5;
  document.getElementById('ev-bags').value = v.bags || 3;
  document.getElementById('ev-transmission').value = v.transmission || '';
  document.getElementById('ev-fuel').value = v.fuelType || '';
  document.getElementById('ev-short-desc').value = v.shortDescription || '';
  document.getElementById('ev-full-desc').value = v.fullDescription || '';
  document.getElementById('ev-bestfor').value = v.bestFor || '';
  document.getElementById('ev-deposit').value = v.deposit || '';
  document.getElementById('ev-mileage').value = v.mileagePolicy || '';
  document.getElementById('ev-fuelpolicy').value = v.fuelPolicy || '';
  document.getElementById('ev-pickup').value = v.pickupDropoff || '';
  
  document.getElementById('edit-modal-title').textContent = `Edit: ${v.name}`;
  document.getElementById('edit-msg').style.display = 'none';
  document.getElementById('edit-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('open');
  document.body.style.overflow = 'auto';
}

async function saveVehicleEdit() {
  const id = document.getElementById('ev-id').value;
  const msgEl = document.getElementById('edit-msg');
  msgEl.style.display = 'none';
  
  const data = {
    name: document.getElementById('ev-name').value.trim(),
    type: document.getElementById('ev-type').value.trim(),
    category: document.getElementById('ev-category').value,
    dailyRate: parseInt(document.getElementById('ev-rate').value) || 0,
    seats: parseInt(document.getElementById('ev-seats').value) || 5,
    bags: parseInt(document.getElementById('ev-bags').value) || 3,
    transmission: document.getElementById('ev-transmission').value.trim(),
    fuelType: document.getElementById('ev-fuel').value.trim(),
    shortDescription: document.getElementById('ev-short-desc').value.trim(),
    fullDescription: document.getElementById('ev-full-desc').value.trim(),
    bestFor: document.getElementById('ev-bestfor').value.trim(),
    deposit: document.getElementById('ev-deposit').value.trim(),
    mileagePolicy: document.getElementById('ev-mileage').value.trim(),
    fuelPolicy: document.getElementById('ev-fuelpolicy').value.trim(),
    pickupDropoff: document.getElementById('ev-pickup').value.trim()
  };
  
  if (!data.name) {
    msgEl.textContent = 'Vehicle name is required.';
    msgEl.className = 'pw-message pw-error';
    msgEl.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/api/vehicles/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      msgEl.textContent = '✅ Vehicle updated successfully!';
      msgEl.className = 'pw-message pw-success';
      msgEl.style.display = 'block';
      loadVehicles();
      setTimeout(() => closeEditModal(), 1000);
    } else {
      const err = await res.json();
      msgEl.textContent = err.error || 'Failed to update.';
      msgEl.className = 'pw-message pw-error';
      msgEl.style.display = 'block';
    }
  } catch(e) {
    msgEl.textContent = 'Could not connect to server.';
    msgEl.className = 'pw-message pw-error';
    msgEl.style.display = 'block';
  }
}
