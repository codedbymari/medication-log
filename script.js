document.addEventListener("DOMContentLoaded", function () {
    const pillForm = document.getElementById("pill-form");
    const pillList = document.getElementById("pill-list");
    const pillSection = document.querySelector('.mt-6');
    
    const savedPills = JSON.parse(localStorage.getItem("pills")) || [];
    pillSection.style.display = savedPills.length > 0 ? 'block' : 'none';

    savedPills.forEach(pill => addPillToDOM(pill));

    pillForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const pillName = document.getElementById("pill-name").value.trim();
        if (!pillName) {
            alert("Please enter the medication name.");
            return;
        }

        const now = new Date();
        const pillDate = now.toLocaleDateString();
        const pillTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        addPillToDOM({ name: pillName, date: pillDate, time: pillTime });
        savePill({ name: pillName, date: pillDate, time: pillTime });

        pillForm.reset();
        pillSection.style.display = 'block';
    });

    function addPillToDOM(pill) {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center bg-gray-100 p-3 rounded-lg shadow-sm";
        li.innerHTML = `
            <span class="font-medium text-gray-700">${pill.name} - <span class="text-blue-500">${pill.date} at ${pill.time}</span></span>
            <button class="text-red-500 hover:text-red-700 delete-btn">✖</button>
        `;

        li.querySelector(".delete-btn").addEventListener("click", function () {
            li.remove();
            removePill(pill);
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
});
