const apiKey = "AIzaSyAV8IDOZ-UOGt4IMYQT4Gey2RiKjygsrhw";
const projectId = "onlineshopping-3caf5";
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// DOM elements for products and modal
const productsContainer = document.getElementById('products');
const productModal = document.getElementById('product-modal');
const closeModal = document.getElementById('close-modal');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductName = document.getElementById('modal-product-name');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductPrice = document.getElementById('modal-product-price');
const quantityInput = document.getElementById('quantity');
const addToCartButton = document.getElementById('add-to-cart');
const searchBar = document.getElementById('search-bar');
const searchBtn = document.getElementById('search-btn');
const searchCategorySelect = document.getElementById('search-category-select'); // New category select element

// Fetch and display products
async function fetchProducts() {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Inventory?key=${apiKey}`);
        const productData = await response.json();
        const products = productData.documents || [];

        displayProducts(products);
    } catch (error) {
        console.error("Error fetching products: ", error);
    }
}

async function populateCategories() {
    try {
        const categoryResponse = await fetch(`${baseFirestoreUrl}/Category?key=${apiKey}`);
        const categoryData = await categoryResponse.json();
        const categories = categoryData.documents || [];

        // Populate the category dropdown
        searchCategorySelect.innerHTML = ''; // Clear previous options
        categories.forEach((doc) => {
            const categoryId = doc.name.split('/').pop(); // Get the category ID from document name
            const categoryName = doc.fields.Name.stringValue; // Get the category name
            
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

// Display products in the container
function displayProducts(products) {
    productsContainer.innerHTML = ''; // Clear previous products

    if (products.length === 0) {
        productsContainer.textContent = "No products available.";
        return;
    }

    products.forEach(doc => {
        const product = doc.fields;
        const productId = doc.name.split('/').pop(); // Extract product ID
        const productHtml = `
            <div class="product-card" onclick="openModal('${productId}')">
                <img src="${product.ImageURL.stringValue}" alt="${product.Title.stringValue}">
                <h3>${product.Title.stringValue}</h3>
            </div>
        `;
        productsContainer.innerHTML += productHtml;
    });
}

// Open modal and display product details
function openModal(productId) {
    // Fetch product details
    fetch(`${baseFirestoreUrl}/Inventory/${productId}?key=${apiKey}`)
        .then(response => response.json())
        .then(productData => {
            const product = productData.fields;
            modalProductImage.src = product.ImageURL.stringValue;
            modalProductName.textContent = product.Title.stringValue;
            modalProductDescription.textContent = product.Description.stringValue; // Assuming description exists
            modalProductPrice.textContent = product.Price.integerValue; // Assuming price is a double value
            quantityInput.value = 1; // Reset quantity to 1

            // Add event listener for Add to Cart button
            addToCartButton.onclick = () => addToCart(productId, product, parseInt(quantityInput.value));

            productModal.style.display = 'block'; // Show modal
        })
        .catch(error => console.error("Error fetching product details: ", error));
}

// Close the modal when the user clicks on <span> (x)
closeModal.onclick = function() {
    productModal.style.display = 'none';
}

// Close the modal when the user clicks anywhere outside of the modal
window.onclick = function(event) {
    if (event.target === productModal) {
        productModal.style.display = 'none';
    }
}

// Quantity adjustment
document.getElementById('increase-quantity').onclick = function() {
    quantityInput.value = parseInt(quantityInput.value) + 1;
};

document.getElementById('decrease-quantity').onclick = function() {
    if (parseInt(quantityInput.value) > 1) {
        quantityInput.value = parseInt(quantityInput.value) - 1;
    }
};

// Add to Cart function
async function addToCart(productId, product, quantity) {
    // Ensure productId and customerId are treated as numbers
    const customerId = Number(localStorage.getItem('CustomerID')); // Convert customer ID to number
    const price = product.Price.integerValue; // Get product price
    const imageUrl = product.ImageURL.stringValue; // Get product image URL
    const totalPrice = price * quantity; // Calculate total price for the new quantity

    try {
        // Fetch the current cart for the customer
        const response = await fetch(`${baseFirestoreUrl}/cart/${customerId}?key=${apiKey}`);
        const cartData = await response.json();

        let cartItems = cartData.fields?.items?.arrayValue?.values || []; // Get existing items or initialize as empty

        // Check if the product already exists in the cart
        const existingProductIndex = cartItems.findIndex(item => {
            const itemProductId = parseInt(item.mapValue.fields.productId.integerValue);
            return itemProductId === Number(productId);
        });

        if (existingProductIndex !== -1) {
            // Product exists, update quantity and total price
            const existingProduct = cartItems[existingProductIndex];
            const existingQuantity = parseInt(existingProduct.mapValue.fields.quantity.integerValue);
            const updatedQuantity = existingQuantity + quantity;
            const updatedTotalPrice = updatedQuantity * price;

            // Update the existing product's quantity and total price
            cartItems[existingProductIndex] = {
                mapValue: {
                    fields: {
                        productId: { integerValue: Number(productId) }, // Store productId as a number
                        quantity: { integerValue: updatedQuantity },
                        customerId: { integerValue: customerId }, // Store customerId as a number
                        productName: { stringValue: product.Title.stringValue },
                        price: { doubleValue: price },
                        imageUrl: { stringValue: imageUrl },
                        totalPrice: { doubleValue: updatedTotalPrice }
                    }
                }
            };
        } else {
            // Product doesn't exist, add a new item
            cartItems.push({
                mapValue: {
                    fields: {
                        productId: { integerValue: Number(productId) }, // Store productId as a number
                        quantity: { integerValue: quantity },
                        customerId: { integerValue: customerId }, // Store customerId as a number
                        productName: { stringValue: product.Title.stringValue },
                        price: { doubleValue: price },
                        imageUrl: { stringValue: imageUrl },
                        totalPrice: { doubleValue: totalPrice }
                    }
                }
            });
        }

        // Update the cart with the modified items array
        const updateResponse = await fetch(`${baseFirestoreUrl}/cart/${customerId}?key=${apiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    items: {
                        arrayValue: {
                            values: cartItems
                        }
                    }
                }
            })
        });

        if (updateResponse.ok) {
            alert('Product added to cart successfully!');
            productModal.style.display = 'none'; // Close modal after adding to cart
        } else {
            console.error("Error updating the cart: ", await updateResponse.json());
            alert('Failed to update cart.');
        }
    } catch (error) {
        console.error("Error adding to cart: ", error);
        alert('Failed to add product to cart.');
    }
}

