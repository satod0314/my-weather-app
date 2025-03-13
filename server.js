// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// 環境変数から OpenAI API キーを取得
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// デフォルトプロンプト（例：天気予報原稿生成用）
// ・本日の放送日付と全国全体の天候傾向を述べる
// ・最新の天気予報情報のうち、放送に必要な項目（例：雨や雪の状況、天気図など）を選び紹介する
// ・【全国天気】、【全国気温】、【週間予報】の各セクションは全国全体の傾向を1～2文でまとめる
// ・放送尺は2分、文章量は最大700語まで、ナレーション風の自然な文章にする
const defaultPrompt = `
本日は ${new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} の放送です。最新の天気予報情報を元に、放送に必要な情報を1～2項目選び、導入として１、２文記述してください。その後に以下のメニューごとに原稿を考えてください。

【全国天気】：あすの最新の天気予報を収集して、全国全体の天候傾向を1～2文で簡潔にまとめる。  
【全国気温】：あすの最新の天気予報を収集して、全国の気温動向を1～2文で簡潔にまとめる。  
【週間予報】：最新の天気予報を収集して、1週間の天気の傾向を簡潔にまとめる。

放送尺は2分、文章量は最大700語まで許容し、ナレーション風に自然で流れるような文章で原稿を作成してください。
各段落、項目ごとに改行してください。
`;

// OpenAI ChatGPT API (o3-mini) を呼び出し原稿生成を実施するヘルパー関数
async function generateChatScript(prompt) {
  try {
    console.log("【送信プロンプト】", prompt);
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "o3-mini",
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 700,
        temperature: 0.7
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        }
      }
    );
    console.log("【API レスポンス】", JSON.stringify(response.data, null, 2));
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("【API 呼び出しエラー】", error.response ? error.response.data : error.message);
    throw new Error("原稿生成に失敗しました。");
  }
}

// エンドポイント /generate-weather-script
app.post('/generate-weather-script', async (req, res) => {
  try {
    // ※最新の天気予報情報を収集する処理をここに追加可能（例：OpenWeatherMap APIから取得）
    // ここでは、ダミーの最新天気予報情報を組み合わせる例とする
    const weatherInfo = "最新の天気予報情報として、東京は晴れ、一部地域では小雨の予報が出ています。";
    const prompt = `${weatherInfo}\n\n${defaultPrompt}`;
    console.log("【生成用プロンプト】", prompt);
    
    const generatedScript = await generateChatScript(prompt);
    console.log("【生成原稿】", generatedScript);
    res.json({ script: generatedScript });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// エンドポイント /modify-weather-script（修正指示を反映して再生成）
app.post('/modify-weather-script', async (req, res) => {
  try {
    const { modification } = req.body;
    if (!modification) {
      return res.status(400).json({ error: "修正指示が必要です。" });
    }
    // 修正指示を加えた新たなプロンプト
    const prompt = `${defaultPrompt}\n\n【修正指示】 ${modification}`;
    console.log("【修正生成用プロンプト】", prompt);
    
    const modifiedScript = await generateChatScript(prompt);
    console.log("【修正生成原稿】", modifiedScript);
    res.json({ script: modifiedScript });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`サーバーは http://localhost:${PORT} で起動中です`);
});
