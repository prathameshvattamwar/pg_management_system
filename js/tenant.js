// js/tenant.js

// --- DOM Elements ---
const tenantInfoName = document.getElementById('tenant-info-name');
const tenantInfoContact = document.getElementById('tenant-info-contact');
const tenantInfoMovein = document.getElementById('tenant-info-movein');
const tenantInfoDeposit = document.getElementById('tenant-info-deposit');
const tenantInfoRent = document.getElementById('tenant-info-rent');
const tenantInfoRentAmount = document.getElementById('tenant-info-rent-amount');

const tenantRoomInfoNumber = document.getElementById('tenant-room-info-number');
const tenantRoomInfoType = document.getElementById('tenant-room-info-type');
const tenantRoomInfoFood = document.getElementById('tenant-room-info-food');
const tenantRoomInfoBed = document.getElementById('tenant-room-info-bed');
const tenantRoomInfoFacilities = document.getElementById('tenant-room-info-facilities');
const tenantRoomInfoRules = document.getElementById('tenant-room-info-rules');

const occupancyTotal = document.getElementById('occupancy-total');
const occupancyOccupied = document.getElementById('occupancy-occupied');
const occupancyAvailable = document.getElementById('occupancy-available');
const roomPartnersList = document.getElementById('room-partners-list');

const addComplaintForm = document.getElementById('add-complaint-form');
const complaintTypeSelect = document.getElementById('complaint-type');
const complaintDetailsTextarea = document.getElementById('complaint-details');
const addComplaintMessage = document.getElementById('add-complaint-message');
const complaintsListUl = document.getElementById('complaints-list');

const noticesListDiv = document.getElementById('notices-list');

// --- Functions ---

// Load and display tenant's personal details
function loadTenantDetails(tenant) {
    if (!tenant) return;
    tenantInfoName.textContent = tenant.name;
    tenantInfoContact.textContent = tenant.contact;
    tenantInfoMovein.textContent = tenant.movingDate;
    tenantInfoDeposit.textContent = tenant.depositPaid ? 'Paid' : 'Pending';
    tenantInfoRent.textContent = tenant.rentPaid ? 'Paid (Current Cycle)' : 'Pending (Current Cycle)';
    tenantInfoRentAmount.textContent = tenant.rentAmount;

     // Add styling based on payment status
    tenantInfoDeposit.className = tenant.depositPaid ? 'badge bg-success' : 'badge bg-warning text-dark';
    tenantInfoRent.className = tenant.rentPaid ? 'badge bg-success' : 'badge bg-warning text-dark';
}

// Load and display tenant's room details and occupancy
function loadTenantRoomDetails(tenant) {
    if (!tenant || !tenant.roomNumber) return;

    const room = getRoomByRoomNumber(tenant.roomNumber); // from storage.js
    if (!room) {
        console.error(`Room ${tenant.roomNumber} not found for tenant ${tenant.id}`);
        // Display an error message in the UI
        document.getElementById('my-room-content').innerHTML = '<p class="text-danger">Error: Could not load room details. Please contact admin.</p>';
        return;
    }

    // Room Info
    tenantRoomInfoNumber.textContent = room.roomNumber;
    tenantRoomInfoType.textContent = room.type;
    tenantRoomInfoFood.textContent = room.food;
    tenantRoomInfoBed.textContent = tenant.bedNumber || 'N/A'; // Display tenant's own bed number
    tenantRoomInfoFacilities.textContent = room.facilities.join(', ') || 'None';
    tenantRoomInfoRules.textContent = room.rules.join(', ') || 'None';

    // Occupancy Info
    const tenantsInRoom = getTenantsByRoomNumber(room.roomNumber); // from storage.js
    const occupiedBeds = tenantsInRoom.length;
    const totalBeds = room.capacity;
    const availableBeds = totalBeds - occupiedBeds;

    occupancyTotal.textContent = totalBeds;
    occupancyOccupied.textContent = occupiedBeds;
    occupancyAvailable.textContent = availableBeds;

    // Room Partners List
    roomPartnersList.innerHTML = ''; // Clear previous list
    if (tenantsInRoom.length > 0) {
        tenantsInRoom.forEach(partner => {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item');
            // Don't show the current tenant's own name in the partner list explicitly,
            // but show bed numbers for everyone for clarity.
            let partnerName = (partner.id === tenant.id) ? "(You)" : partner.name; // Optional: Mark the current user
            listItem.textContent = `Bed ${partner.bedNumber}: ${partnerName}`;
            roomPartnersList.appendChild(listItem);
        });
    } else {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        listItem.textContent = 'No other occupants in this room yet.';
        roomPartnersList.appendChild(listItem);
    }
}

// Handle Add Complaint form submission
function handleAddComplaint(event, tenant) {
     event.preventDefault();
     addComplaintMessage.textContent = '';
     addComplaintMessage.className = 'mt-2';

     const type = complaintTypeSelect.value;
     const details = complaintDetailsTextarea.value.trim();

     if (!type || !details) {
         addComplaintMessage.textContent = 'Please select type and provide details.';
         addComplaintMessage.classList.add('text-warning');
         return;
     }

     const newComplaint = {
         tenantId: tenant.id,
         tenantName: tenant.name, // Store name for easier display (optional)
         roomNumber: tenant.roomNumber, // Store room number (optional)
         type: type,
         details: details,
         // Status and date will be added in storage function
     };

     if (addComplaintToStorage(newComplaint)) { // from storage.js
         addComplaintMessage.textContent = 'Complaint submitted successfully.';
         addComplaintMessage.classList.add('text-success');
         addComplaintForm.reset();
         loadComplaints(tenant); // Refresh the list
     } else {
          addComplaintMessage.textContent = 'Error submitting complaint. Please try again.';
         addComplaintMessage.classList.add('text-danger');
     }
}

