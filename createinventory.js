const apiKey = "AIzaSyAV8IDOZ-UOGt4IMYQT4Gey2RiKjygsrhw";
const projectId = "onlineshopping-3caf5"; // Your project ID
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const baseStorageUrl = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o`;

// Fetch and populate categories in the dropdown
async function populateCategories() {
    const categorySelect = document.getElementById('category'); 

    try {
        const categoryResponse = await fetch(`${baseFirestoreUrl}/Category?key=${apiKey}`);
        const categoryData = await categoryResponse.json();

        
        const categories = categoryData.documents || [];
        categories.forEach((doc) => {
            const categoryId = doc.name.split('/').pop();
            const categoryName = doc.fields.Name.stringValue; 

            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categoryName;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching categories: ", error);
    }
}

// Add Product
document.getElementById('inventoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productName = document.getElementById('title').value; 
    const categoryId = document.getElementById('category').value; 
    const price = parseFloat(document.getElementById('price').value);
    const quantity = parseInt(document.getElementById('quantity').value, 10);
    const description = document.getElementById('description').value;
    const imageFile = document.getElementById('imageFile').files[0]; 

    try {
        // Upload the image to Firebase Storage
        const storageResponse = await fetch(`${baseStorageUrl}?uploadType=media&name=${encodeURIComponent(imageFile.name)}&key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': imageFile.type
            },
            body: imageFile
        });

        if (!storageResponse.ok) {
            throw new Error("Failed to upload image");
        }

        const storageData = await storageResponse.json();
        const imageUrl = `${baseStorageUrl}/${encodeURIComponent(imageFile.name)}?alt=media&token=${storageData.downloadTokens}`;

        // Get the next product ID
        const counterDoc = await fetch(`${baseFirestoreUrl}/Counters/counterprod?key=${apiKey}`);
        const counterData = await counterDoc.json();
        const currentCounter = parseInt(counterData.fields.currentid.integerValue, 10); 
        const productCounter = currentCounter + 1;

        // Add product to the Inventory collection
        await fetch(`${baseFirestoreUrl}/Inventory/${productCounter}?key=${apiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    Title: { stringValue: productName }, 
                    CatID: { integerValue: parseInt(categoryId, 10) }, 
                    Price: { doubleValue: price },
                    Quantity: { integerValue: quantity },
                    Description: { stringValue: description },
                    ImageURL: { stringValue: imageUrl },
                    productId: {integerValue: productCounter}
                }
            })
        });

        // Update product counter
        await fetch(`${baseFirestoreUrl}/Counters/counterprod?key=${apiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    currentid: { integerValue: productCounter } 
                }
            })
        });

        alert('Product added successfully!');
        document.getElementById('inventoryForm').reset(); 
    } catch (error) {
        console.error("Error adding product: ", error);
        alert(error.message);
    }
});

// Populate categories when the page loads
window.onload = populateCategories;
