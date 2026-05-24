import { marked } from 'marked';

marked.use({ gfm: true, breaks: true });

function slugifyBase(text) {
  const base = String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return base || 'section';
}

function buildHeadingSlugs(tokens) {
  const slugCounts = {};
  const headings = tokens.filter(
    (t) => t.type === 'heading' && t.depth >= 2 && t.depth <= 4
  );

  return headings.map((token) => {
    const base = slugifyBase(token.text);
    const count = slugCounts[base] || 0;
    slugCounts[base] = count + 1;
    const id = count === 0 ? base : `${base}-${count + 1}`;
    return {
      id,
      text: token.text,
      level: token.depth,
    };
  });
}

let currentToc = [];
let headingIndex = 0;

marked.use({
  renderer: {
    heading(text, level) {
      const meta = currentToc[headingIndex];
      headingIndex += 1;
      const id = meta?.id || slugifyBase(text);
      return `<h${level} id="${id}">${text}</h${level}>\n`;
    },
  },
});

/**
 * 解析 Markdown：返回 HTML 与目录（标题 id 与正文锚点一致）
 */
export function parseChangelogMarkdown(content) {
  if (!content) {
    return { html: '', toc: [] };
  }

  const tokens = marked.lexer(content);
  currentToc = buildHeadingSlugs(tokens);
  headingIndex = 0;

  return {
    html: marked.parse(content),
    toc: currentToc,
  };
}

export function scrollToHeading(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
