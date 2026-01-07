// 1. Image Preview Logic
function previewImage(event) {
    const reader = new FileReader();
    
    reader.onload = function() {
        const output = document.getElementById('profilePreview');
        const headerOutput = document.getElementById('headerProfilePic');
        
        // Update both the main profile image and the small header image
        if(output) output.src = reader.result;
        if(headerOutput) headerOutput.src = reader.result;
    }
    
    // Read the uploaded file
    if(event.target.files && event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

// 2. Custom Subject Tag Logic
function addSubject() {
    const input = document.getElementById('subjectInput');
    const container = document.getElementById('tagsContainer');
    const value = input.value.trim();

    if (value !== "") {
        // Create the Tag Element
        const tag = document.createElement('div');
        tag.className = 'custom-tag';
        
        // Add content (Text + Remove Button)
        tag.innerHTML = `${value} <i class="fas fa-times tag-close"></i>`;
        
        // Add functionality to the X button inside the new tag
        tag.querySelector('.tag-close').onclick = function() {
            tag.remove();
        };

        // Add to container and clear input
        container.appendChild(tag);
        input.value = "";
    }
}

// 3. Initialize Event Listeners when page loads
document.addEventListener('DOMContentLoaded', function() {
    
    // Allow pressing "Enter" to add subject
    const subjectInput = document.getElementById('subjectInput');
    if(subjectInput) {
        subjectInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Stop form submission
                addSubject();
            }
        });
    }

    // Attach click event for "Change Photo" button if not using inline onclick
    // (Optional, but keeps HTML cleaner if you prefer)
});