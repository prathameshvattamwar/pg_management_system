// js/admin.js

// --- DOM Elements ---
const addRoomForm = document.getElementById('add-room-form');
const roomNumberInput = document.getElementById('room-number');
const roomTypeSelect = document.getElementById('room-type');
const roomFoodSelect = document.getElementById('room-food');
const calculatedRentSpan = document.getElementById('calculated-rent');
const facilityCheckboxesDiv = document.getElementById('facility-checkboxes');
const roomRulesTextarea = document.getElementById('room-rules');
const addRoomMessage = document.getElementById('add-room-message');

const roomsTableBody = document.getElementById('rooms-table-body');
const viewRoomsTab = document.getElementById('view-rooms-tab');

const addTenantForm = document.getElementById('add-tenant-form');
const tenantNameInput = document.getElementById('tenant-name');
const tenantContactInput = document.getElementById('tenant-contact');
const tenantRoomSelect = document.getElementById('tenant-room-number');
const tenantMoveInDateInput = document.getElementById('tenant-moving-date');
const tenantDepositPaidCheckbox = document.getElementById('tenant-deposit-paid');
const tenantRentPaidCheckbox = document.getElementById('tenant-rent-paid');
const addTenantMessage = document.getElementById('add-tenant-message');

const tenantsTableBody = document.getElementById('tenants-table-body');
const viewTenantsTab = document.getElementById('view-tenants-tab');

const pendingPaymentsTableBody = document.getElementById('pending-payments-table-body');
const pendingPaymentsTab = document.getElementById('pending-payments-tab');

// --- Constants ---
const RENT_WITH_FOOD = 7000;
const RENT_WITHOUT_FOOD = 3500;
const DEPOSIT_AMOUNT = 5000;

// --- Functions ---

// Calculate and display rent based on selections
function updateCalculatedRent() {
    const food = roomFoodSelect.value;
    const rent = (food === 'yes') ? RENT_WITH_FOOD : RENT_WITHOUT_FOOD;
    calculatedRentSpan.textContent = rent;
}

