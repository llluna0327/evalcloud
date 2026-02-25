<template>
  <div class="team-resource-page" v-loading="pageLoading">
    <div class="header">
      <h2>项目模块状态面板</h2>

    </div>

    <el-card shadow="never" class="res-card">
      <template #header>
        <div class="res-hd">
          <span>自定义资源（指标 & 数据集）</span>
          <el-tag size="small" effect="plain" type="info">共 {{ unifiedList.length }} 条</el-tag>
        </div>
      </template>

      <!-- 骨架 -->
      <el-skeleton
        v-if="loading"
        :rows="6"
        animated
        style="--el-skeleton-color:#f3f5f8; --el-skeleton-to-color:#eceff3;">
      </el-skeleton>

      <el-table
        v-else
        :data="unifiedList"
        border
        stripe
        
        height="540px"
        :header-cell-style="headerStyle"
        :row-class-name="rowClass">
        <el-table-column prop="name" label="名称" min-width="220" show-overflow-tooltip />
        <el-table-column label="简介" min-width="320" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="desc-text">{{ row.desc || '（暂无简介）' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="typeLabel" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type==='metric' ? 'primary' : 'success'" effect="plain">
              {{ row.typeLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType(row.status)">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!loading && !unifiedList.length"
        description="暂无自定义指标或数据集"
        :image-size="90"
        style="margin:30px 0;" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDataSets } from '@/utils/localData'

/* 本地存储键（指标） */
const METRIC_KEY = 'metric_sets_v1'

const loading = ref(false)
const pageLoading = ref(false)
const metricsRaw = ref([])
const datasetsRaw = ref([])
const unifiedList = ref([])

/* 拉取数据（本地模拟） */
function fetchData() {
  loading.value = true
  setTimeout(() => {
    loadMetrics()
    loadDatasets()
    buildUnified()
    loading.value = false
    ElMessage.success('已刷新')
  }, 450)
}

function loadMetrics() {
  try {
    const raw = localStorage.getItem(METRIC_KEY)
    metricsRaw.value = raw ? JSON.parse(raw) : []
  } catch {
    metricsRaw.value = []
  }
}

function loadDatasets() {
  try {
    const list = getDataSets()
    datasetsRaw.value = Array.isArray(list) ? list : []
  } catch {
    datasetsRaw.value = []
  }
}

/* 组装统一展示结构 */
function buildUnified() {
  const metricPart = (metricsRaw.value || []).map(m => ({
    id: m.id,
    name: m.name,
    desc: m.desc,
    type: 'metric',
    typeLabel: '指标',
    status: m.status ,
    createdAt: m.createdAt || m.createTime || '-'
  }))
  const datasetPart = (datasetsRaw.value || []).map(d => ({
    id: d.id,
    name: d.name,
    desc: d.description,
    type: 'dataset',
    typeLabel: '数据集',
    status: d.status ,
    createdAt: d.createTime || d.createdAt || '-'
  }))

  const merged = [...metricPart, ...datasetPart]
  merged.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime()
    const tb = new Date(b.createdAt).getTime()
    if (isNaN(ta) && isNaN(tb)) return 0
    if (isNaN(ta)) return 1
    if (isNaN(tb)) return -1
    return tb - ta
  })
  unifiedList.value = merged
}

/* 状态映射 */
function statusLabel(s) {
  return s === 2
    ? '审核中'
    : s === 1
      ? '通过'
      : s === 0
        ? '退回'
        : (s )
}
function statusTagType(s) {
  return s === 2
    ? 'warning'
    : s === 1
      ? 'success'
      : s === 0
        ? 'danger'
        : 'info'
}

function formatTime(iso) {
  if (!iso || iso === '-') return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', { hour12: false })
}

/* 行样式（可用于扩展不同类型区分） */
function rowClass({ row }) {
  return row.type === 'metric' ? 'row-metric' : 'row-dataset'
}

function headerStyle() {
  return {
    background: '#f8f9fa',
    fontWeight: 600,
    color: '#2c3e50'
  }
}

onMounted(async () => {
  pageLoading.value = true
  // 模拟首屏加载延迟
  setTimeout(() => {
    fetchData()
    pageLoading.value = false
  }, 300)
})
</script>

<style scoped>
.team-resource-page {
  max-width: 1900px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
  min-height: 70vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 26px;
  padding: 0 4px;
}

.header h2 {
  font-size: 26px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  letter-spacing: 0.2px;
}

.res-card {
  border: 1px solid #e6ecf3;
  border-radius: 16px;
}

.res-hd {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 15px;
}

.desc-text {
  color: #637083;
  font-size: 13px;
}


:deep(.el-table) {
  --el-table-border-color: #eef1f4;
}

:deep(.el-table__body tr:hover > td) {
  background: #f5faff !important;
}
</style>