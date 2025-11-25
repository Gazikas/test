export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Tik POST užklausos!" });
    }

    const { color } = req.body;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            sender: { name: "Spalvų Sistema", email: "noreply@spalvos.lt" },
            to: [{ email: process.env.TARGET_EMAIL }],
            subject: "Pasirinkta spalva",
            textContent: `Pasirinkta spalva: ${color}`
        })
    });

    if (!response.ok) {
        return res.status(500).json({ message: "Siuntimo klaida" });
    }

    res.status(200).json({ message: "Laiškas išsiųstas!" });
}
