import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/perguntar", async (req, res) => {
  try {
    const pergunta = req.body.pergunta;

    if (!pergunta) {
      return res.status(400).json({ resposta: "Pergunta não enviada" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: pergunta }] }
          ],
        }),
      }
    );

    const data = await response.json();
    console.log("RESPOSTA COMPLETA DA API:", JSON.stringify(data, null, 2));

    // Tratamento de erro de quota
    if (data?.error?.code === 429 || data?.error?.status === "RESOURCE_EXHAUSTED") {
      return res.json({
        resposta: "Ops! A cota gratuita da IA acabou por hoje. Tente novamente mais tarde ou aguarde a liberação de novas requisições."
      });
    }

    // Se houver resposta válida da API
    const texto =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sem resposta da IA";

    res.json({ resposta: texto });

  } catch (err) {
    console.error("ERRO REAL:", err);
    res.json({
      resposta: "Ops! Ocorreu um erro ao tentar se comunicar com a IA. Tente novamente mais tarde."
    });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
