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

// ユーザー入力に基づいてプロンプトを組み立てるヘルパー関数
function buildPrompt(settings) {
  const {
    targetDate,      // "あす" or "あさって"
    timeSlot,        // "朝", "昼", "夜"
    region,          // "全国", "東北", "関東甲信越", "関東", "東海", "近畿", "四国", "中国", "九州", "沖縄・奄美", または各県個別選択
    cornerDuration,  // "30秒", "1分", "2分", "3分", "4分", "5分"
    menuCount,       // "4", "5", "6"
    originalMenu     // 任意文字列
  } = settings;

  // 基本メニューの組み立て（選択した地域情報を反映）
  const basicMenu = `
【天気概況】
【${region}の天気】
【${region}の気温】
【${region}の週間予報】
  `.trim();
  
  const menuSection = originalMenu ? basicMenu + "\n【オリジナルメニュー】 " + originalMenu : basicMenu;
  
  // プロンプト組み立て
  const prompt = `
必ず出力の最初に、以下の形式で作成日時を記載してください：
【作成日時】: ${new Date().toLocaleString('ja-JP')}

次に、最新の今日と明日の全国天気概要を1～2文で記述してください。

対象日時: ${targetDate}、時間帯: ${timeSlot}
天気予報コーナー尺: ${cornerDuration}、メニュー数: ${menuCount}

以下のメニューに基づいてテレビ用天気予報原稿を作成してください。
${menuSection}

各セクション【全国天気】、【全国気温】、【週間予報】は、それぞれ改行して独立した段落として出力し、全国全体の傾向を1～2文でまとめること。
放送尺は2分、文章量は最大700語まで許容し、ナレーション風に自然な文章で原稿を作成してください。
文章の最後に、全体の文字数を括弧内に記載してください。
  `.trim();
  
  return prompt;
}

// OpenAI ChatGPT API (gpt-3.5-turbo) を呼び出し原稿生成するヘルパー関数
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
    const settings = req.body.settings;
    if (!settings) {
      return res.status(400).json({ error: "設定情報が必要です。" });
    }
    const prompt = buildPrompt(settings);
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
    const { modification, settings } = req.body;
    if (!modification) {
      return res.status(400).json({ error: "修正指示が必要です。" });
    }
    const prompt = buildPrompt(settings) + `\n\n【修正指示】 ${modification}`;
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
