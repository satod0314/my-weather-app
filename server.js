// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// ヘルパー関数：GCP Gemini API を呼び出し原稿生成を実施
async function generateScript(prompt) {
  try {
    const geminiEndpoint = process.env.GEMINI_API_ENDPOINT;
    const payload = {
      prompt: prompt,
      max_output_tokens: 1000  // 必要に応じて調整してください
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GCP_API_KEY}`
    };

    console.log('【送信プロンプト】', prompt);
    const response = await axios.post(geminiEndpoint, payload, { headers });
    console.log('【Gemini API レスポンス】', response.data);
    return response.data;
  } catch (error) {
    console.error('【Gemini API エラー】', error.message);
    throw new Error('原稿生成に失敗しました。');
  }
}

// /generate-weather-script エンドポイント
app.post('/generate-weather-script', async (req, res) => {
  try {
    // 本日の放送日付
    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // ダミーの天気予報情報は利用せず、Gemini の生成結果に任せる
    const prompt = `
【前半】
本日は ${today} の放送です。全国全体では晴れ間が広がる中、一部地域では雨や雪の兆候も見られます。
最新の天気予報情報について、適切なコメントを生成してください。

【後半】
【全国天気】：全国の天候傾向を1～2文で簡潔にまとめます。
【全国気温】：全国の気温動向を1～2文で記載します。
【週間予報】：1週間の天気の傾向を簡潔にまとめます。

放送尺は2分、文章量は最大700語までとし、ナレーション風に自然で流れる文章でお願いします。
    `;
    console.log('【生成用プロンプト】', prompt);

    // Gemini API を呼び出し原稿生成
    const scriptResult = await generateScript(prompt);
    const generatedScript = scriptResult.result || '原稿生成結果がここに表示されます。';

    console.log('【生成原稿】', generatedScript);

    res.json({ script: generatedScript });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// /modify-weather-script エンドポイント：クライアントからの修正指示に応じて原稿再生成
app.post('/modify-weather-script', async (req, res) => {
  try {
    const { modification } = req.body;
    if (!modification) {
      return res.status(400).json({ error: '修正指示が必要です。' });
    }

    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // 修正指示を反映した新たなプロンプト（天気予報情報は Gemini の生成結果に任せる）
    const prompt = `
【前半】
本日は ${today} の放送です。全国全体では晴れ間が広がる中、一部地域では雨や雪の兆候も見られます。
天気予報情報に関して、以下の修正指示を加えた原稿を生成してください：
【修正指示】：${modification}

【後半】
【全国天気】：全国の天候傾向を1～2文で簡潔にまとめます。
【全国気温】：全国の気温動向を1～2文で記載します。
【週間予報】：1週間の天気の傾向を簡潔にまとめます。

放送尺は2分、文章量は最大700語までとし、ナレーション風に自然で流れる文章でお願いします。
    `;
    console.log('【修正生成用プロンプト】', prompt);

    // Gemini API を呼び出し再生成
    const scriptResult = await generateScript(prompt);
    const generatedScript = scriptResult.result || '修正後の原稿生成結果がここに表示されます。';

    console.log('【修正指示】', modification);
    console.log('【生成原稿】', generatedScript);

    res.json({ script: generatedScript });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`サーバーはポート ${PORT} で起動中です`);
});
