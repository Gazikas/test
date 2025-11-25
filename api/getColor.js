import { kv } from "@vercel/kv";
import fetch from "node-fetch";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Tik POST" });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "El. paštas privalomas" });
    }

    try {
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

        // siunčiame el. paštą per Brevo API
        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
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

        if (!brevoRes.ok) {
            return res.status(500).json({ message: "Nepavyko išsiųsti el. pašto" });
        }

        // pažymėti spalvą kaip panaudotą
        unused.used = true;
        await kv.set("colors", colors);

        return res.json({ message: "Spalva išrinkta! Patikrinkite savo el. paštą." });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Įvyko klaida, bandykite dar kartą." });
    }
}
