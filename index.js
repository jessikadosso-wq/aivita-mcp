#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// Configuração da Base44 API
const BASE44_API_URL = "https://app.base44.com/api";
const APP_ID = process.env.BASE44_APP_ID;
const API_KEY = process.env.BASE44_API_KEY;

if (!APP_ID || !API_KEY) {
  console.error("ERRO: BASE44_APP_ID e BASE44_API_KEY devem estar configurados!");
  process.exit(1);
}

// Headers padrão para chamadas à API
const headers = {
  "Content-Type": "application/json",
  "X-App-Id": APP_ID,
  "X-Api-Key": API_KEY,
};

// Criar servidor MCP
const server = new Server(
  {
    name: "aivita-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Listar todas as ferramentas disponíveis
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_patients",
        description: "Lista todos os pacientes da clínica AIVITA",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Número máximo de resultados (padrão: 50)",
            },
          },
        },
      },
      {
        name: "create_patient",
        description: "Cria um novo paciente no CRM",
        inputSchema: {
          type: "object",
          properties: {
            full_name: { type: "string", description: "Nome completo" },
            phone: { type: "string", description: "Telefone" },
            email: { type: "string", description: "Email" },
            cpf: { type: "string", description: "CPF" },
            source: {
              type: "string",
              enum: ["whatsapp", "instagram", "site", "indicacao", "outro"],
              description: "Origem do paciente",
            },
          },
          required: ["full_name", "phone"],
        },
      },
      {
        name: "list_appointments",
        description: "Lista as consultas agendadas",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Número máximo de resultados",
            },
          },
        },
      },
      {
        name: "create_appointment",
        description: "Agenda uma nova consulta",
        inputSchema: {
          type: "object",
          properties: {
            patient_name: { type: "string", description: "Nome do paciente" },
            professional_name: { type: "string", description: "Nome do profissional" },
            scheduled_date: { type: "string", description: "Data (YYYY-MM-DD)" },
            scheduled_time: { type: "string", description: "Horário (HH:mm)" },
            appointment_type: {
              type: "string",
              enum: ["consulta", "retorno", "exame", "procedimento", "cirurgia"],
            },
          },
          required: ["patient_name", "professional_name", "scheduled_date", "scheduled_time"],
        },
      },
      {
        name: "list_transactions",
        description: "Lista transações financeiras",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number" },
          },
        },
      },
    ],
  };
});

// Implementar execução das ferramentas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_patients": {
        const limit = args.limit || 50;
        const response = await fetch(
          `${BASE44_API_URL}/apps/${APP_ID}/entities/Patient?limit=${limit}`,
          { headers }
        );
        const data = await response.json();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "create_patient": {
        const response = await fetch(
          `${BASE44_API_URL}/apps/${APP_ID}/entities/Patient`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(args),
          }
        );
        const data = await response.json();
        return {
          content: [
            {
              type: "text",
              text: `Paciente criado com sucesso!\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case "list_appointments": {
        const limit = args.limit || 50;
        const response = await fetch(
          `${BASE44_API_URL}/apps/${APP_ID}/entities/Appointment?limit=${limit}`,
          { headers }
        );
        const data = await response.json();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "create_appointment": {
        const response = await fetch(
          `${BASE44_API_URL}/apps/${APP_ID}/entities/Appointment`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(args),
          }
        );
        const data = await response.json();
        return {
          content: [
            {
              type: "text",
              text: `Consulta agendada com sucesso!\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case "list_transactions": {
        const limit = args.limit || 50;
        const response = await fetch(
          `${BASE44_API_URL}/apps/${APP_ID}/entities/Transaction?limit=${limit}`,
          { headers }
        );
        const data = await response.json();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Ferramenta desconhecida: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Erro ao executar ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Iniciar servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Servidor MCP AIVITA iniciado com sucesso!");
}

main().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});