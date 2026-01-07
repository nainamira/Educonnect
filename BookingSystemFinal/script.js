window.onload = () => {
    anime({
        targets: '.tutor-card',
        translateY: [30, 0],
        opacity: [0, 1],
        delay: anime.stagger(100), // cards appear one by one
        easing: 'easeOutExpo',
        duration: 1000
    });
};

// 2. LIVE SEARCH FILTER 
const searchBar = document.getElementById('searchBar');
const tutorGrid = document.getElementById('tutorGrid');

searchBar.addEventListener('keyup', (e) => {
    const searchString = e.target.value.toLowerCase();
    const cards = document.getElementsByClassName('tutor-card');

    Array.from(cards).forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        const subject = card.querySelector('p').innerText.toLowerCase();

        if (title.includes(searchString) || subject.includes(searchString)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// 3. CATEGORY FILTER 
function filterCategory(category) {
    const cards = document.getElementsByClassName('tutor-card');
    
    Array.from(cards).forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            // Add a small pulse animation when filtering
            anime({
                targets: card,
                scale: [0.95, 1],
                duration: 400
            });
        } else {
            card.style.display = 'none';
        }
    });
}

// 4. "ADD TO CART" REDIRECT 
// For Public Users, clicking this should lead to Member Registration
function addToCart() {
    alert("Please register or login to book a session!");
    window.location.href = "registration.php"; // Redirecting to registration page
}