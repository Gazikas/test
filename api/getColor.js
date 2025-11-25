import { kv } from "@vercel/kv";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Tik POST metodas leidžiamas" });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "El. paštas privalomas" });

  try {
    // Saugus kv.get
    let colors = [];
    try {
      const data = await kv.get("colors");
      if (Array.isArray(data)) colors = data;
    } catch (err) {
      console.error("KV get error:", err);
      colors = [];
    }

    // Jei tuščias – inicijuojame spalvas
    if (!colors || colors.length === 0) {
      colors = [
        { name: "Raudona", used: false },
        { name: "Geltona/Auksinė", used: false },
        { name: "Mėlyna", used: false },
        { name: "Balta", used: false },
        { name: "Žalia", used: false }
      ];
    }

    // Rasti nepanaudotą spalvą
    const unused = colors.find(c => !c.used);
    if (!unused) return res.json({ message: "Nebėra laisvų spalvų!" });

    // Siųsti spalvą el. paštu per Brevo API
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
      const text = await brevoRes.text();
      console.error("Brevo API error:", text);
      return res.status(500).json({ message: "Nepavyko išsiųsti el. pašto" });
    }

    // Pažymėti spalvą kaip panaudotą
    unused.used = true;
    await kv.set("colors", colors);

    return res.json({ message: "Spalva išrinkta! Patikrinkite savo el. paštą." });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ message: "Įvyko klaida, bandykite dar kartą." });
  }
}
