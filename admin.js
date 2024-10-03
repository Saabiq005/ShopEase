// Logout functionality
document.getElementById('logout-btn').addEventListener('click', function() {
    localStorage.removeItem('userEmail');
    window.location.href = 'login.html'; // Redirect to login page
});

// Manage Inventory toggle
document.getElementById('manage-inventory-btn').addEventListener('click', function() {
    toggleSubButtons('inventory-sub-buttons');
});

// Customer Management toggle
document.getElementById('customer-management-btn').addEventListener('click', function() {
    toggleSubButtons('customer-sub-buttons');
});

// Toggle Reports
document.getElementById('reports-btn').addEventListener('click', function() {
    toggleSubButtons('reports-sub-buttons');
});

// Function to toggle visibility of sub-buttons
function toggleSubButtons(subButtonId) {
    const subButtons = document.getElementById(subButtonId);
    if (subButtons.style.display === 'none' || subButtons.style.display === '') {
        subButtons.style.display = 'flex'; // Show sub-buttons
    } else {
        subButtons.style.display = 'none'; // Hide sub-buttons
    }
}
