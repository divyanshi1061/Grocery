import { NextRequest, NextResponse } from "next/server";

const allowedRoles = new Set(["user", "delivery_boy"]);

interface ChatMessage {
    sender: "me" | "other";
    text: string;
}

export async function POST(req: NextRequest) {
    try {
        const { latestMessage, messages, role } = await req.json()

        // ── Validate inputs ────────────────────────────────────────
        if (typeof latestMessage !== "string" || !latestMessage.trim()) {
            return NextResponse.json({ error: "latestMessage is required" }, { status: 400 })
        }
        if (!allowedRoles.has(role)) {
            return NextResponse.json({ error: "Invalid role. Must be 'user' or 'delivery_boy'" }, { status: 400 })
        }
        if (!process.env.GEMINI_API_KEY) {
            console.error("[ai-suggestions] GEMINI_API_KEY is not set in environment")
            return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
        }

        // ── Build conversation history ──────────────────────────────
        const history: ChatMessage[] = Array.isArray(messages) ? messages.slice(-10) : []
        const historyText = history.length > 0
            ? history.map((m) => `${m.sender === "me" ? "Me" : "Other"}: ${m.text}`).join("\n")
            : "(No prior conversation)"

        // ── Role-specific prompts ──────────────────────────────────
        const userPrompt = `You are an AI assistant inside a grocery delivery app chat.
A CUSTOMER is chatting with their delivery partner after placing a grocery order.

--- Chat History (last 10 messages) ---
${historyText}

--- Latest message from the delivery partner ---
"${latestMessage.trim()}"

--- Your Task ---
Write exactly 3 smart, helpful reply suggestions for the CUSTOMER to send back to the delivery partner.

Each suggestion must:
- Directly respond to what the delivery partner just said
- Be short (max 10 words)
- Sound natural and human, like a real WhatsApp message
- Cover a different intent: e.g. one about location, one about ETA, one about item care
- Use at most one emoji
- Be distinct from the others

Do NOT use generic openers like Okay, Sure, Thanks, Got it.
Do NOT use numbering, bullet points, quotes, or extra explanation.

Example good customer replies:
- I am at the blue gate, ring the bell
- Please handle the eggs carefully
- How many more minutes approximately?
- The address on the app is correct

Return ONLY 3 suggestions separated by the pipe character | with no extra text.`

        const deliveryBoyPrompt = `You are an AI assistant inside a grocery delivery app chat.
A DELIVERY PARTNER is chatting with a customer while delivering their grocery order.

--- Chat History (last 10 messages) ---
${historyText}

--- Latest message from the customer ---
"${latestMessage.trim()}"

--- Your Task ---
Write exactly 3 smart, helpful reply suggestions for the DELIVERY PARTNER to send back to the customer.

Each suggestion must:
- Directly respond to what the customer just said
- Be short (max 10 words)
- Sound natural, professional and friendly, like a real WhatsApp message
- Cover a different intent: e.g. one about ETA, one about location, one about the order
- Use at most one emoji
- Be distinct from the others

Do NOT use generic openers like Okay, Sure, On my way alone.
Do NOT use numbering, bullet points, quotes, or extra explanation.

Example good delivery partner replies:
- Reaching in 5 minutes, please be ready
- I am at the main gate, can you come down?
- All your items are packed safely
- Just left the store, ETA 15 mins

Return ONLY 3 suggestions separated by the pipe character | with no extra text.`

        const prompt = role === "user" ? userPrompt : deliveryBoyPrompt

        // ── Call Gemini ────────────────────────────────────────────
        const callGemini = async (): Promise<{ res: Response } | { err: string }> => {
            try {
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.75, maxOutputTokens: 200 },
                        }),
                    }
                )
                return { res }
            } catch (e) {
                return { err: String(e) }
            }
        }

        const geminiResult = await callGemini()

        if ("err" in geminiResult) {
            console.error("[ai-suggestions] Network error calling Gemini:", geminiResult.err)
            return NextResponse.json({ error: "Could not reach AI service", detail: geminiResult.err }, { status: 502 })
        }

        const geminiRes = geminiResult.res

        if (!geminiRes.ok) {
            const errBody = await geminiRes.text()
            console.error(`[ai-suggestions] Gemini HTTP ${geminiRes.status}:`, errBody)
            return NextResponse.json(
                { error: `Gemini error: ${geminiRes.status}`, detail: errBody },
                { status: 502 }
            )
        }

        const data = await geminiRes.json()
        const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ""

        if (!rawText) {
            console.error("[ai-suggestions] Gemini returned empty text. Full response:", JSON.stringify(data))
            return NextResponse.json({ error: "Gemini returned empty response" }, { status: 502 })
        }

        // ── Parse suggestions ──────────────────────────────────────
        // Primary: pipe-separated
        let suggestions: string[] = rawText
            .split(/\s*\|\s*/)
            .map((s: string) => s.replace(/^[\d.\-*•\s"']+|["'\s]+$/g, "").trim())
            .filter((s: string) => s.length > 0)

        // Fallback: comma or newline
        if (suggestions.length < 2) {
            suggestions = rawText
                .split(/[,\n]+/)
                .map((s: string) => s.replace(/^[\d.\-*•\s"']+|["'\s]+$/g, "").trim())
                .filter((s: string) => s.length > 0)
        }

        // Deduplicate and cap at 3
        const unique = [...new Map(suggestions.map((s) => [s.toLowerCase(), s])).values()].slice(0, 3)

        if (unique.length === 0) {
            console.error("[ai-suggestions] Could not parse suggestions from rawText:", rawText)
            return NextResponse.json({ error: "Could not parse suggestions", raw: rawText }, { status: 502 })
        }

        return NextResponse.json({ suggestions: unique }, { status: 200 })

    } catch (error) {
        console.error("[ai-suggestions] Unexpected error:", error)
        return NextResponse.json(
            { error: "Failed to generate AI suggestions", detail: String(error) },
            { status: 500 }
        )
    }
}