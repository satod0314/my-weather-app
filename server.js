// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// ヘルパー関数：最新の天気情報を外部APIから取得
async function fetchWeatherInfo() {
  try {
    const weatherApiUrl = `http://api.openweathermap.org/data/2.5/weather?q=${process.env.WEATHER_CITY}&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=ja`;
    const response = await axios.get(weatherApiUrl);
    console.log('【天気情報取得結果】', response.data);
    return response.data;
  } catch (error) {
    console.error('【天気情報取得エラー】', error.message);
    throw new Error('天気情報の取得に失敗しました。');
  }
}

// ヘルパー関数：GCP Gemini API を呼び出し原稿生成を実施
async function generateScript(prompt) {
  try {
    const geminiEndpoint = process.env.GEMINI_API_ENDPOINT;
    const payload = {
      prompt: prompt,
      max_output_tokens: 1000  // 必要に応じて調整してください
      // 他に必要なパラメータがあればここに追加
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
    // 最新天気情報の取得
    const weatherData = await fetchWeatherInfo();
    const temperature = weatherData.main.temp;
    const weatherDescription = weatherData.weather[0].description;
    // 例として気温と天候説明をピックアップ
    const weatherInfoSnippet = `現在の${process.env.WEATHER_CITY}は${temperature}℃、${weatherDescription}です。`;

    // 本日の放送日付
    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // デフォルトプロンプト作成
    const prompt = `
【前半】
本日は ${today} の放送です。全国全体では晴れ間が広がる中、一部地域では雨や雪の兆候も見られます。
最新の天気予報情報として、${weatherInfoSnippet} など、今日の放送に必要な1～2項目を取り上げます。

【後半】
【全国天気】：全国の天候傾向を1～2文で簡潔にまとめます。
【全国気温】：全国の気温動向を1～2文で記載します。
【週間予報】：1週間の天気の傾向を簡潔にまとめます。

放送尺は2分、文章量は最大700語までとし、ナレーション風に自然で流れる文章でお願いします。
    `;
    console.log('【生成用プロンプト】', prompt);

    // Gemini API を呼び出し原稿生成
    const scriptResult = await generateScript(prompt);
    // APIレスポンス内のフィールド（例: result）に生成原稿が入っていると仮定
    const generatedScript = scriptResult.result || '原稿生成結果がここに表示されます。';

    // デバッグ用ログ出力
    console.log('【最終天気情報】', weatherInfoSnippet);
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

    // 最新天気情報の取得
    const weatherData = await fetchWeatherInfo();
    const temperature = weatherData.main.temp;
    const weatherDescription = weatherData.weather[0].description;
    const weatherInfoSnippet = `現在の${process.env.WEATHER_CITY}は${temperature}℃、${weatherDescription}です。`;

    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // 修正指示を反映した新たなプロンプト
    const prompt = `
【前半】
本日は ${today} の放送です。全国全体では晴れ間が広がる中、一部地域では雨や雪の兆候も見られます。
最新の天気予報情報として、${weatherInfoSnippet} を踏まえ、以下の修正指示を加えた原稿を生成してください：
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
