import fetch from "node-fetch";
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Tik POST" });
    }

    const { email } = req.body;

    // gauti spalvų sąrašą iš KV
    let colors = await kv.get("colors");

    // jei pirmas deploy – sukurti spalvų sąrašą
    if (!colors) {
        colors = [
            { name: "Raudona", used: false },
            { name: "Geltona/Auksinė", used: false },
            { name: "Mėlyna", used: false },
            { name: "Balta", used: false },
            { name: "Žalia", used: false }
        ];
        await kv.set("colors", colors);
    }

    // rasti nepanaudotą spalvą
    const unused = colors.find(c => !c.used);

    if (!unused) {
        return res.json({ message: "Nebėra laisvų spalvų!" });
    }

    // siunčiam email
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

    // pažymėti spalvą kaip panaudotą
    unused.used = true;
    await kv.set("colors", colors);

    res.json({ message: "Spalva išsiųsta į jūsų el. paštą!" });
}
