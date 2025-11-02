import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const API_BASE_URL = "https://aivita-health-adff142c.base44.app/api/apps/6900bf13f3de72ddadff142c/functions";
const API_KEY = "4c04a77653424240a580b7a6b16c16253b";

async function callAivitaAPI(endpoint, method = "GET", params = {}, body = null) {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "api_key": API_KEY,
    },
  };

  if (body && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API Error: ${response.status}`);
  }

  return data;
}

app.get('/mcp', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const tools = [
    {
      name: "list_patients",
      description: "Lista todos os pacientes do sistema AIVITA",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Número máximo de pacientes" }
        }
      }
    },
    {
      name: "get_patient",
      description: "Busca um paciente específico pelo ID",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do paciente" }
        },
        required: ["id"]
      }
    }
  ];

  res.write(`data: ${JSON.stringify({ type: 'tools', tools })}\n\n`);

  req.on('close', () => {
    res.end();
  });
});

app.post('/mcp/call', async (req, res) => {
  const { name, arguments: args } = req.body;

  try {
    let result;
    switch (name) {
      case "list_patients":
        result = await callAivitaAPI("patients", "GET", { limit: args?.limit || 100 });
        break;
      case "get_patient":
        result = await callAivitaAPI("patients", "GET", { id: args.id });
        break;
      default:
        throw new Error(`Ferramenta desconhecida: ${name}`);
    }

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor MCP HTTP rodando na porta ${PORT}`);
});