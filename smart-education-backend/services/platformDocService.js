const fs = require('fs').promises;
const path = require('path');
const { AppError } = require('../middleware/errorHandler');

const DOCS_ROOT = path.join(__dirname, '../../docs');

const PLATFORM_DOCS = [
  {
    slug: 'privacy-policy',
    label: '隐私政策',
    category: 'legal',
    file: 'legal/privacy-policy.md',
    order: 1,
  },
  {
    slug: 'terms-of-service',
    label: '服务条款',
    category: 'legal',
    file: 'legal/terms-of-service.md',
    order: 2,
  },
  {
    slug: 'user-guide',
    label: '使用文档',
    category: 'guide',
    file: 'guide/user-guide.md',
    order: 3,
  },
  {
    slug: 'development-roadmap',
    label: '发展规划',
    category: 'guide',
    file: 'guide/development-roadmap.md',
    order: 4,
  },
];

function listPlatformDocs() {
  return PLATFORM_DOCS.map(({ slug, label, category, order }) => ({
    slug,
    label,
    category,
    order,
  })).sort((a, b) => a.order - b.order);
}

async function getPlatformDoc(slug) {
  const doc = PLATFORM_DOCS.find((item) => item.slug === slug);
  if (!doc) {
    throw new AppError('文档不存在', 404);
  }

  const filePath = path.join(DOCS_ROOT, doc.file);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return {
      slug: doc.slug,
      label: doc.label,
      category: doc.category,
      content,
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new AppError('文档文件不存在', 404);
    }
    throw error;
  }
}

module.exports = {
  listPlatformDocs,
  getPlatformDoc,
};
