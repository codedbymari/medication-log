document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("pill-form");
    const pillList = document.getElementById("pill-list");
    let pills = JSON.parse(localStorage.getItem("pills")) || [];

    // Save pills to localStorage
    function savePills() {
        localStorage.setItem("pills", JSON.stringify(pills));
    }

    // Render pills on the page
    function renderPills() {
        pillList.innerHTML = "";
        pills.forEach((pill, index) => {
            const li = document.createElement("li");
            li.classList.add(
                "bg-pink-100", "p-3", "rounded-lg",
                "flex", "justify-between", "items-center",
                "border", "border-pink-300"
            );
            li.innerHTML = `
                <span>${pill.name} - ${pill.time} (${pill.date})</span>
                <button class="remove-btn bg-pink-600 text-white p-1 rounded" data-index="${index}">Remove</button>
            `;
            pillList.appendChild(li);
        });

        // Attach event listeners to remove buttons
        document.querySelectorAll(".remove-btn").forEach(button => {
            button.addEventListener("click", function() {
                removePill(this.dataset.index);
            });
        });
    }

    // Add new pill
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.getElementById("pill-name").value.trim();
        const time = document.getElementById("pill-time").value.trim();
        const date = new Date().toLocaleDateString();

        if (name === "" || time === "") {
            alert("Please fill in all fields.");
            return;
        }

        // Push new pill to array and save
        pills.push({ name, time, date });
        savePills();
        renderPills();
        form.reset();
    });

    // Remove pill from list
    function removePill(index) {
        pills.splice(index, 1);
        savePills();
        renderPills();
    }

    // Initial render of pills on page load
    renderPills();
});
