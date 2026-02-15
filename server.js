import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configurar caminho da pasta 'public'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Rota principal (para GET /)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rota da API
app.post("/perguntar", async (req, res) => {
  try {
    const pergunta = req.body.pergunta;
    if (!pergunta) return res.status(400).json({ resposta: "Pergunta não enviada" });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: pergunta }] }],
        }),
      }
    );

    const data = await response.json();
    console.log("RESPOSTA COMPLETA DA API:", JSON.stringify(data, null, 2));

    if (data?.error?.code === 429 || data?.error?.status === "RESOURCE_EXHAUSTED") {
      return res.json({
        resposta: "Ops! A cota gratuita de requisições para o GersonBot acabou por hoje. Tente novamente mais tarde."
      });
    }

    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta da IA";
    res.json({ resposta: texto });

  } catch (err) {
    console.error("ERRO REAL:", err);
    res.json({
      resposta: "Ops! Ocorreu um erro ao tentar se comunicar com GersonBot. Tente novamente mais tarde."
    });
  }
});

// Porta dinâmica para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
