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

const TEAM_NAMES = ["Danny", "Marwa", "Ansar"];

const DEPT_KEYWORDS: Record<string, string[]> = {
  tech: ["code", "deploy", "server", "api", "bug", "fix", "build", "database", "ssh", "vm", "azure", "render", "infrastructure", "ui", "frontend", "backend", "host", "llm", "model", "system", "app", "website", "configure", "setup", "set up", "notion", "domain"],
  marketing: ["marketing", "campaign", "content", "instagram", "social", "post", "reel", "video", "ads", "brand", "audience", "tiktok", "facebook", "cinematic", "storyline", "influencer", "launch", "promote"],
  ops: ["document", "docs", "meeting", "schedule", "organize", "process", "agent", "lead", "onboard", "contract", "legal", "finance", "invoice", "payment", "coordinate", "follow up", "prepare", "send", "email"],
  finance: ["funding", "investor", "revenue", "cost", "budget", "pricing", "fee", "payment", "invoice", "financial"],
  sales: ["agent", "partner", "deal", "outreach", "pitch", "client", "sell", "conversion"],
};

const ACTION_VERBS = ["prepare", "send", "post", "update", "configure", "set up", "setup", "follow up", "reach out", "contact", "draft", "write", "create", "build", "deploy", "fix", "review", "schedule", "organize", "list", "share", "confirm", "book", "arrange", "complete", "finish", "start", "plan", "design", "research", "test", "launch", "publish", "email", "call", "message"];

function detectDepartment(sentence: string): string {
  const lower = sentence.toLowerCase();
  let best = "ops";
  let bestScore = 0;
  for (const [dept, keywords] of Object.entries(DEPT_KEYWORDS)) {
    const score = keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = dept;
    }
  }
  return best;
}

function detectAssignee(sentence: string): string {
  // Check for team member names first
  for (const name of TEAM_NAMES) {
    if (sentence.includes(name)) return name;
  }
  // Check for "X to do Y" or "X will do Y" pattern — but only accept known-sounding names
  const m = sentence.match(/\b([A-Z][a-z]+)\s+(?:to|will|should|must)\s+/);
  const EXCLUDE = ["The", "We", "They", "This", "That", "It", "He", "She", "Need", "Needs", "Notion", "Next", "All", "Our", "My", "Let", "Meeting", "Plan", "New", "Quick", "Today", "Tomorrow"];
  if (m && !EXCLUDE.includes(m[1])) {
    return m[1];
  }
  return "Unassigned";
}

function detectDueDate(sentence: string): string {
  const lower = sentence.toLowerCase();
  const addDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  if (/today|tonight/.test(lower)) return addDays(0);
  if (/tomorrow/.test(lower)) return addDays(1);
  if (/this week|end of week|eow/.test(lower)) return addDays(3);
  if (/next week/.test(lower)) return addDays(7);
  if (/next month/.test(lower)) return addDays(30);

  // Days of week — find next occurrence
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayIdx = new Date().getDay();
  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i])) {
      let diff = i - todayIdx;
      if (diff <= 0) diff += 7; // next occurrence
      return addDays(diff);
    }
  }

  // "by Friday", "by end of month"
  if (/end of month|eom/.test(lower)) {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  }

  // Explicit dates like "2024-01-15" or "15/01/2024"
  const dateMatch = sentence.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (dateMatch) return dateMatch[1];

  // Default: 3 days from now
  return addDays(3);
}

function detectPriority(sentence: string): string {
  const lower = sentence.toLowerCase();
  if (/urgent|asap|immediately|critical|blocker|today|tonight/.test(lower)) return "primary";
  if (/should|need to|must|by friday|by monday|this week/.test(lower)) return "secondary";
  return "parallel";
}

