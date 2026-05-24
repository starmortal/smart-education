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
        <div class="aside-title">版本历史</div>
        <el-scrollbar class="changelog-version-list">
          <div
            v-for="item in versionList"
            :key="item.version"
            :class="['changelog-version-card', { active: currentVersion === item.version }]"
            @click="selectVersion(item.version)"
          >
            <span class="version-label">{{ item.version }}</span>
          </div>
          <el-empty v-if="!listLoading && versionList.length === 0" description="暂无日志" :image-size="60" />
        </el-scrollbar>
      </aside>

      <main ref="mainRef" class="changelog-doc-main" v-loading="contentLoading">
        <div v-if="currentDetail" class="changelog-doc-content">
          <article class="markdown-body" v-html="renderedHtml"></article>
        </div>
        <div v-else-if="!contentLoading" class="changelog-doc-empty">
          <el-empty description="请选择左侧版本查看更新内容" />
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
import { getChangelogList, getChangelogDetail } from '@/api/changelog';
import { parseChangelogMarkdown, scrollToHeading } from '@/utils/changelogMarkdown';
import '@/styles/changelog-doc.css';

const router = useRouter();
const route = useRoute();

const listLoading = ref(false);
const contentLoading = ref(false);
const versionList = ref([]);
const currentVersion = ref('');
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

function goHome() {
  router.push('/');
}

function goBack() {
  router.back();
}

async function loadVersionList() {
  listLoading.value = true;
  try {
    const res = await getChangelogList();
    versionList.value = res.data?.list || [];

    if (versionList.value.length === 0) {
      currentVersion.value = '';
      currentDetail.value = null;
      return;
    }

    const queryVersion = route.query.version;
    const target = versionList.value.find((v) => v.version === queryVersion)
      ? queryVersion
      : versionList.value[0].version;

    await selectVersion(target, false);
  } catch (error) {
    console.error('加载更新日志列表失败:', error);
    ElMessage.error('加载更新日志列表失败');
  } finally {
    listLoading.value = false;
  }
}

async function selectVersion(version, pushQuery = true) {
  if (!version) return;

  if (version === currentVersion.value && currentDetail.value) {
    return;
  }

  currentVersion.value = version;
  if (pushQuery) {
    router.replace({ path: '/changelog', query: { version } });
  }
  await fetchDetail(version);
}

async function fetchDetail(version) {
  contentLoading.value = true;
  try {
    const res = await getChangelogDetail(version);
    currentDetail.value = res.data;
    if (mainRef.value) {
      mainRef.value.scrollTop = 0;
    }
  } catch (error) {
    console.error('加载更新日志详情失败:', error);
    ElMessage.error('加载该版本内容失败');
    currentDetail.value = null;
  } finally {
    contentLoading.value = false;
  }
}

watch(
  () => route.query.version,
  (ver) => {
    if (ver && ver !== currentVersion.value && versionList.value.length) {
      selectVersion(String(ver), false);
    }
  }
);

onMounted(() => {
  loadVersionList();
});
</script>
