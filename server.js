// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*", methods: ["GET","POST"], allowedHeaders: ["*"] }));
app.use(express.json());

// ---- Autenticação para rotas MCP ----
function requireApiKey(req, res, next) {
  const apiKey = req.headers["x-mcp-api-key"];
  if (!apiKey || apiKey !== process.env.MCP_API_KEY) {
    return res.status(401).json({ error: "Chave inválida ou ausente (x-mcp-api-key)" });
  }
  next();
}

// ---- Rotas utilitárias ----
app.get("/", (req, res) => {
  res.send("Aivita MCP online. Use /healthz, /mcp/tools e /mcp/invoke.");
});

app.get("/healthz", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ---- Definição das ferramentas expostas ao agente ----
const toolsDef = {
  type: "tools",
  tools: [
    {
      name: "list_patients",
      description: "Lista pacientes do CRM Aivita (mock para demonstração)",
      input_schema: { type: "object", properties: {} },
    },
    {
      name: "create_patient",
      description: "Cria um novo paciente no CRM Aivita (mock para demonstração)",
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

// ---- Endpoints MCP para o GPT Maker ----

// Lista de ferramentas (o agente consome isso para saber o que pode chamar)
app.post("/mcp/tools", requireApiKey, (req, res) => {
  res.json(toolsDef);
});

// Invocação de ferramenta: { "name": "create_patient", "args": { ... } }
app.post("/mcp/invoke", requireApiKey, async (req, res) => {
  try {
    const { name, args } = req.body || {};

    if (!name) {
      return res.status(400).json({ error: "Campo 'name' é obrigatório." });
    }

    switch (name) {
      case "list_patients": {
        // Mock: troque por chamada real ao seu CRM quando quiser
        const data = [
          { id: "p_001", nome: "Maria Souza", telefone: "11999990001" },
          { id: "p_002", nome: "João Lima", telefone: "11999990002" },
        ];
        return res.json({ ok: true, result: data });
      }

      case "create_patient": {
        const { nome, telefone } = args || {};
        if (!nome || !telefone) {
          return res.status(400).json({ error: "Campos 'nome' e 'telefone' são obrigatórios." });
        }
        // Mock: aqui você chamaria o CRM Aivita de verdade
        const created = {
          id: `p_${Date.now()}`,
          nome,
          telefone,
          createdAt: new Date().toISOString(),
        };
        return res.json({ ok: true, result: created });
      }

      default:
        return res.status(400).json({ error: `Ferramenta desconhecida: ${name}` });
    }
  } catch (err) {
    console.error("Erro no /mcp/invoke:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Porta para Render/Heroku etc.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Aivita MCP rodando em http://localhost:${PORT}`);
});
