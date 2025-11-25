import fs from "fs";
import path from "path";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Tik POST" });
    }

    const { email } = req.body;

    const filePath = path.join(process.cwd(), "api", "colors.json");
    let colors = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // rasti spalvą, kuri dar nenaudota
    const unused = colors.find(c => !c.used);

    if (!unused) {
        return res.json({ message: "Nebėra laisvų spalvų!" });
    }

    // siųsti email su Brevo API
    await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            sender: { name: "Spalvų sistema", email: "noreply@spalvos.lt" },
            to: [{ email }],
            subject: "Jums paskirta spalva",
            textContent: `Jūsų spalva: ${unused.name}`
        })
    });

    // pažymėti kaip panaudota
    unused.used = true;
    fs.writeFileSync(filePath, JSON.stringify(colors, null, 2));

    res.json({ message: "Spalva išsiųsta!" });
}
