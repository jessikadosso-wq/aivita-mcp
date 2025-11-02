const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = 'https://aivita-health-adff142c.base44.app/api/apps/6900bf13f3de72ddadff142c/functions';
const API_KEY = '4c04a77653424240a580b7a6b16c16253b';

app.get('/patients', async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const response = await fetch(`${BASE_URL}/patients?limit=${limit}`, {
      headers: { 'api_key': API_KEY }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/patients', async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}/patients`, {
      method: 'POST',
      headers: { 'api_key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/conversations', async (req, res) => {
  try {
    const status = req.query.status;
    const url = status ? `${BASE_URL}/conversations?status=${status}` : `${BASE_URL}/conversations`;
    const response = await fetch(url, { headers: { 'api_key': API_KEY } });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/appointments', async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}/appointments?limit=100`, {
      headers: { 'api_key': API_KEY }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 AIVITA rodando em http://localhost:${PORT}`);
});