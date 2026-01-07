const API_URL = 'http://localhost:5000/api';
let confirmedSessions = []; // This will hold our real data from MySQL

document.addEventListener('DOMContentLoaded', async function() {
    const date = new Date();
    const token = localStorage.getItem('token');
    
    // 1. Initial Check
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Fetch data from DB before rendering
    await fetchConfirmedSessions(token);

    const monthYear = document.getElementById("monthYear");
    const calendarGrid = document.getElementById("calendarGrid");
    const selectedDateText = document.getElementById("selectedDateText");
    const eventList = document.getElementById("eventList");

    function renderCalendar() {
        date.setDate(1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const prevLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
        const firstDayIndex = date.getDay();
        
        const months = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];

        monthYear.innerText = `${months[date.getMonth()]} ${date.getFullYear()}`;

        let days = "";
        const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        weekDays.forEach(day => { days += `<div class="weekday">${day}</div>`; });

        // Previous month's days (grayed out)
        for (let x = firstDayIndex; x > 0; x--) {
            days += `<div class="day" style="opacity:0.3">${prevLastDay - x + 1}</div>`;
        }

        // Current month's days
        for (let i = 1; i <= lastDay; i++) {
            const isToday = i === new Date().getDate() && date.getMonth() === new Date().getMonth() ? "today" : "";
            
            // Check if this specific day has a session in our confirmedSessions array
            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const hasEvent = confirmedSessions.some(s => s.booking_date.startsWith(dateString)) ? "has-event" : "";

            days += `<div class="day ${isToday} ${hasEvent}" onclick="window.showEvent(${i})">${i}</div>`;
        }

        calendarGrid.innerHTML = days;
    }

    // Fetch confirmed bookings from the API
    async function fetchConfirmedSessions(token) {
        try {
            const response = await fetch(`${API_URL}/tutor/sessions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                // We only want 'confirmed' ones for the schedule
                confirmedSessions = result.data.filter(s => s.status === 'confirmed');
            }
        } catch (err) {
            console.error("Error fetching schedule:", err);
        }
    }

    window.changeMonth = function(n) {
        date.setMonth(date.getMonth() + n);
        renderCalendar();
    }

    window.showEvent = function(day) {
        const currentMonthNum = date.getMonth() + 1;
        const currentYear = date.getFullYear();
        const dateString = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Find all sessions for this day
        const dayEvents = confirmedSessions.filter(s => s.booking_date.startsWith(dateString));
        
        selectedDateText.innerText = `Classes on ${day} ${months[date.getMonth()]}`;
        eventList.innerHTML = ""; 

        if (dayEvents.length > 0) {
            dayEvents.forEach(evt => {
                const html = `
                    <div class="detail-card">
                        <span class="time-badge"><i class="far fa-clock"></i> ${evt.start_time.substring(0, 5)}</span>
                        <h4>${evt.subject_name}</h4>
                        <p style="font-size:0.9rem; color:#666;">Student: ${evt.student_name}</p>
                        <button class="btn btn-primary" onclick="startClass(${evt.booking_id})" style="margin-top:10px; padding: 5px 15px; font-size: 0.8rem; width:100%;">Start Class</button>
                    </div>
                `;
                eventList.innerHTML += html;
            });
        } else {
            eventList.innerHTML = `<p style="color:#888; text-align:center; margin-top:20px;">No classes scheduled for this day.</p>`;
        }
    }

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    renderCalendar();
});

// Helper function for the button
function startClass(id) {
    alert("Starting Virtual Classroom for Booking #" + id);
    // You can later link this to a Zoom/Google Meet link
}