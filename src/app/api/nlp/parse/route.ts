import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { DEPARTMENTS } from "@/models/User";
import { PRIORITIES } from "@/models/Task";

const SYSTEM_PROMPT = `You are the parsing engine for TSEF (Ten&See Execution Framework), a small team's meeting-to-task extraction tool.
Given raw meeting notes/transcripts, extract structured output as strict JSON with this shape:
{
  "summary": string (2-4 sentences),
  "decisions": string[] (explicit or implicit decisions made),
  "openQuestions": string[] (unresolved questions/blockers),
  "tasks": [
    {
      "title": string,
      "department": one of ${JSON.stringify(DEPARTMENTS)},
      "assignedTo": string (a person's name mentioned, or "Unassigned"),
      "priority": one of ${JSON.stringify(PRIORITIES)},
      "startDate": string (YYYY-MM-DD, when work should begin, usually today or soon),
      "dueDate": string (YYYY-MM-DD, infer a reasonable near-term date if not stated),
      "fallback": string (what happens if this isn't done, or "Escalate to team")
    }
  ]
}
Return ONLY valid JSON, no markdown fences, no commentary.`;

function ruleBasedFallback(text: string) {
  const lower = text.toLowerCase();
  const tasks: Record<string, unknown>[] = [];
  const decisions: string[] = [];
  const openQuestions: string[] = [];
  const addDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  if (/azure|render|ssh|vm|infrastructure/.test(lower)) {
    decisions.push("Infrastructure direction discussed");
    tasks.push({ title: "Document infrastructure setup", department: "tech", assignedTo: "Unassigned", priority: "primary", startDate: addDays(0), dueDate: addDays(3), fallback: "Group meeting" });
  }
  if (/marketing|campaign|content|platform/.test(lower)) {
    decisions.push("Marketing direction discussed");
    tasks.push({ title: "Follow up on marketing plan", department: "marketing", assignedTo: "Unassigned", priority: "secondary", startDate: addDays(1), dueDate: addDays(5), fallback: "Push to next meeting" });
  }
  if (!decisions.length) decisions.push("Meeting notes captured — review extracted tasks");
  if (!openQuestions.length) openQuestions.push("Any blockers or open items to confirm next meeting?");

  return {
    summary: text.length > 280 ? text.slice(0, 280).trim() + "…" : text,
    decisions,
    openQuestions,
    tasks,
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();
  if (!text || !String(text).trim()) {
    return NextResponse.json({ error: "No transcript text provided" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(ruleBasedFallback(text));
  }

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      summary: parsed.summary || "",
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    });
  } catch (err) {
    console.error("OpenAI NLP parse failed, falling back to rules:", err);
    return NextResponse.json(ruleBasedFallback(text));
  }
}
