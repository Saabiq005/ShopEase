// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Fetch categories from Firestore to populate dropdown
const categorySelect = document.getElementById('categorySelect');
const messageDiv = document.getElementById('messageDiv');

async function loadCategories() {
    try {
        const snapshot = await getDocs(collection(db, 'Category'));
        categorySelect.innerHTML = '<option value="">Select a Category</option>';
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.data().CatID; // Use CatID as the value
            option.textContent = doc.data().Name; // Use Name as the display text
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading categories:", error);
        messageDiv.textContent = "Error loading categories: " + error.message;
    }
}

// Load categories on page load
loadCategories();

// Handle form submission
document.getElementById('inventoryForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent form from submitting normally

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const quantity = document.getElementById('quantity').value;
    const price = document.getElementById('price').value;
    const imageUrl = document.getElementById('imageUrl').value;
    const category = categorySelect.value;

    try {
        // Upload the image
        const imageRef = ref(storage, 'product_images/' + title); // Use title as the image name
        const response = await uploadBytes(imageRef, imageUrl);
        const url = await getDownloadURL(response.ref);

        // Add the product to Firestore
        await addDoc(collection(db, 'Inventory'), {
            Title: title,
            Description: description,
            Quantity: Number(quantity),
            Price: Number(price),
            ImageURL: url,
            CatID: Number(category)
        });

        messageDiv.textContent = "Successfully added!";
        document.getElementById('inventoryForm').reset(); // Reset the form
    } catch (error) {
        console.error("Error adding document:", error);
        messageDiv.textContent = "Error adding item: " + error.message;
    }
});
