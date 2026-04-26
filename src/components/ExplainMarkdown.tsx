import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** LLMs often wrap Markdown in ```markdown fences, which would render as a code block. */
export function preprocessLlmMarkdown(raw: string): string {
  return raw
    .replace(/```(?:markdown|md)\s*\n([\s\S]*?)```/gi, (_, body: string) => `\n${body.trim()}\n`)
    .trim();
}

export function ExplainMarkdown({ source }: { source: string }) {
  const text = preprocessLlmMarkdown(source);
  return (
    <div className="explain-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