// Search functionality
searchBtn.onclick = async function() {
    const searchQuery = searchBar.value.toLowerCase(); // Get search input
    const categoryId = searchCategorySelect.value; // Get selected category

    try {
        const response = await fetch(`${baseFirestoreUrl}/Inventory?key=${apiKey}`);
        const productData = await response.json();
        const products = productData.documents || [];

        // Filter products by category if selected
        let filteredProducts = products;
        if (categoryId) {
            filteredProducts = filteredProducts.filter(doc => 
                doc.fields.CatID.integerValue == categoryId
            );
        }

        // Further filter products by title if there's a search query
        if (searchQuery) {
            filteredProducts = filteredProducts.filter(doc => {
                const title = doc.fields.Title.stringValue.toLowerCase();
                return title.includes(searchQuery); // Filter products by title
            });
        }

        displayProducts(filteredProducts); // Display filtered products
    } catch (error) {
        console.error("Error fetching products: ", error);
    }
}

// Focus effect on navbar when dropdown is focused
const categorySelect = document.getElementById('search-category-select');
const navbar = document.querySelector('.header.nav');

categorySelect.addEventListener('focus', () => {
    navbar.classList.add('active'); // Add focus effect
});

// Remove focus effect when clicking elsewhere
document.addEventListener('click', (event) => {
    if (!navbar.contains(event.target) && !categorySelect.contains(event.target)) {
        navbar.classList.remove('active'); // Remove focus effect
    }
});


// Fetch products and categories when the page loads
window.onload = async function() {
    await fetchProducts();
    await populateCategories(); // Populate categories on load
};