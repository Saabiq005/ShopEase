const apiKey = "AIzaSyAV8IDOZ-UOGt4IMYQT4Gey2RiKjygsrhw";
const projectId = "onlineshopping-3caf5"; // Updated project ID
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const baseStorageUrl = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o`;
let products = [];
let currentPage = 1;
let itemsPerPage = 5; // Default items per page

// DOM elements
const readMethodSelect = document.getElementById('read-method');
const readResults = document.getElementById('read-results');
const readNameSection = document.getElementById('read-name');
const readCategorySection = document.getElementById('read-category');
const searchCategorySelect = document.getElementById('search-category');
const editForm = document.getElementById('edit-form'); // Edit form element
const editTitleInput = document.getElementById('edit-title'); // Title input in edit form
const editDescInput = document.getElementById('edit-description'); // Description input in edit form
const editCatInput = document.getElementById('edit-category'); // Category input in edit form
const editPriceInput = document.getElementById('edit-price'); // Price input in edit form
const editQuantityInput = document.getElementById('edit-quantity'); // Quantity input in edit form
const editImageInput = document.getElementById('edit-image-url'); // Image URL input in edit form
let currentEditProductId = null; // Store current editing product ID

// Show the appropriate search section based on selection
readMethodSelect.addEventListener('change', () => {
    const method = readMethodSelect.value;
    readNameSection.style.display = method === 'name' ? 'block' : 'none';
    readCategorySection.style.display = method === 'category' ? 'block' : 'none';

    if (method === 'all') {
        fetchAllProducts();
    }
});

// Fetch all products
async function fetchAllProducts() {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Inventory?key=${apiKey}`);
        const productData = await response.json();
        products = productData.documents || [];
        displayProducts();
    } catch (error) {
        console.error("Error fetching all products: ", error);
    }
}

// Fetch and display products by name
document.getElementById('search-by-name').addEventListener('click', async () => {
    const productTitle = document.getElementById('search-name').value.trim();
    if (productTitle) {
        await fetchProductsByName(productTitle);
    }
});

// Fetch and display products by category
document.getElementById('search-by-category').addEventListener('click', async () => {
    const categoryId = searchCategorySelect.value;
    await fetchProductsByCategory(categoryId);
});

// Fetch products by name
async function fetchProductsByName(title) {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Inventory?key=${apiKey}`);
        const productData = await response.json();
        products = (productData.documents || []).filter(doc => 
            doc.fields.Title.stringValue.toLowerCase().includes(title.toLowerCase())
        );
        currentPage = 1; // Reset to first page
        displayProducts();
    } catch (error) {
        console.error("Error fetching products by name: ", error);
    }
}

// Fetch products by category
async function fetchProductsByCategory(categoryId) {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Inventory?key=${apiKey}`);
        const productData = await response.json();
        products = (productData.documents || []).filter(doc => 
            doc.fields.CatID.integerValue == categoryId
        );
        currentPage = 1; // Reset to first page
        displayProducts();
    } catch (error) {
        console.error("Error fetching products by category: ", error);
    }
}

// Display products based on pagination
function displayProducts() {
    readResults.innerHTML = ''; // Clear previous results

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = products.slice(startIndex, endIndex);

    if (currentProducts.length === 0) {
        readResults.textContent = "No products found.";
        return;
    }

    currentProducts.forEach((doc) => {
        const product = doc.fields;

        const title = product.Title?.stringValue || "No Title";
        const description = product.Description?.stringValue || "No Description";
        const categoryId = product.CatID?.integerValue || "No Category ID";
        const categoryName = categoryMap[categoryId] || "Unknown Category"; // Get category name from map
        const price = product.Price?.integerValue || "No Price";
        const quantity = product.Quantity?.integerValue || "No Quantity";
        const imageUrl = product.ImageURL?.stringValue || ""; // Default to empty string if not found

        const productId = doc.name.split('/').pop(); // Get the product ID from the document path

        const productHtml = 
            `<div class="product-item">
                <h3 style="font-weight: bold;">${title}</h3>
                <p><strong>Description:</strong> ${description}</p>
                <p><strong>Category:</strong> ${categoryName}</p>
                <p><strong>Price:</strong> $${price}</p>
                <p><strong>Quantity:</strong> ${quantity}</p>
                <img src="${imageUrl}" alt="Product Image" style="width: 100px;">
                <div class="product-actions">
                    <button onclick="deleteProduct('${productId}')">🗑️</button>
                    <button onclick="showEditForm('${productId}')">✏️</button> <!-- Edit button -->
                </div>
            </div>`;
        readResults.innerHTML += productHtml;
    });

    // Update pagination buttons and info
    updatePagination();
}

