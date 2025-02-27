document.addEventListener("DOMContentLoaded", function () {
    const pillForm = document.getElementById("pill-form");
    const pillList = document.getElementById("pill-list");
    const pillSection = document.querySelector('.mt-6');  // The section where meds are displayed

    // Load saved pills from localStorage
    const savedPills = JSON.parse(localStorage.getItem("pills")) || [];

    if (savedPills.length > 0) {
        pillSection.style.display = 'block';  // Show section if there are pills logged
    } else {
        pillSection.style.display = 'none';  // Hide section if no pills are logged
    }

    savedPills.forEach(pill => addPillToDOM(pill.name, pill.date, pill.time));

    pillForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const pillName = document.getElementById("pill-name").value.trim();
        const now = new Date();

        const pillDate = now.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const pillTime = now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });

        if (pillName === "") {
            alert("Please enter the medication name.");
            return;
        }

        addPillToDOM(pillName, pillDate, pillTime);
        savePill(pillName, pillDate, pillTime);

        // Clear form fields
        pillForm.reset();

        // Show the pill section if this is the first pill logged
        pillSection.style.display = 'block';
    });

    function addPillToDOM(name, date, time) {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center bg-gray-100 p-3 rounded-lg shadow-sm";

        li.innerHTML = `
            <span class="font-medium text-gray-700">${name} - <span class="text-blue-500">${date} at ${time}</span></span>
            <button class="text-red-500 hover:text-red-700 delete-btn">✖</button>
        `;

        // Add delete functionality
        li.querySelector(".delete-btn").addEventListener("click", function () {
            li.remove();
            removePill(name, date, time);
        });

        pillList.appendChild(li);
    }

    function savePill(name, date, time) {
        const pills = JSON.parse(localStorage.getItem("pills")) || [];
        pills.push({ name, date, time });
        localStorage.setItem("pills", JSON.stringify(pills));
    }

    function removePill(name, date, time) {
        let pills = JSON.parse(localStorage.getItem("pills")) || [];
        pills = pills.filter(pill => !(pill.name === name && pill.date === date && pill.time === time));
        localStorage.setItem("pills", JSON.stringify(pills));

        // Hide the section if no pills are left
        if (pills.length === 0) {
            pillSection.style.display = 'none';
        }
    }
});