function splitIntoSentences(text: string): string[] {
  // Split on newlines, periods, and bullet points
  return text
    .split(/[\n\r]+|(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter((s) => s.length > 3);
}

function ruleBasedFallback(text: string) {
  const addDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const sentences = splitIntoSentences(text);
  const tasks: Record<string, unknown>[] = [];
  const decisions: string[] = [];
  const openQuestions: string[] = [];

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();

    // Detect open questions
    if (sentence.includes("?") || /not sure|unclear|tbd|to be determined|need to figure|figure out|unsure|unknown/.test(lower)) {
      const q = sentence.replace(/[.!?]+$/, "").trim();
      if (q.length > 5 && !openQuestions.includes(q)) openQuestions.push(q + (sentence.includes("?") ? "" : "?"));
    }

    // Detect decisions
    if (/\b(agreed|decided|confirmed|moving to|switching to|will use|going with|approved|settled on|we'll use|we will|finalized)\b/i.test(sentence)) {
      const d = sentence.replace(/[.!?]+$/, "").trim();
      if (d.length > 5 && !decisions.includes(d)) decisions.push(d);
    }

    // Detect action items — "X to do Y", "X will do Y", "need to", "should", action verbs
    const isAction =
      /\b\w+\s+to\s+(prepare|send|post|update|configure|set up|setup|follow up|reach out|contact|draft|write|create|build|deploy|fix|review|schedule|organize|list|share|confirm|book|arrange|complete|finish|start|plan|design|research|test|launch|publish|email|call|message|work on|handle|do)\b/i.test(sentence) ||
      /\b\w+\s+will\s+/i.test(sentence) ||
      /\b(need to|needs to|should|must|have to)\s+/i.test(sentence) ||
      new RegExp(`\\b(${ACTION_VERBS.join("|")})\\b`, "i").test(sentence);

    if (isAction && !sentence.includes("?")) {
      // Skip if it's a decision we already captured
      const isDecision = /\b(agreed|decided|confirmed|moving to|switching to|will use|going with|approved)\b/i.test(sentence);
      if (isDecision) continue;

      const assignee = detectAssignee(sentence);
      const dept = detectDepartment(sentence);
      const dueDate = detectDueDate(sentence);
      const priority = detectPriority(sentence);

      // Clean up the title — only strip team member name prefix
      let title = sentence.replace(/[.!?]+$/, "").trim();
      for (const name of TEAM_NAMES) {
        title = title.replace(new RegExp(`^${name}\\s+(?:to|will|should|needs?\\s+to|must)\\s+`, "i"), "");
      }
      title = title.replace(/^(?:need to|needs to|should|must|have to)\s+/i, "");
      // Capitalize first letter
      title = title.charAt(0).toUpperCase() + title.slice(1);
      if (title.length > 80) title = title.slice(0, 77) + "...";

      // Avoid duplicates
      if (tasks.some((t) => t.title === title)) continue;

      tasks.push({
        title,
        department: dept,
        assignedTo: assignee,
        priority,
        startDate: addDays(0),
        dueDate,
        fallback: "Escalate to team",
      });
    }
  }

  // Fallbacks if nothing detected
  if (!decisions.length) {
    decisions.push("Meeting notes captured — review extracted items");
  }
  if (!openQuestions.length) {
    openQuestions.push("Any blockers or open items to confirm before next meeting?");
  }
  if (!tasks.length) {
    // If no tasks detected, create a generic follow-up
    tasks.push({
      title: "Review meeting notes and assign action items",
      department: "ops",
      assignedTo: "Unassigned",
      priority: "secondary",
      startDate: addDays(0),
      dueDate: addDays(2),
      fallback: "Push to next meeting",
    });
  }

  // Build summary from first 2-3 sentences
  const summarySentences = sentences.slice(0, 3).join(" ");
  const summary = summarySentences.length > 300 ? summarySentences.slice(0, 297) + "..." : summarySentences || text.slice(0, 280);

  return {
    summary,
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
    console.log("[NLP] No OPENAI_API_KEY set — using rule-based parser");
    return NextResponse.json({ ...ruleBasedFallback(text), _parser: "rules" });
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
      _parser: "openai",
    });
  } catch (err) {
    console.error("[NLP] OpenAI parse failed, using rule-based fallback:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ...ruleBasedFallback(text), _parser: "rules" });
  }
}
