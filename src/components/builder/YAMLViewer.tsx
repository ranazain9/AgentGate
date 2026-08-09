import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface YAMLViewerProps {
  code: string;
  maxHeight?: string;
}

/**
 * Basic YAML syntax highlighting using regex replacements.
 */
function highlightYaml(code: string): string {
  return code
    // Keys before colon (teal)
    .replace(/^(\s*)([\w_-]+)(:)/gm, '$1<span class="text-teal-400">$2</span>$3')
    // String values in quotes (amber)
    .replace(/(:)\s+"([^"]*)"/g, '$1 <span class="text-amber-300/90">"$2"</span>')
    // Plain string values (amber)
    .replace(/(:\s+)(\|)/g, '$1<span class="text-amber-300/90">$2</span>')
    .replace(/^(\s+)([a-zA-Z][a-zA-Z0-9_\/. -]*)$/gm, '$1<span class="text-amber-300/90">$2</span>')
    // Boolean and number values (purple)
    .replace(/(:\s+)(true|false)/g, '$1<span class="text-purple-400">$2</span>')
    .replace(/(:\s+)(\d+\.?\d*)/g, '$1<span class="text-purple-400">$2</span>')
    // Inline array markers (dim)
    .replace(/(\s*- )/g, '<span class="text-muted">$1</span>')
    // Governance state values (bold)
    .replace(/(PROBATION|ACTIVE|SUSPENDED)/g, '<span class="text-purple-400 font-medium">$1</span>');
}

export default function YAMLViewer({ code, maxHeight = '500px' }: YAMLViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = code.split('\n');

  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-[#0a0a0a]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-[#0f0f0f]">
        <span className="text-xs text-muted font-mono">agent.yaml</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors px-2 py-1 rounded-md hover:bg-card"
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code area */}
      <div
        className="overflow-y-auto font-mono text-[13px] leading-[1.6]"
        style={{ maxHeight }}
      >
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="hover:bg-white/[0.02]">
                <td className="select-none text-right text-[11px] text-muted/40 w-[3rem] px-3 py-0 align-top">
                  {i + 1}
                </td>
                <td className="py-0 pr-4 whitespace-pre-wrap break-all">
                  <span
                    dangerouslySetInnerHTML={{ __html: highlightYaml(line) || '&nbsp;' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}