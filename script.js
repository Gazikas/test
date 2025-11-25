document.getElementById("pick").addEventListener("click", async () => {
    const colors = [...document.querySelectorAll(".color")];
    const random = colors[Math.floor(Math.random() * colors.length)];

    const chosenName = random.dataset.color;
    document.getElementById("result").innerText = "Pasirinkta spalva: " + chosenName;

    // Siunčiam į backend
    const response = await fetch("/api/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color: chosenName })
    });

    const data = await response.json();
    alert(data.message);
});
