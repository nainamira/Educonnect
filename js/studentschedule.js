// js/studentschedule.js

document.addEventListener('DOMContentLoaded', function() {
    
    const date = new Date();
    const monthYear = document.getElementById("monthYear");
    const calendarGrid = document.getElementById("calendarGrid");
    const selectedDateText = document.getElementById("selectedDateText");
    const eventList = document.getElementById("eventList");

    // --- UPDATED DATA TO MATCH DASHBOARD ---
    // Jan 15: Calculus II
    // Jan 20: Physics Lab
    const events = {
        15: [
            { title: "Calculus II Review", time: "2:00 PM", tutor: "Sarah Jenkins" }
        ],
        20: [
            { title: "Physics Lab", time: "10:00 AM", tutor: "Muhd. Syafiq" }
        ]
    };

    function renderCalendar() {
        date.setDate(1);
        
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const prevLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
        const firstDayIndex = date.getDay();
        const lastDayIndex = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDay();
        
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        monthYear.innerText = `${months[date.getMonth()]} ${date.getFullYear()}`;

        let days = "";

        const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        weekDays.forEach(day => {
            days += `<div class="weekday">${day}</div>`;
        });

        for (let x = firstDayIndex; x > 0; x--) {
            days += `<div class="day" style="opacity:0.3">${prevLastDay - x + 1}</div>`;
        }

        for (let i = 1; i <= lastDay; i++) {
            const isToday = i === new Date().getDate() && date.getMonth() === new Date().getMonth() ? "today" : "";
            
            // Check if event exists in our list
            const hasEvent = events[i] ? "has-event" : "";

            days += `<div class="day ${isToday} ${hasEvent}" onclick="window.showEvent(${i})">${i}</div>`;
        }

        calendarGrid.innerHTML = days;
    }

    window.changeMonth = function(n) {
        date.setMonth(date.getMonth() + n);
        renderCalendar();
    }

    window.showEvent = function(day) {
        const classData = events[day];
        const currentMonth = document.getElementById("monthYear").innerText;
        
        selectedDateText.innerText = `Classes on ${day} ${currentMonth}`;
        eventList.innerHTML = ""; 

        if (classData) {
            classData.forEach(evt => {
                const html = `
                    <div class="detail-card">
                        <span class="time-badge"><i class="far fa-clock"></i> ${evt.time}</span>
                        <h4>${evt.title}</h4>
                        <p style="font-size:0.9rem; color:#666;">Tutor: ${evt.tutor}</p>
                        <button class="btn btn-primary" style="margin-top:10px; padding: 5px 15px; font-size: 0.8rem; width:100%;">Join Link</button>
                    </div>
                `;
                eventList.innerHTML += html;
            });
        } else {
            eventList.innerHTML = `<p style="color:#888; text-align:center; margin-top:20px;">No classes scheduled for this day.</p>`;
        }
    }

    renderCalendar();
});