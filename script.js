document.addEventListener("DOMContentLoaded", function () {
    const pillForm = document.getElementById("pill-form");
    const pillList = document.getElementById("pill-list");
    const formMessage = document.getElementById("form-message");
    
    // Get the div that contains the medications list (the parent of h3 and ul)
    const pillSection = pillList.parentElement;
    
    const savedPills = JSON.parse(localStorage.getItem("pills")) || [];
    
    // Show/hide the medications section based on whether there are saved pills
    if (savedPills.length === 0) {
        pillSection.style.display = 'none';
    } else {
        pillSection.style.display = 'block';
        savedPills.forEach(pill => addPillToDOM(pill));
    }
    
    pillForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const pillName = document.getElementById("pill-name").value.trim();
        
        if (!pillName) {
            showMessage("Please enter the medication name.", "error");
            return;
        }
        
        const now = new Date();
        const pillDate = now.toLocaleDateString();
        const pillTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const newPill = { name: pillName, date: pillDate, time: pillTime };
        
        addPillToDOM(newPill);
        savePill(newPill);
        pillForm.reset();
        pillSection.style.display = 'block';
        
        showMessage(`${pillName} logged successfully!`, "success");
    });
    
    function addPillToDOM(pill) {
        const li = document.createElement("li");
        li.innerHTML = `
            <span><strong>${pill.name}</strong><br>
            <small>${pill.date} at ${pill.time}</small></span>
            <button class="list-action-btn delete-btn" aria-label="Delete ${pill.name}">✖</button>
        `;
        
        li.querySelector(".delete-btn").addEventListener("click", function () {
            li.remove();
            removePill(pill);
            showMessage(`${pill.name} removed from log.`, "success");
        });
        
        pillList.appendChild(li);
    }
    
    function savePill(pill) {
        const pills = JSON.parse(localStorage.getItem("pills")) || [];
        pills.push(pill);
        localStorage.setItem("pills", JSON.stringify(pills));
    }
    
    function removePill(pill) {
        let pills = JSON.parse(localStorage.getItem("pills")) || [];
        pills = pills.filter(p => !(p.name === pill.name && p.date === pill.date && p.time === pill.time));
        localStorage.setItem("pills", JSON.stringify(pills));
        
        if (pills.length === 0) {
            pillSection.style.display = 'none';
        }
    }
    
    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = `alert ${type}`;
        formMessage.style.display = 'block';
        
        // Hide message after 3 seconds
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 3000);
    }
});
