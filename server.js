{\rtf1\ansi\ansicpg932\cocoartf2761
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // server.js\
const express = require('express');\
const axios = require('axios');\
const bodyParser = require('body-parser');\
\
const app = express();\
const PORT = process.env.PORT || 3000;\
// \uc0\u25351 \u23450 \u12373 \u12428 \u12383  OpenAI API \u12461 \u12540 \u65288 \u26412 \u26469 \u12399 \u29872 \u22659 \u22793 \u25968 \u12394 \u12393 \u12391 \u31649 \u29702 \u12377 \u12409 \u12365 \u12391 \u12377 \u65289 \
const OPENAI_API_KEY = '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';\
\
app.use(bodyParser.json());\
\
// AI API \uc0\u12434 \u21628 \u12403 \u20986 \u12375 \u12390 \u22825 \u27671 \u20104 \u22577 \u21407 \u31295 \u12434 \u29983 \u25104 \u12377 \u12427 \u12456 \u12531 \u12489 \u12509 \u12452 \u12531 \u12488 \
app.post('/generate-weather-script', async (req, res) => \{\
  try \{\
    // \uc0\u12371 \u12371 \u12391 \u24517 \u35201 \u12394 \u12497 \u12521 \u12513 \u12540 \u12479 \u12540 \u12434 \u29992 \u12356 \u12390 \u12503 \u12525 \u12531 \u12503 \u12488 \u12434 \u20316 \u25104 \u12375 \u12414 \u12377 \
    const prompt = "\uc0\u26368 \u26032 \u12398 \u22825 \u27671 \u24773 \u22577 \u12392 \u27880 \u30446 \u12488 \u12500 \u12483 \u12463 \u12434 \u21453 \u26144 \u12375 \u12383 \u12289 \u12486 \u12524 \u12499 \u25918 \u36865 \u29992 \u12398 2\u20998 \u23610 \u12398 \u22825 \u27671 \u20104 \u22577 \u21407 \u31295 \u12434 \u20316 \u25104 \u12375 \u12390 \u12367 \u12384 \u12373 \u12356 \u12290 \u26481 \u20140 \u12398 \u24773 \u22577 \u12434 \u20013 \u24515 \u12395 \u12289 \u20840 \u22269 \u12398 \u22825 \u27671 \u27010 \u27841 \u12418 \u21547 \u12417 \u12289 \u35222 \u32884 \u32773 \u12395 \u12431 \u12363 \u12426 \u12420 \u12377 \u12367 \u20253 \u12360 \u12427 \u25991 \u31456 \u12391 \u12290 ";\
\
    // OpenAI API \uc0\u12395 \u12522 \u12463 \u12456 \u12473 \u12488 \
    const response = await axios.post('https://api.openai.com/v1/completions', \{\
      model: "text-davinci-003",\
      prompt: prompt,\
      max_tokens: 500,\
      temperature: 0.7\
    \}, \{\
      headers: \{\
        "Content-Type": "application/json",\
        "Authorization": `Bearer $\{OPENAI_API_KEY\}`\
      \}\
    \});\
    \
    const generatedText = response.data.choices[0].text.trim();\
    res.json(\{ script: generatedText \});\
  \} catch (error) \{\
    console.error("Error:", error);\
    res.status(500).json(\{ error: "\uc0\u21407 \u31295 \u29983 \u25104 \u12395 \u22833 \u25943 \u12375 \u12414 \u12375 \u12383 " \});\
  \}\
\});\
\
app.listen(PORT, () => \{\
  console.log(`Server is running on port $\{PORT\}`);\
\});\
}