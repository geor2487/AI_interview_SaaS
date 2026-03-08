import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseResumeText } from "@/lib/openai/resume-parser";
// pdf-parse is loaded dynamically to avoid build-time test file loading issue

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "ファイルが選択されていません。" }, { status: 400 });
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "ファイルサイズが大きすぎます（最大10MB）。" }, { status: 400 });
  }

  try {
    let text = "";

    if (file.type === "application/pdf") {
      const buffer = Buffer.from(await file.arrayBuffer());
      // Import lib directly to avoid pdf-parse test file loading issue
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse/lib/pdf-parse");
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else if (
      file.type === "text/plain" ||
      file.type === "text/csv" ||
      file.name.endsWith(".txt")
    ) {
      text = await file.text();
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      // For DOCX, extract raw text from the XML
      // A simple approach: read as arraybuffer and use a basic extraction
      text = await extractDocxText(file);
    } else {
      return NextResponse.json(
        { error: "対応していないファイル形式です。PDF、Word (.docx)、テキストファイルに対応しています。" },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "ファイルからテキストを抽出できませんでした。スキャン画像のPDFは対応していません。" },
        { status: 400 }
      );
    }

    // Truncate to avoid excessive token usage
    const truncated = text.slice(0, 15000);
    const parsed = await parseResumeText(truncated);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Resume parse error:", err);
    return NextResponse.json(
      { error: "解析中にエラーが発生しました。ファイル形式を確認してください。" },
      { status: 500 }
    );
  }
}

async function extractDocxText(file: File): Promise<string> {
  // DOCX files are ZIP archives containing XML.
  // We'll do a simple extraction of text content from the XML.
  const JSZip = (await import("jszip")).default;
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) return "";
  // Strip XML tags to get plain text
  return docXml
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<w:p[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
