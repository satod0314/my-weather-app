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

// デフォルトプロンプトの定義
// ・最初に本日の日付と時刻を記載する。
// ・最新の今日・明日の全国天気の概要を1～2文で記述する。
// ・その後、各セクション【全国天気】、【全国気温】、【週間予報】で全国全体の傾向を出力するように指示する。
// ・放送尺は2分、文章量は最大700語まで許容し、ナレーション風に自然で流れる文章とし、文章の最後に全体の文字数を括弧内に記載する。
const defaultPrompt = `
${new Date().toLocaleString('ja-JP')}

最新の今日と明日の全国天気の概要を、1～2文で簡潔に記述してください。

以下の条件に基づいて、テレビ放送用の天気予報原稿を作成してください。
全国全体の天候傾向や放送に必要な情報を適切に組み込み、以下の各セクションを出力してください。

【全国天気】：全国全体の天候傾向を1～2文で簡潔にまとめること。
【全国気温】：全国の気温動向を1～2文で簡潔にまとめること。
【週間予報】：1週間の天気の傾向を簡潔にまとめること。

放送尺は2分、文章量は最大700語まで許容し、ナレーション風に自然で流れる文章で原稿を作成し、文章の最後に全体の文字数を括弧内に記載してください。
`;

// OpenAI ChatGPT API (gpt-3.5-turbo) を呼び出し原稿生成を実施するヘルパー関数
async function generateChatScript(prompt) {
  try {
    console.log("【送信プロンプト】", prompt);
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
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

// /generate-weather-script エンドポイント
app.post('/generate-weather-script', async (req, res) => {
  try {
    // 外部天気情報取得処理はここで実装可能（例：OpenWeatherMap APIから取得） - 今回は省略
    // ここでは、defaultPrompt の指示に基づいて原稿生成を実施
    const prompt = defaultPrompt;
    console.log("【生成用プロンプト】", prompt);
    
    const generatedScript = await generateChatScript(prompt);
    console.log("【生成原稿】", generatedScript);
    res.json({ script: generatedScript });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// /modify-weather-script エンドポイント：修正指示を反映して再生成
app.post('/modify-weather-script', async (req, res) => {
  try {
    const { modification } = req.body;
    if (!modification) {
      return res.status(400).json({ error: "修正指示が必要です。" });
    }
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
