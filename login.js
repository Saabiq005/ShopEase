// Firebase configuration and constants
const apiKey = "AIzaSyAV8IDOZ-UOGt4IMYQT4Gey2RiKjygsrhw";
const projectId = "onlineshopping-3caf5";
const baseAuthUrl = `https://identitytoolkit.googleapis.com/v1/accounts`;
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// Form elements and greeting text
const loginContainer = document.getElementById('login-container');
const signupContainer = document.getElementById('signup-container');
const greetingText = document.getElementById('greeting-text');

// Toggle between login and sign-up forms
document.getElementById('show-signup').addEventListener('click', (e) => {
    e.preventDefault();
    loginContainer.style.display = 'none';
    signupContainer.style.display = 'block';
    greetingText.textContent = "Create Your Account";
});


document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    signupContainer.style.display = 'none';
    loginContainer.style.display = 'block';
    greetingText.textContent = "Welcome Back!";
});

// Sign Up form submission
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mobile = parseInt(document.getElementById('mobile').value, 10);

    try {
        const signupResponse = await fetch(`${baseAuthUrl}:signUp?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: true })
        });

        const signupData = await signupResponse.json();
        if (signupResponse.ok) {
            const counterDoc = await fetch(`${baseFirestoreUrl}/Counters/countercust?key=${apiKey}`);
            const counterData = await counterDoc.json();
            const countercust = parseInt(counterData.fields.currentid.integerValue, 10) + 1;

            await fetch(`${baseFirestoreUrl}/Customer/${countercust}?key=${apiKey}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields: {
                        CustomerID: { integerValue: countercust },
                        Name: { stringValue: name },
                        Email: { stringValue: email },
                        Mobile: { integerValue: mobile },
                        Credit:{integerValue: 0}
                    }
                })
            });

            await fetch(`${baseFirestoreUrl}/Counters/countercust?key=${apiKey}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields: { currentid: { integerValue: countercust } } })
            });

            alert('Sign Up Successful! Please log in.');
            document.getElementById('show-login').click(); // Switch back to login form
        } else {
            throw new Error(signupData.error.message);
        }
    } catch (error) {
        console.error("Error signing up: ", error);
        alert(error.message);
    }
});

// Login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const loginResponse = await fetch(`${baseAuthUrl}:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                returnSecureToken: true
            })
        });

        const loginData = await loginResponse.json();
        if (loginResponse.ok) {
            // Save email to local storage
            localStorage.setItem('userEmail', email);

            // Fetch the CustomerID from Firestore using the email
            const customerResponse = await fetch(`${baseFirestoreUrl}/Customer?key=${apiKey}`);
            const customerData = await customerResponse.json();

            const customers = customerData.documents || [];
            let customerId = null;

            // Find the CustomerID by matching the email
            for (const doc of customers) {
                const customerFields = doc.fields;
                if (customerFields.Email.stringValue === email) {
                    customerId = customerFields.CustomerID.integerValue;
                    break;
                }
            }

            if (customerId) {
                // Store CustomerID in local storage
                localStorage.setItem('CustomerID', customerId);

                // Redirect based on the user role
                if (email === 'saabiqahamed23@gmail.com') {
                    window.location.href = 'admin.html';  // Redirect to admin page for admin user
                } else {
                    alert('Login Successful!');
                    window.location.href = 'home.html'; // Redirect to user dashboard or homepage
                }
            } else {
                throw new Error("Customer record not found.");
            }
        } else {
            throw new Error(loginData.error.message);
        }
    } catch (error) {
        console.error("Error logging in: ", error);
        alert(error.message);
    }
});
