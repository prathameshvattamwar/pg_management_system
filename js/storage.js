// js/storage.js

const STORAGE_KEY = 'pgManagementData';

// Default facilities list
const defaultFacilities = [
    "AC", "Non-AC", "Refrigerator", "Cooler", "Water Heater", "Wifi",
    "Bed", "Cupboard", "24hr Drinking Water", "24hr Usage Water",
    "Study Table", "Chair", "Attached Bathroom"
];

// Initialize storage with default structure if it doesn't exist
function initializeStorage() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const defaultData = {
            users: [
                // Default admin user
                { username: 'admin', password: 'password', role: 'admin' }
            ],
            rooms: [],
            tenants: [],
            complaints: [], // Added for tenant feature
            notices: [     // Added for tenant feature
                { id: Date.now(), text: "Welcome to the PG! Please maintain cleanliness.", date: new Date().toLocaleDateString() }
            ]
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
        console.log("Initialized Local Storage with default data.");
    }
}

// Get all data from storage
function getAllData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
}

// Save all data to storage
function saveData(data) {
    if (data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
        console.error("Attempted to save null or undefined data.");
    }
}

// Generate a simple unique ID (using timestamp + random number)
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
}

// --- Specific Data Access Functions ---

function getUsers() {
    const data = getAllData();
    return data ? data.users : [];
}

function getRooms() {
    const data = getAllData();
    return data ? data.rooms : [];
}

function getTenants() {
    const data = getAllData();
    return data ? data.tenants : [];
}

function getComplaints() {
    const data = getAllData();
    return data ? data.complaints : [];
}

function getNotices() {
     const data = getAllData();
    return data ? data.notices : [];
}

// Add a new room
function addRoomToStorage(room) {
    const data = getAllData();
    if (data) {
        room.id = generateId(); // Assign unique ID
        data.rooms.push(room);
        saveData(data);
        return true;
    }
    return false;
}

// Update an existing room (e.g., when adding/removing tenants)
function updateRoomInStorage(updatedRoom) {
    const data = getAllData();
    if (data && data.rooms) {
        const index = data.rooms.findIndex(r => r.id === updatedRoom.id);
        if (index !== -1) {
            data.rooms[index] = updatedRoom;
            saveData(data);
            return true;
        }
    }
    return false;
}
// Delete room
function deleteRoomFromStorage(roomId) {
    const data = getAllData();
     if (data && data.rooms) {
        const initialLength = data.rooms.length;
        data.rooms = data.rooms.filter(r => r.id !== roomId);
        if (data.rooms.length < initialLength) {
             // Also remove tenants associated with this room
             const tenantsInRoom = data.tenants.filter(t => t.roomNumber === getRoomByRoomId(roomId)?.roomNumber); // Use original room number if needed
             if (tenantsInRoom.length > 0) {
                 console.warn(`Deleting room ${roomId}. Associated tenants should be handled (e.g., moved or logins removed). Currently removing tenant entries.`);
                 // Remove associated users
                 tenantsInRoom.forEach(tenant => {
                    data.users = data.users.filter(u => u.tenantId !== tenant.id);
                 });
                 // Remove associated tenants
                 data.tenants = data.tenants.filter(t => t.roomNumber !== getRoomByRoomId(roomId)?.roomNumber);
             }
            saveData(data);
            return true;
        }
    }
    return false;
}