// Populate facility checkboxes
function populateFacilities() {
    facilityCheckboxesDiv.innerHTML = ''; // Clear existing
    defaultFacilities.forEach(facility => { // defaultFacilities from storage.js
        const div = document.createElement('div');
        div.classList.add('form-check');
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${facility}" id="facility-${facility.replace(/\s+/g, '-')}" name="facilities">
            <label class="form-check-label" for="facility-${facility.replace(/\s+/g, '-')}">
                ${facility}
            </label>
        `;
        facilityCheckboxesDiv.appendChild(div);
    });
}

// Handle Add Room form submission
function handleAddRoom(event) {
    event.preventDefault();
    addRoomMessage.textContent = '';
    addRoomMessage.className = 'mt-2'; // Reset classes

    const roomNumber = roomNumberInput.value.trim();
    const type = roomTypeSelect.value; // "2" or "3"
    const food = roomFoodSelect.value; // "yes" or "no"
    const rent = (food === 'yes') ? RENT_WITH_FOOD : RENT_WITHOUT_FOOD;
    const deposit = DEPOSIT_AMOUNT;
    const capacity = parseInt(type, 10);

    // Check if room number already exists
    if (getRooms().some(room => room.roomNumber === roomNumber)) {
         addRoomMessage.textContent = `Error: Room number ${roomNumber} already exists!`;
         addRoomMessage.classList.add('text-danger');
         return;
    }

    const selectedFacilities = Array.from(facilityCheckboxesDiv.querySelectorAll('input[name="facilities"]:checked'))
                                   .map(cb => cb.value);

    const rules = roomRulesTextarea.value.split(',')
                       .map(rule => rule.trim())
                       .filter(rule => rule.length > 0); // Filter empty strings

    const newRoom = {
        roomNumber: roomNumber,
        type: `${type}-partner`, // e.g., "2-partner"
        food: (food === 'yes') ? 'With Food' : 'Without Food',
        rentPerPerson: rent,
        depositPerPerson: deposit,
        capacity: capacity,
        facilities: selectedFacilities,
        rules: rules,
        tenantIds: [] // Initialize empty tenant list for the room
    };

    if (addRoomToStorage(newRoom)) { // From storage.js
        addRoomMessage.textContent = 'Room added successfully!';
        addRoomMessage.classList.add('text-success');
        addRoomForm.reset(); // Clear form
        updateCalculatedRent(); // Reset calculated rent display
        populateRoomsTable(); // Refresh table if visible
        populateTenantRoomOptions(); // Refresh room options in add tenant form
    } else {
        addRoomMessage.textContent = 'Error adding room. Please try again.';
        addRoomMessage.classList.add('text-danger');
    }
}

// Populate the View Rooms table
function populateRoomsTable() {
    const rooms = getRooms(); // From storage.js
    roomsTableBody.innerHTML = ''; // Clear existing rows

    if (!rooms || rooms.length === 0) {
        roomsTableBody.innerHTML = '<tr><td colspan="10" class="text-center">No rooms added yet.</td></tr>';
        return;
    }

    rooms.forEach(room => {
        const occupancy = room.tenantIds ? room.tenantIds.length : 0;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${room.roomNumber}</td>
            <td>${room.type}</td>
            <td>${room.food}</td>
            <td>${room.rentPerPerson}</td>
            <td>${room.depositPerPerson}</td>
            <td>${room.capacity}</td>
            <td>${occupancy}</td>
            <td>${room.facilities.join(', ') || 'None'}</td>
            <td>${room.rules.join(', ') || 'None'}</td>
            <td>
                 <button class="btn btn-sm btn-danger" onclick="handleDeleteRoom('${room.id}')" title="Delete Room">
                     <i class="bi bi-trash"></i>
                 </button>
                 <!-- Add edit button later if needed -->
            </td>
        `;
        roomsTableBody.appendChild(row);
    });
}

// Handle deleting a room
function handleDeleteRoom(roomId) {
    const room = getRoomByRoomId(roomId); // From storage.js
    if (!room) return;

    const tenantsInRoom = getTenantsByRoomNumber(room.roomNumber); // from storage.js

    let confirmationMessage = `Are you sure you want to delete Room ${room.roomNumber}?`;
    if (tenantsInRoom.length > 0) {
        confirmationMessage += `\n\nWARNING: This room currently has ${tenantsInRoom.length} tenant(s). Deleting the room will also REMOVE their tenant records and associated logins. This action cannot be undone.`;
    }


    if (confirm(confirmationMessage)) {
        if(deleteRoomFromStorage(roomId)) { // from storage.js
            console.log(`Room ${roomId} deleted.`);
            populateRoomsTable(); // Refresh room list
            populateTenantsTable(); // Refresh tenant list (as tenants might be removed)
            populatePendingPaymentsTable(); // Refresh payments
            populateTenantRoomOptions(); // Refresh dropdown in add tenant form
        } else {
            alert("Error deleting room. Please try again.");
        }
    }
}


// Populate the Room dropdown in the Add Tenant form
function populateTenantRoomOptions() {
    const rooms = getRooms();
    tenantRoomSelect.innerHTML = '<option value="">-- Select Room --</option>'; // Reset

    rooms.forEach(room => {
        const occupancy = room.tenantIds ? room.tenantIds.length : 0;
        if (occupancy < room.capacity) { // Only show rooms with available space
            const option = document.createElement('option');
            option.value = room.roomNumber;
            option.textContent = `Room ${room.roomNumber} (${room.capacity - occupancy} beds left)`;
            tenantRoomSelect.appendChild(option);
        } else {
             const option = document.createElement('option');
            option.value = room.roomNumber;
            option.textContent = `Room ${room.roomNumber} (Full)`;
            option.disabled = true;
            tenantRoomSelect.appendChild(option);
        }
    });
}

