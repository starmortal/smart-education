const fs = require('fs').promises;
const path = require('path');
const { AppError } = require('../middleware/errorHandler');

const CHANGELOG_DIR = path.join(__dirname, '../../docs/changelog');

function parseVersionNumber(version) {
  return version.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
}

function compareVersionDesc(a, b) {
  const pa = parseVersionNumber(a);
  const pb = parseVersionNumber(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (pb[i] || 0) - (pa[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function extractMeta(content) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const dateMatch = content.match(/\*\*发布日期\*\*:\s*(.+)/);
  const overviewMatch = content.match(/##\s+🎯\s*本次更新概述\s*\n+([^\n#]+)/);

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    date: dateMatch ? dateMatch[1].trim() : '',
    overview: overviewMatch ? overviewMatch[1].trim() : '',
  };
}

function extractToc(content) {
  const toc = [];
  const lines = content.split('\n');

  lines.forEach((line) => {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) return;

    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-');

    if (id) {
      toc.push({ id, text, level });
    }
  });

  return toc;
}

async function listChangelogs() {
  let files = [];
  try {
    files = await fs.readdir(CHANGELOG_DIR);
  } catch (error) {
    throw new AppError('更新日志目录不存在', 500);
  }

  const mdFiles = files.filter((f) => /^v[\d.]+\.md$/i.test(f));

  const list = await Promise.all(
    mdFiles.map(async (file) => {
      const version = file.replace(/\.md$/i, '');
      const content = await fs.readFile(path.join(CHANGELOG_DIR, file), 'utf-8');
      const meta = extractMeta(content);
      return {
        version,
        file,
        ...meta,
      };
    })
  );

  list.sort((a, b) => compareVersionDesc(a.version, b.version));
  return list;
}

async function getChangelog(version) {
  if (!/^v[\d.]+$/i.test(version)) {
    throw new AppError('无效的版本号', 400);
  }

  const filePath = path.join(CHANGELOG_DIR, `${version}.md`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const meta = extractMeta(content);
    const toc = extractToc(content);

    return {
      version,
      content,
      toc,
      ...meta,
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new AppError('该版本更新日志不存在', 404);
    }
    throw error;
  }
}

module.exports = {
  listChangelogs,
  getChangelog,
};
