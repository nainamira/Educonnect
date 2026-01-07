document.addEventListener('DOMContentLoaded', async function() {
    const tutorGrid = document.querySelector('.tutor-grid');
    const searchInput = document.getElementById('searchInput');
    const priceSlider = document.getElementById('priceSlider');
    const priceDisplay = document.getElementById('priceValue');
    const checkboxes = document.querySelectorAll('.category-checkbox');
    const resetBtn = document.getElementById('resetBtn');
    
    // Ensure this matches your server port (usually 5000 or 3000)
    const API_URL = 'http://localhost:5000/api';
    let allTutors = []; 

    async function loadTutors() {
        try {
            const response = await fetch(`${API_URL}/tutors`);
            const result = await response.json();
            
            if (result.success) {
                allTutors = result.data;
                renderTutors(allTutors);
            }
        } catch (err) {
            console.error("Error loading tutors:", err);
            tutorGrid.innerHTML = "<p>Error loading tutors. Please try again later.</p>";
        }
    }

    function renderTutors(tutorList) {
        if (tutorList.length === 0) {
            tutorGrid.innerHTML = "<p>No tutors match your search.</p>";
            return;
        }

        tutorGrid.innerHTML = tutorList.map(tutor => `
            <div class="tutor-card">
                <div class="tutor-info">
                    <h3 class="tutor-name">${tutor.full_name}</h3>
                    <p class="tutor-subject"><strong>${tutor.subject || 'Expert'}</strong></p>
                    <p class="tutor-bio">${tutor.bio || 'No bio available.'}</p>
                    <div class="tutor-meta" style="display:flex; justify-content: space-between; margin-top:10px;">
                        <span>⭐ ${tutor.rating || '0.0'}</span>
                        <span><strong>$${tutor.hourly_rate || '0'}/hr</strong></span>
                    </div>
                </div>
                <button class="btn btn-primary" style="width:100%; margin-top:15px;" onclick="bookTutor(${tutor.user_id})">Book Session</button>
            </div>
        `).join('');
    }

    function filterTutors() {
        const searchValue = searchInput.value.toLowerCase();
        const maxPrice = parseInt(priceSlider.value);
        const checkedCategories = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value.toLowerCase());

        const filtered = allTutors.filter(tutor => {
            const matchesSearch = tutor.full_name.toLowerCase().includes(searchValue) || 
                                  (tutor.bio && tutor.bio.toLowerCase().includes(searchValue));
            const matchesPrice = parseFloat(tutor.hourly_rate) <= maxPrice;
            const matchesCategory = checkedCategories.length === 0 || 
                                    (tutor.subject && checkedCategories.includes(tutor.subject.toLowerCase()));

            return matchesSearch && matchesPrice && matchesCategory;
        });

        if(priceDisplay) priceDisplay.innerText = maxPrice;
        renderTutors(filtered);
    }

    // Listeners
    if(searchInput) searchInput.addEventListener('keyup', filterTutors);
    if(priceSlider) priceSlider.addEventListener('input', filterTutors);
    if(resetBtn) resetBtn.addEventListener('click', () => {
        searchInput.value = "";
        priceSlider.value = 100;
        checkboxes.forEach(cb => cb.checked = false);
        filterTutors();
    });
    checkboxes.forEach(box => box.addEventListener('change', filterTutors));

    loadTutors();
});

// This function must be OUTSIDE the event listener to be accessible by the HTML onclick attribute
function bookTutor(tutorId) {
    console.log("Booking Tutor ID:", tutorId);
    // Save tutor ID to use on the booking page
    localStorage.setItem('selectedTutorId', tutorId);
    // Redirect to the booking page
    window.location.href = 'booking.html';
}