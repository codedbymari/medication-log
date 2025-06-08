document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements
    const pillForm = document.getElementById("pill-form");
    const pillList = document.getElementById("pill-list");
    const formMessage = document.getElementById("form-message");
    const searchInput = document.getElementById("search-input");
    const noResults = document.getElementById("no-results");
    const pillSection = document.getElementById("medications-section");
    const notificationSetup = document.getElementById("notification-setup");
    
    // Button elements
    const enableNotificationsBtn = document.getElementById("enable-notifications");
    const dismissNotificationBtn = document.getElementById("dismiss-notification");
    const exportCsvBtn = document.getElementById("export-csv");
    const exportJsonBtn = document.getElementById("export-json");
    const importBtn = document.getElementById("import-btn");
    const importInput = document.getElementById("import-data");
    
    // Global variables
    let allPills = [];
    let reminders = [];
    
    // Initialize app
    init();
    
    function init() {
        loadPills();
        setupEventListeners();
        checkNotificationPermission();
        scheduleReminders();
    }
    
    function loadPills() {
        allPills = JSON.parse(localStorage.getItem("pills")) || [];
        reminders = JSON.parse(localStorage.getItem("reminders")) || [];
        displayPills(allPills);
        updatePillSectionVisibility();
    }
    
    function setupEventListeners() {
        // Form submission
        pillForm.addEventListener("submit", handleFormSubmit);
        
        // Search functionality
        searchInput.addEventListener("input", handleSearch);
        
        // Notification handlers
        enableNotificationsBtn.addEventListener("click", enableNotifications);
        dismissNotificationBtn.addEventListener("click", dismissNotificationBanner);
        
        // Export/Import handlers
        exportCsvBtn.addEventListener("click", exportToCSV);
        exportJsonBtn.addEventListener("click", exportToJSON);
        importBtn.addEventListener("click", () => importInput.click());
        importInput.addEventListener("change", importData);
    }
    
    // Form handling
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const pillName = document.getElementById("pill-name").value.trim();
        const dosage = document.getElementById("pill-dosage").value.trim();
        const frequency = document.getElementById("pill-frequency").value;
        const notes = document.getElementById("pill-notes").value.trim();
        const reminderTime = document.getElementById("reminder-time").value;
        
        if (!pillName) {
            showMessage("Please enter the medication name.", "error");
            return;
        }
        
        const now = new Date();
        const newPill = {
            id: Date.now(),
            name: pillName,
            dosage: dosage,
            frequency: frequency,
            notes: notes,
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: now.getTime()
        };
        
        addPill(newPill);
        
        // Handle reminder
        if (reminderTime) {
            addReminder(newPill, reminderTime);
        }
        
        pillForm.reset();
        showMessage(`${pillName} logged successfully!`, "success");
    }
    
    function addPill(pill) {
        allPills.unshift(pill); // Add to beginning of array
        savePills();
        displayPills(allPills);
        updatePillSectionVisibility();
    }
    
    function displayPills(pills) {
        pillList.innerHTML = "";
        
        if (pills.length === 0) {
            noResults.style.display = searchInput.value ? "block" : "none";
            return;
        }
        
        noResults.style.display = "none";
        
        pills.forEach(pill => {
            const li = document.createElement("li");
            li.innerHTML = createPillHTML(pill);
            
            // Add delete functionality
            li.querySelector(".delete-btn").addEventListener("click", () => {
                deletePill(pill.id);
                showMessage(`${pill.name} removed from log.`, "success");
            });
            
            pillList.appendChild(li);
        });
    }
    
    function createPillHTML(pill) {
        const hasReminder = reminders.some(r => r.pillId === pill.id);
        
        return `
            <div class="medication-item">
                <div class="medication-header">
                    <div>
                        <div class="medication-name">${pill.name}</div>
                        <div class="medication-details">
                            Logged: ${pill.date} at ${pill.time}
                            ${pill.dosage ? `<br>Dosage: ${pill.dosage}` : ''}
                            ${pill.notes ? `<br>Notes: ${pill.notes}` : ''}
                        </div>
                    </div>
                    <button class="list-action-btn delete-btn" aria-label="Delete ${pill.name}">✖</button>
                </div>
                <div class="medication-meta">
                    ${pill.frequency ? `<span class="meta-tag">${pill.frequency}</span>` : ''}
                    ${hasReminder ? `<span class="reminder-badge">⏰ Reminder Set</span>` : ''}
                </div>
            </div>
        `;
    }
    
    function deletePill(pillId) {
        allPills = allPills.filter(pill => pill.id !== pillId);
        reminders = reminders.filter(reminder => reminder.pillId !== pillId);
        savePills();
        saveReminders();
        displayPills(getFilteredPills());
        updatePillSectionVisibility();
    }
    
    // Search functionality
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredPills = getFilteredPills(searchTerm);
        displayPills(filteredPills);
    }
    
    function getFilteredPills(searchTerm = "") {
        if (!searchTerm) return allPills;
        
        return allPills.filter(pill => 
            pill.name.toLowerCase().includes(searchTerm) ||
            pill.dosage.toLowerCase().includes(searchTerm) ||
            pill.frequency.toLowerCase().includes(searchTerm) ||
            pill.notes.toLowerCase().includes(searchTerm)
        );
    }
    
    // Notification functionality
    function checkNotificationPermission() {
        if ("Notification" in window) {
            if (Notification.permission === "default" && !localStorage.getItem("notificationDismissed")) {
                notificationSetup.style.display = "block";
            }
        }
    }
    
    function enableNotifications() {
        if ("Notification" in window) {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    showMessage("Notifications enabled! You'll receive medication reminders.", "success");
                    notificationSetup.style.display = "none";
                    scheduleReminders();
                } else {
                    showMessage("Notifications denied. You can enable them in browser settings.", "error");
                }
            });
        }
    }
    
    function dismissNotificationBanner() {
        notificationSetup.style.display = "none";
        localStorage.setItem("notificationDismissed", "true");
    }
    
    function addReminder(pill, time) {
        const reminder = {
            id: Date.now(),
            pillId: pill.id,
            pillName: pill.name,
            time: time,
            active: true
        };
        
        reminders.push(reminder);
        saveReminders();
        scheduleReminder(reminder);
    }
    
    function scheduleReminder(reminder) {
        if (!("Notification" in window) || Notification.permission !== "granted") {
            return;
        }
        
        const [hours, minutes] = reminder.time.split(':');
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (reminderTime <= now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }
        
        const timeUntilReminder = reminderTime.getTime() - now.getTime();
        
        setTimeout(() => {
            new Notification(`Medication Reminder`, {
                body: `Time to take your ${reminder.pillName}`,
                icon: '/favicon.ico',
                tag: `reminder-${reminder.id}`
            });
            
            // Schedule next day's reminder
            scheduleReminder(reminder);
        }, timeUntilReminder);
    }
    
    function scheduleReminders() {
        reminders.forEach(reminder => {
            if (reminder.active) {
                scheduleReminder(reminder);
            }
        });
    }
    
    // Export functionality
    function exportToCSV() {
        if (allPills.length === 0) {
            showMessage("No medications to export.", "error");
            return;
        }
        
        const headers = ["Name", "Dosage", "Frequency", "Notes", "Date", "Time"];
        const csvContent = [
            headers.join(","),
            ...allPills.map(pill => [
                `"${pill.name}"`,
                `"${pill.dosage || ''}"`,
                `"${pill.frequency || ''}"`,
                `"${pill.notes || ''}"`,
                `"${pill.date}"`,
                `"${pill.time}"`
            ].join(","))
        ].join("\n");
        
        downloadFile(csvContent, "medication-log.csv", "text/csv");
        showMessage("Medication log exported successfully!", "success");
    }
    
    function exportToJSON() {
        const data = {
            pills: allPills,
            reminders: reminders,
            exportDate: new Date().toISOString(),
            version: "1.0"
        };
        
        const jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, "medication-backup.json", "application/json");
        showMessage("Backup created successfully!", "success");
    }
    
    function downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Import functionality
    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.pills && Array.isArray(data.pills)) {
                    // Merge with existing data
                    const existingIds = allPills.map(p => p.id);
                    const newPills = data.pills.filter(p => !existingIds.includes(p.id));
                    
                    allPills = [...allPills, ...newPills];
                    
                    if (data.reminders && Array.isArray(data.reminders)) {
                        const existingReminderIds = reminders.map(r => r.id);
                        const newReminders = data.reminders.filter(r => !existingReminderIds.includes(r.id));
                        reminders = [...reminders, ...newReminders];
                        saveReminders();
                    }
                    
                    savePills();
                    displayPills(allPills);
                    updatePillSectionVisibility();
                    scheduleReminders();
                    
                    showMessage(`Successfully imported ${newPills.length} medications!`, "success");
                } else {
                    showMessage("Invalid file format. Please select a valid backup file.", "error");
                }
            } catch (error) {
                showMessage("Error importing file. Please check the file format.", "error");
            }
        };
        
        reader.readAsText(file);
        importInput.value = ""; // Reset file input
    }
    
    // Storage functions
    function savePills() {
        localStorage.setItem("pills", JSON.stringify(allPills));
    }
    
    function saveReminders() {
        localStorage.setItem("reminders", JSON.stringify(reminders));
    }
    
    function updatePillSectionVisibility() {
        pillSection.style.display = allPills.length > 0 ? 'block' : 'none';
    }
    
    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = `alert ${type}`;
        formMessage.style.display = 'block';
        
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 4000);
    }
});