// Handle Add Tenant form submission
function handleAddTenant(event) {
    event.preventDefault();
    addTenantMessage.textContent = '';
    addTenantMessage.className = 'mt-2'; // Reset classes

    const name = tenantNameInput.value.trim();
    const contact = tenantContactInput.value.trim();
    const roomNumber = tenantRoomSelect.value;
    const movingDate = tenantMoveInDateInput.value;
    const depositPaid = tenantDepositPaidCheckbox.checked;
    const rentPaid = tenantRentPaidCheckbox.checked;

    // Basic validation
    if (!name || !contact || !roomNumber || !movingDate) {
        addTenantMessage.textContent = 'Error: Please fill in all required fields.';
        addTenantMessage.classList.add('text-danger');
        return;
    }

    // Check if contact number (username) already exists
    if(getUsers().some(u => u.username === contact)) {
         addTenantMessage.textContent = `Error: Contact number ${contact} is already registered as a username.`;
         addTenantMessage.classList.add('text-danger');
         return;
    }

    // Get room details to check capacity again and get rent
    const room = getRoomByRoomNumber(roomNumber); // from storage.js
    if (!room) {
         addTenantMessage.textContent = 'Error: Selected room not found.';
         addTenantMessage.classList.add('text-danger');
         return;
    }
     const occupancy = room.tenantIds ? room.tenantIds.length : 0;
     if (occupancy >= room.capacity) {
         addTenantMessage.textContent = `Error: Room ${roomNumber} is full. Cannot add tenant.`;
         addTenantMessage.classList.add('text-danger');
         populateTenantRoomOptions(); // Refresh dropdown to reflect full status
         return;
     }

    const newTenant = {
        name: name,
        contact: contact,
        roomNumber: roomNumber,
        movingDate: movingDate,
        depositPaid: depositPaid,
        rentPaid: rentPaid, // Status for the current/upcoming rent cycle
        rentAmount: room.rentPerPerson, // Store rent amount for easy access
        depositAmount: room.depositPerPerson // Store deposit amount
        // bedNumber will be assigned in addTenantToStorage
    };

    if (addTenantToStorage(newTenant)) { // From storage.js (also adds user login)
        addTenantMessage.textContent = 'Tenant added successfully! Login details created.';
        addTenantMessage.classList.add('text-success');
        addTenantForm.reset(); // Clear form
        populateTenantsTable(); // Refresh tenant table
        populateRoomsTable(); // Refresh room table (occupancy changes)
        populatePendingPaymentsTable(); // Refresh payment table
        populateTenantRoomOptions(); // Refresh room dropdown availability
    } else {
        addTenantMessage.textContent = 'Error adding tenant. Please try again.';
        addTenantMessage.classList.add('text-danger');
    }
}

