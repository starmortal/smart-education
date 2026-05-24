<template>
  <div class="changelog-doc-page">
    <header class="changelog-doc-top">
      <div class="brand-area" @click="goHome">
        <img class="logo" src="@/assets/logo.png" alt="logo" />
        <span class="brand">智慧教育平台</span>
      </div>
      <el-button text @click="goBack">返回</el-button>
    </header>

    <div class="changelog-doc-body" v-loading="listLoading">
      <aside class="changelog-doc-aside">
        <div class="aside-title">平台文档</div>
        <el-scrollbar class="changelog-version-list">
          <div
            v-for="item in docList"
            :key="item.slug"
            :class="['changelog-version-card', { active: currentSlug === item.slug }]"
            @click="selectDoc(item.slug)"
          >
            <span class="nav-label">{{ item.label }}</span>
          </div>
          <el-empty v-if="!listLoading && docList.length === 0" description="暂无文档" :image-size="60" />
        </el-scrollbar>
      </aside>

      <main ref="mainRef" class="changelog-doc-main" v-loading="contentLoading">
        <div v-if="currentDetail" class="changelog-doc-content">
          <article class="markdown-body" v-html="renderedHtml"></article>
        </div>
        <div v-else-if="!contentLoading" class="changelog-doc-empty">
          <el-empty description="请选择左侧文档查看内容" />
        </div>
      </main>

      <aside v-if="tocList.length" class="changelog-doc-toc">
        <div class="toc-title">本页目录</div>
        <a
          v-for="(item, index) in tocList"
          :key="`${item.id}-${index}`"
          :class="['toc-item', `level-${item.level}`]"
          @click.prevent="scrollToHeading(item.id)"
        >
          {{ item.text }}
        </a>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getPlatformDocList, getPlatformDocDetail } from '@/api/platformDocs';
import { parseChangelogMarkdown, scrollToHeading } from '@/utils/changelogMarkdown';
import '@/styles/changelog-doc.css';

const router = useRouter();
const route = useRoute();

const listLoading = ref(false);
const contentLoading = ref(false);
const docList = ref([]);
const currentSlug = ref('');
const currentDetail = ref(null);
const mainRef = ref(null);

const parsedMarkdown = computed(() => {
  if (!currentDetail.value?.content) {
    return { html: '', toc: [] };
  }
  return parseChangelogMarkdown(currentDetail.value.content);
});

const renderedHtml = computed(() => parsedMarkdown.value.html);
const tocList = computed(() => parsedMarkdown.value.toc);

const LEGACY_DOC_MAP = {
  'privacy-policy': 'privacy-policy',
  'terms-of-service': 'terms-of-service',
  'user-guide': 'user-guide',
  'development-roadmap': 'development-roadmap',
};

function goHome() {
  router.push('/login');
}

function goBack() {
  router.back();
}

async function loadDocList() {
  listLoading.value = true;
  try {
    const res = await getPlatformDocList();
    docList.value = res.data?.list || [];

    if (docList.value.length === 0) {
      currentSlug.value = '';
      currentDetail.value = null;
      return;
    }

    const queryDoc = route.query.doc;
    const target = docList.value.find((d) => d.slug === queryDoc)
      ? queryDoc
      : docList.value[0].slug;

    await selectDoc(target, false);
  } catch (error) {
    console.error('加载平台文档列表失败:', error);
    ElMessage.error('加载平台文档列表失败');
  } finally {
    listLoading.value = false;
  }
}

async function selectDoc(slug, pushQuery = true) {
  if (!slug) return;

  if (slug === currentSlug.value && currentDetail.value) {
    return;
  }

  currentSlug.value = slug;
  if (pushQuery) {
    router.replace({ path: '/platform-docs', query: { doc: slug } });
  }
  await fetchDetail(slug);
}

async function fetchDetail(slug) {
  contentLoading.value = true;
  try {
    const res = await getPlatformDocDetail(slug);
    currentDetail.value = res.data;
    if (mainRef.value) {
      mainRef.value.scrollTop = 0;
    }
  } catch (error) {
    console.error('加载平台文档失败:', error);
    ElMessage.error('加载文档内容失败');
    currentDetail.value = null;
  } finally {
    contentLoading.value = false;
  }
}

watch(
  () => route.query.doc,
  (doc) => {
    if (doc && doc !== currentSlug.value && docList.value.length) {
      const slug = LEGACY_DOC_MAP[doc] || doc;
      if (docList.value.some((d) => d.slug === slug)) {
        selectDoc(slug, false);
      }
    }
  }
);

onMounted(() => {
  loadDocList();
});
</script>