// Load and display tenant's past complaints
function loadComplaints(tenant) {
    const allComplaints = getComplaints(); // from storage.js
    const myComplaints = allComplaints.filter(c => c.tenantId === tenant.id)
                                       .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first

    complaintsListUl.innerHTML = ''; // Clear list

    if (myComplaints.length === 0) {
        complaintsListUl.innerHTML = '<li class="list-group-item">No complaints submitted yet.</li>';
        return;
    }

    myComplaints.forEach(complaint => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');

         let statusBadge;
         switch (complaint.status?.toLowerCase()) {
             case 'pending': statusBadge = '<span class="badge bg-warning text-dark">Pending</span>'; break;
             case 'resolved': statusBadge = '<span class="badge bg-success">Resolved</span>'; break;
             case 'in progress': statusBadge = '<span class="badge bg-info text-dark">In Progress</span>'; break;
             default: statusBadge = `<span class="badge bg-secondary">${complaint.status || 'Unknown'}</span>`;
         }

        listItem.innerHTML = `
            <div class="ms-2 me-auto">
                <div class="fw-bold">${complaint.type}</div>
                ${complaint.details}
                <div class="text-muted small mt-1">${complaint.date}</div>
            </div>
            ${statusBadge}
        `;
        complaintsListUl.appendChild(listItem);
    });
}


// Load and display notices from admin
function loadNotices() {
    const notices = getNotices().sort((a, b) => b.id - a.id); // Get notices, sort newest first (by ID/timestamp)
    noticesListDiv.innerHTML = ''; // Clear previous

    if (notices.length === 0) {
        noticesListDiv.innerHTML = '<p>No notices available at the moment.</p>';
        return;
    }

    notices.forEach(notice => {
        const noticeCard = document.createElement('div');
        noticeCard.classList.add('alert', 'alert-info'); // Use Bootstrap alert component
        noticeCard.setAttribute('role', 'alert');
        noticeCard.innerHTML = `
            <h5 class="alert-heading">Notice</h5>
            <p>${notice.text}</p>
            <hr>
            <p class="mb-0 small text-muted">Posted on: ${notice.date || new Date(notice.id).toLocaleDateString()}</p>
        `;
        noticesListDiv.appendChild(noticeCard);
    });
}

// Initial setup for tenant dashboard
function setupTenantDashboard() {
    console.log("Setting up Tenant Dashboard...");
    const loggedInUser = getLoggedInUser(); // from auth.js
    if (!loggedInUser || loggedInUser.role !== 'tenant' || !loggedInUser.tenantId) {
        console.error("Cannot setup tenant dashboard: Invalid user data.");
        handleLogout(); // Log out if data is inconsistent
        return;
    }

    const tenant = getTenantById(loggedInUser.tenantId); // from storage.js
    if (!tenant) {
         console.error(`Cannot setup tenant dashboard: Tenant data not found for ID ${loggedInUser.tenantId}.`);
         alert("Error loading your details. Please try logging in again or contact admin.");
         handleLogout();
         return;
    }

    // Load data into the respective sections
    loadTenantDetails(tenant);
    loadTenantRoomDetails(tenant);
    loadComplaints(tenant);
    loadNotices();

    // Add sidebar menu items for Tenant
    const sidebarMenu = document.getElementById('sidebar-menu');
    sidebarMenu.innerHTML = `
        <li class="active"><a href="#" onclick="showTenantTab('my-details')"><i class="bi bi-person-circle"></i> My Details</a></li>
        <li><a href="#" onclick="showTenantTab('my-room')"><i class="bi bi-house-door-fill"></i> My Room</a></li>
        <li><a href="#" onclick="showTenantTab('complaints')"><i class="bi bi-tools"></i> Complaints</a></li>
        <li><a href="#" onclick="showTenantTab('notices')"><i class="bi bi-megaphone-fill"></i> Notices</a></li>
    `;
    setTenantActiveSidebarLink(); // Highlight the first link

    // Add event listener for complaint form, passing the tenant object
    if (addComplaintForm) {
        // Remove previous listener if any to avoid multiple submissions
        const newComplaintForm = addComplaintForm.cloneNode(true);
        addComplaintForm.parentNode.replaceChild(newComplaintForm, addComplaintForm);
        // Add the new listener
        newComplaintForm.addEventListener('submit', (event) => handleAddComplaint(event, tenant));
         // Update form reference
         addComplaintForm = newComplaintForm;
    }

}

// Function to switch tenant tabs programmatically
function showTenantTab(tabId) {
    const tabElement = document.getElementById(`${tabId}-tab`);
    if (tabElement) {
        const tab = new bootstrap.Tab(tabElement);
        tab.show();
        setTenantActiveSidebarLink(tabId);
    }
}
// Function to set active link in tenant sidebar
function setTenantActiveSidebarLink(targetTabId = 'my-details') {
     const links = document.querySelectorAll('#sidebar-menu li a');
     links.forEach(link => {
         link.parentElement.classList.remove('active');
         // Check if the link's onclick points to the target tab
         if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(`showTenantTab('${targetTabId}')`)) {
             link.parentElement.classList.add('active');
         }
     });
}

// --- Event Listeners ---
// Tab listeners to potentially refresh data if needed (optional for now)
// document.getElementById('my-details-tab')?.addEventListener('shown.bs.tab', () => { /* maybe reload details */ });


// Initial call handled by script.js upon login verification