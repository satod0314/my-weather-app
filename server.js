// server.js
const express = require('express');
const axios = require('axios');
require('dotenv').config(); // .envファイルから環境変数を読み込む

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// 環境変数からAPIキーを取得
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 修正済みデフォルトプロンプトの定義
const defaultPrompt = `あなたはテレビの天気予報キャスターです。最新の全国の気象情報と天気予報を反映させ、以下の条件に基づいてテレビ放送用の原稿を作成してください。

【前半】  
・冒頭で本日の放送日付と、全体の天候傾向（例：「全国的に晴れ間が広がる中、局地的に雨模様」など）を述べる。  
・その後、全国の雨や雪の様子、雲画像、天気図、あすの天気図、あすの雨の予想、天気分布予想など、放送に必要と思われる1～2項目をピックアップして紹介する。

【後半】  
・【全国天気】、【全国気温】、【週間予報】の各セクションについては、主要都市ごとに羅列するのではなく、全国全体の傾向を1～2文で簡潔にまとめて記述すること。

【その他の条件】  
・放送尺は2分で、文章量は最大700語まで許容する。  
・放送原稿として、ナレーション風に自然で流れるような文章にする。  
・各セクションの出力はタイトルと本文を分けること。

以上の条件に基づいて、最新の全国天気予報原稿を日本語で作成してください。`;

app.post('/generate-weather-script', async (req, res) => {
  try {
    console.log("使用するプロンプト:", defaultPrompt);

    // OpenAI APIへリクエスト送信（モデルはgpt-3.5-turboを使用）
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: 'user', content: defaultPrompt }],
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

    console.log("OpenAI API Response:", JSON.stringify(response.data, null, 2));
    const script = response.data.choices[0].message.content.trim();
    console.log("生成された原稿:", script);
    res.json({ script });
  } catch (error) {
    console.error("OpenAI API呼び出しエラー:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "原稿生成に失敗しました。" });
  }
});

// 修正用エンドポイント（修正指示を反映して再生成する）
app.post('/modify-weather-script', async (req, res) => {
  try {
    const { instruction } = req.body;
    console.log("修正指示:", instruction);

    const modifiedPrompt = `${defaultPrompt}\n\n【修正指示】\n${instruction}\n\n以上の条件に基づいて、改めて原稿を作成してください。`;
    console.log("修正後のプロンプト:", modifiedPrompt);

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: 'user', content: modifiedPrompt }],
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

    console.log("修正後OpenAI API Response:", JSON.stringify(response.data, null, 2));
    const modifiedScript = response.data.choices[0].message.content.trim();
    console.log("修正後生成された原稿:", modifiedScript);
    res.json({ modifiedScript });
  } catch (error) {
    console.error("修正処理エラー:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "原稿修正に失敗しました。" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
