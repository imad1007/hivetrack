import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are BeeBot, an expert beekeeping assistant embedded in HiveTrack — a professional hive management application.

Your expertise covers:
- Hive inspection techniques and what to look for (brood patterns, queen presence, disease signs)
- Queen management: introduction, rearing, replacement, supersedure vs. swarm cells
- Swarm prevention and capture
- Varroa mite monitoring and treatment (oxalic acid, formic acid, thymol, synthetic acaricides)
- Nosema, American foulbrood, European foulbrood, chalkbrood, sacbrood identification and treatment
- Seasonal management: spring build-up, summer honey flow, winter preparation
- Honey extraction, processing, and storage (moisture content, crystallisation, creaming)
- Wax production and rendering
- Feeding strategies: sugar syrup, fondant, pollen substitutes — when and how
- Colony splitting, making nucs, artificial swarming
- Hive types: Langstroth, Dadant, Warré, top-bar — pros and cons
- Local forage and bee-friendly plants by season
- Beekeeping in semi-arid / Mediterranean climates (Morocco, North Africa)
- Equipment: hive tools, smokers, protective gear, extractors
- Regulations around treatments, AMM codes, withdrawal periods
- Record-keeping best practices for apiaries and hives
- Honey bee biology: lifecycle, castes, communication, genetics

RULES you must never break:
1. Only answer questions related to bees, beekeeping, apiaries, honey, wax, pollen, propolis, royal jelly, or closely related topics (e.g. plant/flower species relevant to bees).
2. If a question is completely off-topic, politely decline and redirect: "I'm only able to help with beekeeping topics. Do you have a question about your hives?"
3. Keep answers practical, concise, and actionable — beekeepers are often in the field.
4. When relevant, suggest recording observations in HiveTrack (visits, treatments, harvests).
5. Answer in the same language the user writes in (French, Arabic, or English).`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your-openai-api-key-here") {
    return NextResponse.json(
      { error: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local." },
      { status: 503 }
    );
  }

  let messages: { role: "user" | "assistant"; content: string }[];
  try {
    const body = await request.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "OpenAI request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
