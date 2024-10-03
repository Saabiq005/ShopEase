// Firebase configuration
const apiKey = "AIzaSyAV8IDOZ-UOGt4IMYQT4Gey2RiKjygsrhw";
const projectId = "onlineshopping-3caf5"; // Change to your project ID
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// DOM Elements
const categoryListElement = document.getElementById('category-list');
const addCategoryButton = document.getElementById('add-category-button');
const categoryForm = document.getElementById('category-form');
const categoryNameInput = document.getElementById('category-name');
const submitCategoryButton = document.getElementById('submit-category');

// Load categories from Firestore
async function loadCategories() {
    try {
        const categoryResponse = await fetch(`${baseFirestoreUrl}/Category?key=${apiKey}`);
        const categoryData = await categoryResponse.json();
        
        categoryListElement.innerHTML = ''; // Clear previous list
        const categories = categoryData.documents || [];
        categories.forEach((doc) => {
            const categoryId = doc.name.split('/').pop(); // Get the category ID
            const categoryName = doc.fields.Name.stringValue; // Change to 'Name' as per your structure

            const categoryItem = document.createElement('div');
            categoryItem.classList.add('category-item');
            categoryItem.textContent = `${categoryId}: ${categoryName}`;
            categoryListElement.appendChild(categoryItem);
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}

// Show form to add a category
addCategoryButton.addEventListener('click', () => {
    categoryForm.classList.toggle('hidden');
});

// Add a new category
submitCategoryButton.addEventListener('click', async () => {
    const categoryName = categoryNameInput.value.trim();
    if (categoryName) {
        try {
            // Get the current CatID from the counter
            const counterResponse = await fetch(`${baseFirestoreUrl}/Counters/countercat?key=${apiKey}`);
            const counterData = await counterResponse.json();
            const currentID = parseInt(counterData.fields.currentid.integerValue, 10);

            // Add new category to Firestore
            await fetch(`${baseFirestoreUrl}/Category/${currentID}?key=${apiKey}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields: {
                        CatID: { integerValue: currentID },
                        Name: { stringValue: categoryName }
                    }
                })
            });

            // Update currentID in the counter document
            await fetch(`${baseFirestoreUrl}/Counters/countercat?key=${apiKey}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields: {
                        currentid: { integerValue: currentID + 1 } // Update the counter
                    }
                })
            });

            // Show success popup
            alert("Category added successfully!");

            // Clear the input and reload categories
            categoryNameInput.value = '';
            loadCategories();
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Error adding category: " + error.message);
        }
    } else {
        alert("Please enter a category name.");
    }
});

// Initial load of categories
loadCategories();