// Add a new tenant (also adds a user login for the tenant)
function addTenantToStorage(tenant) {
    const data = getAllData();
    if (data) {
        tenant.id = generateId(); // Assign unique ID
        tenant.bedNumber = assignBedNumber(tenant.roomNumber); // Assign next available bed
        data.tenants.push(tenant);

        // Add corresponding user login
        const tenantUser = {
            username: tenant.contact, // Use contact as username
            // Simple default password - NOT SECURE FOR REAL APPS
            password: `${tenant.name.split(' ')[0]}@${tenant.roomNumber}`,
            role: 'tenant',
            tenantId: tenant.id // Link user to tenant record
        };
        data.users.push(tenantUser);

        // Update room occupancy
        const room = data.rooms.find(r => r.roomNumber === tenant.roomNumber);
        if(room) {
             if (!room.tenantIds) {
                room.tenantIds = [];
            }
            room.tenantIds.push(tenant.id);
        } else {
            console.error(`Room ${tenant.roomNumber} not found when adding tenant ${tenant.name}`);
            // Handle error: maybe don't add tenant or notify admin
            return false; // Indicate failure
        }


        saveData(data);
        console.log(`Tenant ${tenant.name} added. Login - User: ${tenantUser.username}, Pass: ${tenantUser.password}`);
        return true;
    }
    return false;
}

// Update tenant details (e.g., payment status)
function updateTenantInStorage(updatedTenant) {
    const data = getAllData();
    if (data && data.tenants) {
        const index = data.tenants.findIndex(t => t.id === updatedTenant.id);
        if (index !== -1) {
            data.tenants[index] = updatedTenant;
            saveData(data);
            return true;
        }
    }
     console.error(`Tenant with ID ${updatedTenant.id} not found for update.`);
    return false;
}

// Delete tenant
function deleteTenantFromStorage(tenantId) {
    const data = getAllData();
    if (data && data.tenants) {
        const tenantIndex = data.tenants.findIndex(t => t.id === tenantId);
        if (tenantIndex !== -1) {
            const tenant = data.tenants[tenantIndex];
            const roomNumber = tenant.roomNumber;

            // Remove tenant from tenants array
            data.tenants.splice(tenantIndex, 1);

            // Remove tenant from associated user logins
            data.users = data.users.filter(u => u.tenantId !== tenantId);

            // Remove tenant ID from the room's tenant list
            const room = data.rooms.find(r => r.roomNumber === roomNumber);
            if (room && room.tenantIds) {
                room.tenantIds = room.tenantIds.filter(id => id !== tenantId);
            }

            saveData(data);
            console.log(`Tenant ${tenantId} and associated user login deleted.`);
            return true;
        }
    }
    console.error(`Tenant with ID ${tenantId} not found for deletion.`);
    return false;
}


// Add a new complaint
function addComplaintToStorage(complaint) {
    const data = getAllData();
    if (data) {
        complaint.id = generateId();
        complaint.date = new Date().toLocaleString();
        complaint.status = 'Pending'; // Initial status
        if (!data.complaints) data.complaints = []; // Ensure array exists
        data.complaints.push(complaint);
        saveData(data);
        return true;
    }
    return false;
}

// Find room by Room Number
function getRoomByRoomNumber(roomNumber) {
    const rooms = getRooms();
    return rooms.find(room => room.roomNumber === roomNumber);
}
// Find room by Room ID
function getRoomByRoomId(roomId) {
    const rooms = getRooms();
    return rooms.find(room => room.id === roomId);
}


// Find tenant by Tenant ID
function getTenantById(tenantId) {
    const tenants = getTenants();
    return tenants.find(tenant => tenant.id === tenantId);
}

// Find tenants by Room Number
function getTenantsByRoomNumber(roomNumber) {
    const tenants = getTenants();
    return tenants.filter(tenant => tenant.roomNumber === roomNumber);
}

// Assign the next available bed number in a room
function assignBedNumber(roomNumber) {
    const tenantsInRoom = getTenantsByRoomNumber(roomNumber);
    const assignedBeds = tenantsInRoom.map(t => t.bedNumber);
    let nextBed = 1;
    while (assignedBeds.includes(nextBed)) {
        nextBed++;
    }
    const room = getRoomByRoomNumber(roomNumber);
    if (room && nextBed > room.capacity) {
        console.error(`Cannot assign bed number ${nextBed} to room ${roomNumber}. Room capacity is ${room.capacity}.`);
        return null; // Indicate error or full room
    }
    return nextBed;
}


// --- Initialization ---
initializeStorage(); // Ensure storage is set up when script loads