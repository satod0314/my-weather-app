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

// デフォルトプロンプトの定義
const defaultPrompt = `あなたはテレビの天気予報キャスターです。最新の全国の気象情報と天気予報を反映させ、全国の主要都市（東京、大阪、名古屋、札幌、福岡など）の天候、気温、湿度、風向・風速、降水確率などを含めた、視聴者にわかりやすく親しみやすいテレビ天気予報原稿を作成してください。全体の尺は2分で、文章量は最大700語まで許容します。

【条件】
1. 原稿の冒頭で、本日の放送日付と、全体の天候の傾向（例：「全国的に晴れ間が広がる中、局地的に雨模様」）を述べる。
2. 各地域の天気を具体的な数値や特徴（最高・最低気温、降水確率、風向・風速など）で紹介する。
3. 出力は各メニューごとに、タイトルと本文を分けて記載する。必ず「【全国天気】」「【全国気温】」「【週間予報】」の各セクションを含めること。
4. 放送原稿として、ナレーション風に自然で流れるような文章にする。
5. 最新の気象情報、天気予報を反映させる。

以上の条件に基づいて、日本語で最新の全国天気予報原稿を作成してください。`;

app.post('/generate-weather-script', async (req, res) => {
  try {
    console.log("使用するプロンプト:", defaultPrompt);

    // OpenAI APIへリクエスト送信
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",  // 利用するモデルを「o3-mini」に変更（※ご確認ください）
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

// 修正用エンドポイント（入力された修正文を反映するサンプル実装）
// ※ 実際の修正処理はご要件に合わせて調整してください
app.post('/modify-weather-script', async (req, res) => {
  try {
    const { instruction } = req.body;
    console.log("修正指示:", instruction);

    // 修正用プロンプト例：既存のデフォルトプロンプトに、修正指示を加えて再生成する
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
