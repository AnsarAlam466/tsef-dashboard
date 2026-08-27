import { readFile, readdir } from "fs/promises";
import path from "path";
import { marked } from "marked";
import TopBar from "@/components/TopBar";
import PitchBookViewer, { Chapter } from "@/components/PitchBookViewer";

const CONTENT_DIR = path.join(process.cwd(), "content", "pitchbook");

async function loadChapters(): Promise<Chapter[]> {
  const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md")).sort();
  return Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(CONTENT_DIR, file), "utf-8");
      const title = raw.match(/^#\s+(.+)$/m)?.[1] ?? file;
      const html = await marked.parse(raw.replace(/^#\s+.+$/m, ""));
      return { slug: file.replace(/\.md$/, ""), title, html: `<h1>${title}</h1>${html}` };
    })
  );
}

export const dynamic = "force-dynamic";

export default async function PitchBookPage() {
  const chapters = await loadChapters();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <TopBar title="Pitch Book" subtitle="The main idea of our idea — browse the chapters" />
      <PitchBookViewer chapters={chapters} />
    </div>
  );
}