// Update pagination buttons and info
function updatePagination() {
    const totalPages = Math.ceil(products.length / itemsPerPage);
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;

    document.getElementById('prev-page').style.display = currentPage > 1 ? 'inline-block' : 'none';
    document.getElementById('next-page').style.display = currentPage < totalPages ? 'inline-block' : 'none';
}

// Set items per page
document.getElementById('set-items-per-page').addEventListener('click', () => {
    const itemsPerPageInput = document.getElementById('items-per-page').value;
    itemsPerPage = parseInt(itemsPerPageInput, 10) || 5; // Default to 5 if invalid
    currentPage = 1; // Reset to first page
    displayProducts(); // Re-display products
});

// Populate categories when the page loads
let categoryMap = {}; // Object to store CatID and corresponding category name

async function populateCategories() {
    try {
        const categoryResponse = await fetch(`${baseFirestoreUrl}/Category?key=${apiKey}`);
        const categoryData = await categoryResponse.json();
        const categories = categoryData.documents || [];

        // Populate the category dropdown and the category map
        searchCategorySelect.innerHTML = ''; // Clear previous options
        categories.forEach((doc) => {
            const categoryId = doc.name.split('/').pop(); // Get the category ID from document name
            const categoryName = doc.fields.Name.stringValue; // Get the category name
            categoryMap[categoryId] = categoryName; // Store it in the map

            // Create and append option to dropdown
            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categoryName;
            searchCategorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching categories: ", error);
    }
}

// Show edit form and populate it with existing product data
async function showEditForm(productId) {
    const product = products.find(p => p.name.split('/').pop() === productId);
    if (product) {
        currentEditProductId = productId; // Set the current product ID for editing
        editTitleInput.value = product.fields.Title.stringValue;
        editDescInput.value = product.fields.Description.stringValue;
        editCatInput.value = product.fields.CatID.integerValue;
        editPriceInput.value = product.fields.Price.integerValue;
        editQuantityInput.value = product.fields.Quantity.integerValue;
        editImageInput.value = product.fields.ImageURL.stringValue; // Populate image URL

        editForm.style.display = 'block'; // Show the edit form
    }
}

// Update product details
document.getElementById('update-product').addEventListener('click', async () => {
    const updatedProduct = {
        fields: {
            Title: { stringValue: editTitleInput.value },
            Description: { stringValue: editDescInput.value },
            CatID: { integerValue: parseInt(editCatInput.value) },
            Price: { integerValue: parseFloat(editPriceInput.value) },
            Quantity: { integerValue: parseInt(editQuantityInput.value) },
            ImageURL: { stringValue: editImageInput.value } // Include image URL
        }
    };

    try {
        const response = await fetch(`${baseFirestoreUrl}/Inventory/${currentEditProductId}?key=${apiKey}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedProduct)
        });

        if (response.ok) {
            console.log("Product updated successfully!");
            editForm.style.display = 'none'; // Hide the form after updating
            fetchAllProducts(); // Refresh the product list
        } else {
            console.error("Error updating product: ", response.statusText);
        }
    } catch (error) {
        console.error("Error updating product: ", error);
    }
});

// Delete product
async function deleteProduct(productId) {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Inventory/${productId}?key=${apiKey}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            console.log("Product deleted successfully!");
            fetchAllProducts(); // Refresh the product list after deletion
        } else {
            console.error("Error deleting product: ", response.statusText);
        }
    } catch (error) {
        console.error("Error deleting product: ", error);
    }
}

// Initial function calls
populateCategories();
fetchAllProducts();
