import OpenAI from 'openai';

// 定義環境變數介面
export interface Env {
  XAI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 1. 處理 CORS (讓前端 React 可以呼叫)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // 正式上線建議改成前端網域
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // 處理預檢請求 (Preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 只允許 POST 請求
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
      // 2. 解析前端傳來的訊息
      const body = await request.json() as { message: string };
      const userMessage = body.message || ".....";

      // 3. 初始化 OpenAI SDK (連接 xAI)
      const openai = new OpenAI({
        apiKey: env.XAI_API_KEY,
        baseURL: "https://api.x.ai/v1",
      });

      // 4. 呼叫 Grok (這裡先用 Hardcode 的 System Prompt 測試連通性)
      // 之後我們會接上資料庫讀取動態 Prompt
      const completion = await openai.chat.completions.create({
        model: "grok-4-1-fast-non-reasoning", // [cite: 10]
        messages: [
          {
            role: "system",
            content: "You are 緋紅 (Crimson), a seductive Oiran. Reply in a teasing manner."
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 1.0, // [cite: 38]
        max_tokens: 300,  // [cite: 39]
      });

      const aiReply = completion.choices[0].message.content;

      // 5. 回傳 JSON 給前端
      return new Response(JSON.stringify({ reply: aiReply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error) {
      // 錯誤處理
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};