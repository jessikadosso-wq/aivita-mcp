// http-server-sse-v2.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

console.log("🚀 Iniciando servidor MCP SSE...");

// rota de status simples
app.get("/status", (req, res) => {
  res.json({ status: "Servidor MCP rodando com sucesso!" });
});

// rota principal SSE (stream)
app.get("/mcp", (req, res) => {
  console.log("🟢 Nova conexão SSE recebida de:", req.ip);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "X-Accel-Buffering": "no"
  });

  // envia a primeira resposta imediatamente
  res.write(`retry: 30000\n\n`);
  res.write(`data: ${JSON.stringify({
    type: "tools",
    tools: [
      {
        name: "list_patients",
        description: "Lista pacientes do CRM Base44",
        input_schema: { type: "object", properties: {} }
      },
      {
        name: "create_patient",
        description: "Cria um novo paciente no CRM Base44",
        input_schema: {
          type: "object",
          properties: {
            nome: { type: "string" },
            telefone: { type: "string" }
          },
          required: ["nome", "telefone"]
        }
      }
    ]
  })}\n\n`);

  // envia pings periódicos pra manter viva a conexão
  const keepAlive = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(keepAlive);
    console.log("🔴 Conexão SSE encerrada:", req.ip);
  });
});

// endpoint para simular chamadas das ferramentas
app.post("/mcp/call", async (req, res) => {
  const { name, arguments: args } = req.body;
  console.log(`⚙️ Executando ferramenta: ${name}`, args);

  try {
    if (name === "list_patients") {
      return res.json({
        success: true,
        result: [
          { id: 1, nome: "Maria Silva", telefone: "(11) 99999-0000" },
          { id: 2, nome: "João Santos", telefone: "(11) 98888-1111" }
        ]
      });
    }

    if (name === "create_patient") {
      return res.json({
        success: true,
        message: `Paciente ${args.nome} criado com sucesso!`
      });
    }

    return res.status(404).json({ success: false, error: "Ferramenta não encontrada" });
  } catch (err) {
    console.error("Erro na execução:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// inicia o servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor MCP HTTP SSE rodando na porta ${PORT}`);
  console.log(`🌐 Endpoints disponíveis:`);
  console.log(`   • SSE: http://0.0.0.0:${PORT}/mcp`);
  console.log(`   • Status: http://0.0.0.0:${PORT}/status`);
});
