<template>
  <div class="ds-detail-page" v-loading="loading">
    <el-page-header @back="goBack" />
    <div v-if="meta" class="meta-card" style="margin-top: 10px;">
      <div class="title">
        <el-avatar :size="40" class="cover">{{ meta.name?.[0] }}</el-avatar>
        <div class="info">
          <h2>{{ meta.name }}</h2>
          <p class="desc">{{ meta.desc || '（无简介）' }}</p>
          <div class="tags">
            <el-tag v-for="t in meta.tags" :key="t" size="small">{{ t }}</el-tag>
          </div>
          <div class="more">
            <span>上传人：{{ meta.ownerName }}</span>
            <span>状态：<el-tag size="small" :type="statusTag(meta.status)">{{ statusText(meta.status) }}</el-tag></span>
            <span>上传时间：{{ meta.createdAt }}</span>
          </div>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-hd">
          <span>样本（共 {{ total }} 条）</span>
          <div class="actions">
            <el-button size="small" text @click="reload" :disabled="sampleLoading">刷新</el-button>
            <el-button
              v-if="!allLoaded"
              size="small"
              type="primary"
              plain
              :loading="loadingAll"
              @click="loadAll">
              {{ loadingAll ? '加载中...' : '加载全部' }}
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="samples"
        v-loading="sampleLoading || loadingAll"
        border
        size="small"
        height="560px">
        <el-table-column v-for="c in columns" :key="c" :prop="c" :label="c" />
      </el-table>
      <el-empty v-if="!sampleLoading && !loadingAll && !samples.length" description="暂无数据" />
    </el-card>
  </div>
</template>

<script setup>
// ...existing imports...
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const loading = ref(false)
const sampleLoading = ref(false)
const loadingAll = ref(false)

const meta = ref(null)
const columns = ref([])
const samples = ref([])

const total = ref(0)          // 全量条数
const allLoaded = ref(false)  // 是否已加载全部
const cacheCountText = ref('（当前缓存部分）')

const CACHE_KEY = 'DATASET_DETAIL_CACHE_' + id
const PARTIAL_FLAG_KEY = CACHE_KEY + '_partial'   // 标记缓存是否只是部分
const autoLoadAll = false // 如果希望进入即加载全部设为 true

const statusText = (s) => s === 'approved' ? '已通过' : s === 'rejected' ? '已拒绝' : '待审核'
const statusTag = (s) => s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning'

function saveCache(isPartial = false) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      meta: meta.value,
      columns: columns.value,
      samples: samples.value,
      total: total.value,
      cachedAt: Date.now(),
      allLoaded: !isPartial
    }))
    localStorage.setItem(PARTIAL_FLAG_KEY, isPartial ? '1' : '0')
  } catch {}
}

function loadFromCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return false
    const obj = JSON.parse(raw)
    meta.value = obj.meta
    columns.value = obj.columns || []
    samples.value = obj.samples || []
    total.value = obj.total || samples.value.length
    allLoaded.value = !!obj.allLoaded
    cacheCountText.value = allLoaded.value ? '' : '（当前缓存部分）'
    return true
  } catch { return false }
}

async function reload() {
  if (allLoaded.value) {
    // 已经全量，可按需再调后端刷新
    ElMessage.info('已是全量数据')
    return
  }
  // 重新拉取首批（如果你有分页接口可替换）
  await loadPartial()
}

async function loadPartial() {
  sampleLoading.value = true
  try {
    const res = await api_getDatasetSamples(id, 50) // 首批
    meta.value = res.meta
    columns.value = res.columns
    samples.value = res.samples
    total.value = res.total
    allLoaded.value = samples.value.length >= total.value
    cacheCountText.value = allLoaded.value ? '' : '（当前缓存部分）'
    saveCache(!allLoaded.value)
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    sampleLoading.value = false
  }
}

async function loadAll() {
  if (allLoaded.value) return
  loadingAll.value = true
  try {
    const res = await api_getDatasetSamples(id, -1) // -1 表示全部（模拟）
    columns.value = res.columns
    samples.value = res.samples
    total.value = res.total
    allLoaded.value = true
    cacheCountText.value = ''
    saveCache(false)
    ElMessage.success(`已加载全部 ${total.value} 条`)
  } catch {
    ElMessage.error('加载全部失败')
  } finally {
    loadingAll.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(async () => {
  const ok = loadFromCache()
  if (!ok) {
    await loadPartial()
  } else {
    if (!allLoaded.value) {
      // 缓存是部分，再次异步补全或根据 autoLoadAll 决定
      if (autoLoadAll) loadAll()
    }
  }
})

/* ============ 模拟：获取数据集样本接口（请替换为真实 API） ============ 
   limit > 0 取前 limit 条
   limit = -1 返回全量
*/
async function api_getDatasetSamples(datasetId, limit = 50) {
  await new Promise(r => setTimeout(r, 300))
  // 模拟生成 300 行
  const total = 300
  const columns = ['id', 'question', 'answer']
  const all = Array.from({ length: total }).map((_, i) => ({
    id: i + 1,
    question: `Q${i + 1}：示例问题内容`,
    answer: `A${i + 1}：示例答案内容`
  }))
  const samples = limit === -1 ? all : all.slice(0, limit)
  return {
    meta: {
      id: datasetId,
      name: '示例数据集',
      desc: '用于演示全量展示的数据集',
      tags: ['demo', 'nlp'],
      ownerName: 'user',
      status: 'pending',
      createdAt: '2025-01-01 10:00:00'
    },
    columns,
    samples,
    total
  }
}
</script>

<style scoped>
.ds-detail-page {
  padding: 16px 20px 40px;
}
.meta-card {
  padding: 14px 18px;
  border: 1px solid #e6ecf3;
  border-radius: 12px;
  background: linear-gradient(180deg,#ffffff,#f9fbff);
  margin-bottom: 18px;
}
.title {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.cover {
  background: #eef3ff;
  color: #2f6de0;
  font-weight: 700;
}
.info h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
}
.info .desc {
  margin: 0 0 6px;
  color: #6b7785;
  font-size: 13px;
  line-height: 1.5;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.more {
  display: flex;
  gap: 18px;
  font-size: 12px;
  color: #566273;
  flex-wrap: wrap;
}
.table-card {
  border: 1px solid #e6ecf3;
  border-radius: 12px;
}
.card-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  gap: 12px;
}
.card-hd .actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>