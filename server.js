import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = 3003;

app.use(cors());
app.use(express.json());

app.get('/api/fetch', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      responseType: 'text'  // Force response as text
    });
    
    res.json({ 
      data: response.data,
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      status: error.response?.status,
      data: error.response?.data 
    });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
