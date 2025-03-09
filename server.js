// server.js
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 環境変数からAPIキーを読み込む（.envファイル内）
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHERMAP_API_KEY;

app.use(bodyParser.json());
app.use(express.static('public'));

// OpenAI APIを呼び出して天気予報原稿を生成する
app.post('/generate-weather-script', async (req, res) => {
  try {
    const prompt = "最新の東京の天気情報を中心に、全国の天気概況や注目トピックを含めたテレビ用の尺2分の天気予報原稿を作成してください。";

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      });

      const data = await response.json();
      const script = data.choices[0].message.content.trim();
      res.json({ script });

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: '原稿生成に失敗しました' });
  }
});

// 静的ファイル配信設定
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
