import fetch from "node-fetch";

const APP_ID = "6900bf13f3de72ddadff142c";
const API_KEY = "4c04a77653424240a580b7a6b16c16253b";

const headers = {
  "Content-Type": "application/json",
  "api_key": API_KEY,
};

async function test() {
  try {
    const response = await fetch(
      `https://app.base44.com/api/apps/${APP_ID}/entities/Patient?limit=5`,
      { headers }
    );
    
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Resposta:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Erro:", error.message);
  }
}

test();