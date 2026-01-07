// Global variables to store selection
let currentPricePerHour = 0;
let currentDuration = 1;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    updateTotal();
    
    // Add event listeners to input fields to remove error styling when user types
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('input-error');
        });
    });
});

/**
 * Updates the total price based on selected tutor and duration
 */
function updateTotal() {
    // 1. Get Selected Tutor Price
    const selectedTutor = document.querySelector('input[name="tutor_data"]:checked');
    if (selectedTutor) {
        // We get the price from the data-price attribute we added in PHP
        currentPricePerHour = parseFloat(selectedTutor.dataset.price);
    }

    // 2. Get Selected Duration
    const durationSelect = document.getElementById('hoursInput');
    if (durationSelect) {
        currentDuration = parseInt(durationSelect.value);
    }

    // 3. Calculate Total
    const total = currentPricePerHour * currentDuration;

    // 4. Update UI
    // Update the text in Step 2
    const totalDisplay = document.getElementById('totalDisplay');
    if (totalDisplay) {
        totalDisplay.innerText = total.toFixed(2);
    }

    // Update the text in Step 3 (Payment Summary)
    const paymentTotal = document.getElementById('paymentTotal');
    if (paymentTotal) {
        paymentTotal.innerText = total.toFixed(2);
    }
}

/**
 * Validates inputs and moves to the Payment Step (Step 3)
 */
function showPaymentStep() {
    // 1. Check if Tutor is selected
    const selectedTutor = document.querySelector('input[name="tutor_data"]:checked');
    if (!selectedTutor) {
        alert("Please select a tutor first.");
        // Highlight Step 1
        switchTab(1);
        return;
    }

    // 2. Check if Details are filled
    const requiredIds = ['startDate', 'sessionType', 'phoneNumber', 'commMethod'];
    let isValid = true;

    requiredIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !el.value) {
            if(el) el.classList.add('input-error'); // Add red border defined in your CSS
            isValid = false;
        }
    });

    if (!isValid) {
        alert("Please fill in all required session details.");
        switchTab(2); // Go to step 2 so they can fill it
        return;
    }

    // 3. If valid, show Step 3
    switchTab(3);
}

/**
 * Moves back to Step 2
 */
function backToDetails() {
    switchTab(2);
}

/**
 * Handles the logic for switching tabs and hiding/showing sections
 * @param {number} stepNumber - 1, 2, or 3
 */
function switchTab(stepNumber) {
    // 1. Hide all steps
    document.getElementById('tutor-step').style.display = 'none';
    document.getElementById('details-step').style.display = 'none';
    document.getElementById('transaction-step').style.display = 'none';

    // 2. Show the requested step
    if (stepNumber === 1) {
        document.getElementById('tutor-step').style.display = 'block';
        animateFade('#tutor-step');
    } else if (stepNumber === 2) {
        document.getElementById('details-step').style.display = 'block';
        animateFade('#details-step');
    } else if (stepNumber === 3) {
        document.getElementById('transaction-step').style.display = 'block';
        animateFade('#transaction-step');
    }

    // 3. Update Progress Bar (The Pill)
    // Remove 'active' from all
    document.querySelectorAll('.progress-tab').forEach(tab => tab.classList.remove('active'));

    // Add 'active' to current
    const activeTab = document.getElementById('tab' + stepNumber);
    if(activeTab) activeTab.classList.add('active');
}

/**
 * Simple fade-in animation using Anime.js (since you included the CDN)
 */
function animateFade(selector) {
    if (typeof anime !== 'undefined') {
        anime({
            targets: selector,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 500,
            easing: 'easeOutExpo'
        });
    }
}