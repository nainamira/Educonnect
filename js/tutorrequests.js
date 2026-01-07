document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Handle Accept Buttons
    const acceptBtns = document.querySelectorAll('.btn-accept');
    
    acceptBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Show confirmation
            alert('Request Accepted! Added to schedule.');
            
            // Visual Effect: Remove the card from the list
            const card = this.closest('.request-card');
            if(card) {
                card.style.transition = "opacity 0.5s ease";
                card.style.opacity = "0";
                setTimeout(() => card.remove(), 500); // Remove from DOM after fade
            }
        });
    });

    // 2. Handle Decline Buttons
    const declineBtns = document.querySelectorAll('.btn-decline');
    
    declineBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Ask for confirmation
            if(confirm('Are you sure you want to decline this request?')) {
                alert('Request Declined.');
                
                // Visual Effect: Remove the card from the list
                const card = this.closest('.request-card');
                if(card) {
                    card.style.transition = "opacity 0.5s ease";
                    card.style.opacity = "0";
                    setTimeout(() => card.remove(), 500);
                }
            }
        });
    });

});