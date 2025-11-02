// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*", methods: ["GET","POST"], allowedHeaders: ["*"] }));
app.use(express.json());

// Teste simples
app.get("/status", (req, res) => {
  res.json({ status: "Servidor MCP rodando com sucesso!" });
});

// Endpoint principal (Streamable HTTP - POST)
app.post("/mcp-server-stream", (req, res) => {
  const apiKey = req.headers["x-mcp-api-key"];
  if (apiKey !== process.env.MCP_API_KEY) {
    return res.status(401).json({ error: "Chave inválida" });
  }

  const data = {
    type: "tools",
    tools: [
      {
        name: "list_patients",
        description: "Lista pacientes do CRM Base44",
        input_schema: { type: "object", properties: {} },
      },
      {
        name: "create_patient",
        description: "Cria um novo paciente no CRM Base44",
        input_schema: {
          type: "object",
          properties: {
            nome: { type: "string" },
            telefone: { type: "string" },
          },
          required: ["nome", "telefone"],
        },
      },
    ],
  };

  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor MCP rodando na porta ${PORT}`);