// Populate the View Tenants table
function populateTenantsTable() {
    const tenants = getTenants(); // From storage.js
    tenantsTableBody.innerHTML = ''; // Clear existing rows

    if (!tenants || tenants.length === 0) {
        tenantsTableBody.innerHTML = '<tr><td colspan="9" class="text-center">No tenants added yet.</td></tr>';
        return;
    }

    tenants.forEach(tenant => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tenant.name}</td>
            <td>${tenant.contact}</td>
            <td>${tenant.roomNumber}</td>
            <td>${tenant.bedNumber || 'N/A'}</td>
            <td>${tenant.movingDate}</td>
            <td>${tenant.rentAmount}</td>
            <td>
                 <input type="checkbox" class="form-check-input" ${tenant.depositPaid ? 'checked' : ''} onclick="updateTenantPayment('${tenant.id}', 'deposit', this.checked)">
                 <span class="ms-1">${tenant.depositPaid ? 'Paid' : 'Unpaid'}</span>
            </td>
             <td>
                 <input type="checkbox" class="form-check-input" ${tenant.rentPaid ? 'checked' : ''} onclick="updateTenantPayment('${tenant.id}', 'rent', this.checked)">
                 <span class="ms-1">${tenant.rentPaid ? 'Paid' : 'Unpaid'}</span>
             </td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="handleDeleteTenant('${tenant.id}')" title="Delete Tenant">
                     <i class="bi bi-trash"></i>
                 </button>
                 <!-- Add edit button later if needed -->
            </td>
        `;
        tenantsTableBody.appendChild(row);
    });
}

// Handle deleting a tenant
function handleDeleteTenant(tenantId) {
     const tenant = getTenantById(tenantId); // From storage.js
     if (!tenant) return;

     if (confirm(`Are you sure you want to delete tenant ${tenant.name} (Room ${tenant.roomNumber})? This will also remove their login access.`)) {
         if (deleteTenantFromStorage(tenantId)) { // from storage.js
            console.log(`Tenant ${tenantId} deleted.`);
            populateTenantsTable(); // Refresh tenants list
            populateRoomsTable(); // Refresh room occupancy
            populatePendingPaymentsTable(); // Refresh payments
            populateTenantRoomOptions(); // Refresh room dropdown availability
         } else {
             alert("Error deleting tenant. Please try again.");
         }
     }
}


// Update tenant payment status (called from checkboxes)
function updateTenantPayment(tenantId, paymentType, isPaid) {
    const tenant = getTenantById(tenantId); // from storage.js
    if (!tenant) {
        console.error(`Tenant ${tenantId} not found for payment update.`);
        return;
    }

    if (paymentType === 'deposit') {
        tenant.depositPaid = isPaid;
    } else if (paymentType === 'rent') {
        tenant.rentPaid = isPaid;
    }

    if (updateTenantInStorage(tenant)) { // from storage.js
        console.log(`Updated ${paymentType} status for tenant ${tenantId} to ${isPaid}`);
        // Refresh relevant tables
        populateTenantsTable();
        populatePendingPaymentsTable();
    } else {
        alert(`Failed to update ${paymentType} status. Please refresh and try again.`);
        // Optional: revert checkbox state if update fails
         populateTenantsTable(); // Re-render to potentially correct checkbox state
    }
}


// Populate the Pending Payments table
function populatePendingPaymentsTable() {
    const tenants = getTenants();
    pendingPaymentsTableBody.innerHTML = ''; // Clear existing rows
    let hasPending = false;

    tenants.forEach(tenant => {
        let pendingHtml = '';

        // Check for pending deposit
        if (!tenant.depositPaid) {
             hasPending = true;
             pendingHtml += `
                 <tr>
                     <td>${tenant.name}</td>
                     <td>${tenant.contact}</td>
                     <td>${tenant.roomNumber}</td>
                     <td>Deposit</td>
                     <td>${tenant.depositAmount}</td>
                     <td>
                         <button class="btn btn-sm btn-success" onclick="markPaymentAsPaid('${tenant.id}', 'deposit')">Mark as Paid</button>
                     </td>
                 </tr>
             `;
        }

        // Check for pending rent
        if (!tenant.rentPaid) {
             hasPending = true;
            pendingHtml += `
                 <tr>
                     <td>${tenant.name}</td>
                     <td>${tenant.contact}</td>
                     <td>${tenant.roomNumber}</td>
                     <td>Rent (Current Cycle)</td>
                     <td>${tenant.rentAmount}</td>
                      <td>
                         <button class="btn btn-sm btn-success" onclick="markPaymentAsPaid('${tenant.id}', 'rent')">Mark as Paid</button>
                     </td>
                 </tr>
             `;
        }
        pendingPaymentsTableBody.innerHTML += pendingHtml;

    });

    if (!hasPending) {
        pendingPaymentsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No pending payments found.</td></tr>';
    }
}

// Function called by the "Mark as Paid" button in the pending payments table
function markPaymentAsPaid(tenantId, paymentType) {
     const tenant = getTenantById(tenantId); // from storage.js
    if (!tenant) {
        console.error(`Tenant ${tenantId} not found.`);
        return;
    }

     if (paymentType === 'deposit') {
        tenant.depositPaid = true;
    } else if (paymentType === 'rent') {
        tenant.rentPaid = true;
    }

     if (updateTenantInStorage(tenant)) { // from storage.js
        console.log(`Marked ${paymentType} as paid for tenant ${tenantId}`);
        // Refresh relevant tables
        populateTenantsTable();
        populatePendingPaymentsTable();
    } else {
        alert(`Failed to mark ${paymentType} as paid. Please refresh and try again.`);
    }
}


// Initial setup for admin dashboard
function setupAdminDashboard() {
    console.log("Setting up Admin Dashboard...");
    updateCalculatedRent(); // Set initial rent calculation display
    populateFacilities(); // Create facility checkboxes
    populateRoomsTable(); // Load rooms on init
    populateTenantRoomOptions(); // Load room options for tenant form
    populateTenantsTable(); // Load tenants on init
    populatePendingPaymentsTable(); // Load pending payments

    // Add sidebar menu items for Admin
    const sidebarMenu = document.getElementById('sidebar-menu');
    sidebarMenu.innerHTML = `
        <li class="active"><a href="#" onclick="showAdminTab('add-room')"><i class="bi bi-plus-square-fill"></i> Add Room</a></li>
        <li><a href="#" onclick="showAdminTab('view-rooms')"><i class="bi bi-list-ul"></i> View Rooms</a></li>
        <li><a href="#" onclick="showAdminTab('add-tenant')"><i class="bi bi-person-plus-fill"></i> Add Tenant</a></li>
        <li><a href="#" onclick="showAdminTab('view-tenants')"><i class="bi bi-people-fill"></i> View Tenants</a></li>
        <li><a href="#" onclick="showAdminTab('pending-payments')"><i class="bi bi-currency-rupee"></i> Pending Payments</a></li>
    `;
     setActiveSidebarLink(); // Highlight the first link initially
}

// Function to switch admin tabs programmatically (used by sidebar links)
function showAdminTab(tabId) {
    const tabElement = document.getElementById(`${tabId}-tab`);
    if (tabElement) {
        const tab = new bootstrap.Tab(tabElement);
        tab.show();
        // Update active class on sidebar
        setActiveSidebarLink(tabId);
    }
}
// Function to set active link in sidebar
function setActiveSidebarLink(targetTabId = 'add-room') {
     const links = document.querySelectorAll('#sidebar-menu li a');
     links.forEach(link => {
         link.parentElement.classList.remove('active');
         // Check if the link's onclick points to the target tab
         if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(`showAdminTab('${targetTabId}')`)) {
             link.parentElement.classList.add('active');
         }
     });
}


// --- Event Listeners ---
if (addRoomForm) {
    addRoomForm.addEventListener('submit', handleAddRoom);
    roomTypeSelect.addEventListener('change', updateCalculatedRent);
    roomFoodSelect.addEventListener('change', updateCalculatedRent);
}
if (addTenantForm) {
    addTenantForm.addEventListener('submit', handleAddTenant);
}

// Refresh tables when their respective tabs are shown
if (viewRoomsTab) {
    viewRoomsTab.addEventListener('shown.bs.tab', populateRoomsTable);
}
if (viewTenantsTab) {
    viewTenantsTab.addEventListener('shown.bs.tab', populateTenantsTable);
}
if (pendingPaymentsTab) {
    pendingPaymentsTab.addEventListener('shown.bs.tab', populatePendingPaymentsTable);
}

// Initial call if needed immediately (or called by main script)
// setupAdminDashboard(); // This will be called from script.js when admin logs in