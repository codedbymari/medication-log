document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements
    const pillForm = document.getElementById("pill-form");
    const pillList = document.getElementById("pill-list");
    const formMessage = document.getElementById("form-message");
    const searchInput = document.getElementById("search-input");
    const noResults = document.getElementById("no-results");
    const pillSection = document.getElementById("medications-section");
    const notificationSetup = document.getElementById("notification-setup");
    
    // Toggle elements
    const showMoreFieldsBtn = document.getElementById("show-more-fields");
    const additionalFields = document.getElementById("additional-fields");
    const tabButtons = document.querySelectorAll(".tab-button");
    const featurePanels = document.querySelectorAll(".feature-panel");
    
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
    let activeTab = null;
    let additionalFieldsVisible = false;
    let notificationPermission = false;
    
    // Initialize app
    init();
    
    function init() {
        loadPills();
        setupEventListeners();
        checkNotificationPermission();
        scheduleReminders();
    }
    
    function loadPills() {
        try {
            allPills = JSON.parse(localStorage.getItem("pills")) || [];
            reminders = JSON.parse(localStorage.getItem("reminders")) || [];
        } catch (error) {
            console.warn("Error loading data from localStorage:", error);
            allPills = [];
            reminders = [];
        }
        displayPills(allPills);
        updatePillSectionVisibility();
    }
    
    function setupEventListeners() {
        // Form submission
        pillForm.addEventListener("submit", handleFormSubmit);
        
        // Toggle additional fields
        showMoreFieldsBtn.addEventListener("click", toggleAdditionalFields);
        
        // Tab functionality
        tabButtons.forEach(button => {
            button.addEventListener("click", () => toggleTab(button.dataset.tab));
        });
        
        // Search functionality
        searchInput.addEventListener("input", handleSearch);
        
        // Notification handlers
        if (enableNotificationsBtn) {
            enableNotificationsBtn.addEventListener("click", enableNotifications);
        }
        if (dismissNotificationBtn) {
            dismissNotificationBtn.addEventListener("click", dismissNotificationBanner);
        }
        
        // Export/Import handlers
        if (exportCsvBtn) exportCsvBtn.addEventListener("click", exportToCSV);
        if (exportJsonBtn) exportJsonBtn.addEventListener("click", exportToJSON);
        if (importBtn) importBtn.addEventListener("click", () => importInput.click());
        if (importInput) importInput.addEventListener("change", importData);
    }
    
    // Toggle functionality
    function toggleAdditionalFields() {
        additionalFieldsVisible = !additionalFieldsVisible;
        additionalFields.style.display = additionalFieldsVisible ? 'block' : 'none';
        showMoreFieldsBtn.textContent = additionalFieldsVisible ? 'Hide Details' : 'Add More Details';
    }
    
    function toggleTab(tabName) {
        // Hide all panels first
        featurePanels.forEach(panel => {
            if (panel.dataset.panel) {
                panel.style.display = 'none';
            }
        });
        
        // Remove active class from all buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // If clicking the same tab, just close it
        if (activeTab === tabName) {
            activeTab = null;
            return;
        }
        
        // Show the selected panel and activate button
        const targetPanel = document.querySelector(`[data-panel="${tabName}"]`);
        const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (targetPanel && targetButton) {
            targetPanel.style.display = 'block';
            targetButton.classList.add('active');
            activeTab = tabName;
        }
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
        
        // Reset forms
        pillForm.reset();
        if (additionalFieldsVisible) {
            document.getElementById("detailed-form").reset();
        }
        
        showMessage(`${pillName} logged successfully!`, "success");
    }
    
    function addPill(pill) {
        allPills.unshift(pill); // Add to beginning of array
        savePills();
        displayPills(allPills);
        updatePillSectionVisibility();
    }
    
    function savePills() {
        try {
            localStorage.setItem("pills", JSON.stringify(allPills));
            localStorage.setItem("reminders", JSON.stringify(reminders));
        } catch (error) {
            console.warn("Error saving data to localStorage:", error);
        }
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
            const deleteBtn = li.querySelector(".delete-btn");
            if (deleteBtn) {
                deleteBtn.addEventListener("click", () => {
                    deletePill(pill.id);
                    showMessage(`${pill.name} removed from log.`, "success");
                });
            }
            
            pillList.appendChild(li);
        });
    }
    
    function createPillHTML(pill) {
        const hasReminder = reminders.some(r => r.pillId === pill.id);
        
        return `
            <div class="medication-item">
                <div class="medication-header">
                    <div>
                        <div class="medication-name">${escapeHtml(pill.name)}</div>
                        <div class="medication-details">
                            Logged: ${pill.date} at ${pill.time}
                            ${pill.dosage ? `<br>Dosage: ${escapeHtml(pill.dosage)}` : ''}
                            ${pill.frequency ? `<br>Frequency: ${escapeHtml(pill.frequency)}` : ''}
                            ${pill.notes ? `<br>Notes: ${escapeHtml(pill.notes)}` : ''}
                            ${hasReminder ? '<br><span class="reminder-indicator">🔔 Reminder set</span>' : ''}
                        </div>
                    </div>
                    <button class="delete-btn" aria-label="Delete ${escapeHtml(pill.name)}">×</button>
                </div>
            </div>
        `;
    }
    
    function deletePill(pillId) {
        allPills = allPills.filter(pill => pill.id !== pillId);
        reminders = reminders.filter(reminder => reminder.pillId !== pillId);
        savePills();
        displayPills(allPills);
        updatePillSectionVisibility();
    }
    
    function updatePillSectionVisibility() {
        if (allPills.length > 0) {
            pillSection.style.display = "block";
        } else {
            pillSection.style.display = "none";
        }
    }
    
    // Search functionality
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (!searchTerm) {
            displayPills(allPills);
            return;
        }
        
        const filteredPills = allPills.filter(pill => 
            pill.name.toLowerCase().includes(searchTerm) ||
            pill.dosage.toLowerCase().includes(searchTerm) ||
            pill.notes.toLowerCase().includes(searchTerm) ||
            pill.frequency.toLowerCase().includes(searchTerm)
        );
        
        displayPills(filteredPills);
    }
    
    // Notification functionality
    function checkNotificationPermission() {
        if ("Notification" in window) {
            notificationPermission = Notification.permission === "granted";
            if (Notification.permission === "default") {
                notificationSetup.style.display = "block";
            }
        }
    }
    
    function enableNotifications() {
        if ("Notification" in window) {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    notificationPermission = true;
                    notificationSetup.style.display = "none";
                    showMessage("Notifications enabled successfully!", "success");
                }
            });
        }
    }
    
    function dismissNotificationBanner() {
        notificationSetup.style.display = "none";
    }
    
    // Reminder functionality
    function addReminder(pill, reminderTime) {
        const reminder = {
            id: Date.now() + Math.random(),
            pillId: pill.id,
            pillName: pill.name,
            time: reminderTime,
            active: true
        };
        
        reminders.push(reminder);
        scheduleReminder(reminder);
    }
    
    function scheduleReminder(reminder) {
        const now = new Date();
        const [hours, minutes] = reminder.time.split(':').map(Number);
        const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        
        // If the time has passed today, schedule for tomorrow
        if (reminderDate <= now) {
            reminderDate.setDate(reminderDate.getDate() + 1);
        }
        
        const timeUntilReminder = reminderDate.getTime() - now.getTime();
        
        setTimeout(() => {
            if (notificationPermission && reminder.active) {
                new Notification(`Medication Reminder`, {
                    body: `Time to take your ${reminder.pillName}`,
                    icon: '💊'
                });
            }
            
            // Reschedule for next day
            const nextDay = new Date(reminderDate);
            nextDay.setDate(nextDay.getDate() + 1);
            scheduleReminder({ ...reminder, time: reminder.time });
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
                `"${pill.dosage}"`,
                `"${pill.frequency}"`,
                `"${pill.notes}"`,
                `"${pill.date}"`,
                `"${pill.time}"`
            ].join(","))
        ].join("\n");
        
        downloadFile(csvContent, "medications.csv", "text/csv");
        showMessage("Medications exported to CSV!", "success");
    }
    
    function exportToJSON() {
        if (allPills.length === 0) {
            showMessage("No medications to export.", "error");
            return;
        }
        
        const exportData = {
            pills: allPills,
            reminders: reminders,
            exportDate: new Date().toISOString()
        };
        
        const jsonContent = JSON.stringify(exportData, null, 2);
        downloadFile(jsonContent, "medication-backup.json", "application/json");
        showMessage("Data backup created!", "success");
    }
    
    function downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.pills && Array.isArray(importedData.pills)) {
                    allPills = importedData.pills;
                    reminders = importedData.reminders || [];
                    savePills();
                    displayPills(allPills);
                    updatePillSectionVisibility();
                    showMessage(`Imported ${allPills.length} medications!`, "success");
                } else {
                    showMessage("Invalid file format.", "error");
                }
            } catch (error) {
                showMessage("Error reading file.", "error");
                console.error("Import error:", error);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = "";
    }
    
    // Message display
    function showMessage(message, type = "success") {
        formMessage.textContent = message;
        formMessage.className = `alert ${type}`;
        formMessage.style.display = "block";
        
        setTimeout(() => {
            formMessage.style.display = "none";
        }, 3000);
    }
    
    // Utility function
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
});
