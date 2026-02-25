<template>
  <div class="audit-page">
    <!-- 非管理员提示 -->
    <div v-if="!isAdmin" class="no-perm">
      <el-empty description="仅管理员可访问数据集审核" />
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>

    <template v-else>
      <div class="page-header">
        <div>
          <h2>用户上传模板审核</h2>
          <div class="sub">审核用户上传的自定义数据集/指标，支持预览、通过与拒绝</div>
        </div>
        <div class="header-actions">
          <el-button :loading="loading" @click="fetchList" type="primary" plain round :icon="Refresh">
            刷新
          </el-button>
        </div>
      </div>

      <!-- 筛选栏 -->
      <el-card class="filter-card" shadow="never">
        <el-form :inline="true" :model="query" @submit.prevent>
          <el-form-item label="关键词">
            <el-input v-model="query.keyword" :prefix-icon="Search" placeholder="数据集名/上传人" clearable
              style="width: 240px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" placeholder="全部" clearable style="width: 150px">
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
          </el-form-item>
          <el-form-item label="上传时间">
            <el-date-picker v-model="query.range" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期"
              value-format="YYYY-MM-DD" style="width: 280px" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" round @click="onSearch">查询</el-button>
            <el-button :icon="CircleClose" round @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 表格 -->
      <el-card class="table-card" shadow="never">
        <div class="table-toolbar">
          <div>
            <el-button type="success" round :icon="CircleCheck" :disabled="!selection.length" @click="batchApprove">
              批量通过
            </el-button>
            <el-button type="danger" round :icon="CircleClose" :disabled="!selection.length" @click="batchReject">
              批量拒绝
            </el-button>
            <span class="sel-tip" v-if="selection.length">已选 {{ selection.length }} 项</span>
          </div>
          <div class="tip">共 {{ total }} 条</div>
        </div>

        <el-table :data="list" v-loading="loading" @selection-change="onSelectionChange" border style="width: 100%;"
          size="small" stripe  highlight-current-row class="beauty-table table-fill" >
          <el-table-column type="selection" width="48" />
          <el-table-column label="名称" >
            <template #default="{ row }">
              <div class="ds-name">
                <!-- <el-avatar :size="28" :src="row.cover" class="ds-cover ring">{{ row.name?.[0] }}</el-avatar> -->
                <div class="name-wrap">
                  <div class="name">{{ row.name }}</div>
                  <div class="desc ellipsis">{{ row.desc }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="上传人" prop="ownerName" width="120" />
          <el-table-column label="标签" min-width="160">
            <template #default="{ row }">
              <el-tag v-for="t in row.tags" :key="t" size="small" class="mr6">{{ t }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="上传时间" prop="createdAt" width="170" />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'pending'" type="warning">待审核</el-tag>
              <el-tag v-else-if="row.status === 'approved'" type="success">已通过</el-tag>
              <el-tag v-else type="danger">已拒绝</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="300">
            <template #default="{ row }">
              <!-- <el-button text type="primary" @click="openPreview(row)">详情</el-button> -->
              <!-- <el-divider direction="vertical" /> -->
              <el-button text type="primary" @click="openPreview(row)">预览</el-button>
              <el-divider direction="vertical" />
              <el-button text type="success" :disabled="row.status !== 'pending'" @click="approve(row)">通过</el-button>
              <el-divider direction="vertical" />
              <el-button text type="danger" :disabled="row.status !== 'pending'" @click="reject(row)">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager">
          <el-pagination background layout="prev, pager, next, jumper, total" :total="total" :page-size="pageSize"
            :current-page="page" @current-change="onPageChange" />
        </div>
      </el-card>

      <!-- 预览抽屉 -->
      <el-drawer v-model="previewVisible" :with-header="true" title="数据集预览" size="50%" class="beauty-drawer">
        <template #default>
          <div class="preview-head">
            <div class="ds-name">
              <el-avatar :size="32" :src="preview?.cover" class="ds-cover ring">{{ preview?.name?.[0] }}</el-avatar>
              <div class="name-wrap">
                <div class="name">{{ preview?.name }}</div>
                <div class="desc">{{ preview?.desc }}</div>
                <div class="meta">
                  <span>上传人：{{ preview?.ownerName }}</span>
                  <!-- <span>文件数：{{ preview?.files }}</span> -->
                  <span>种类：{{ preview?.category }}</span>
                  <!-- <span>大小：{{ preview?.sizeMB }} MB</span> -->
                </div>
              </div>
            </div>
          </div>
          <el-divider />
          <div class="sample-title">指标参数详情</div>
          <el-empty v-if="!preview?.metrics?.length" description="无指标数据" :image-size="80" />
          <div v-else class="metric-param-cards">
            <el-card v-for="m in preview.metrics" :key="m.key" class="m-param-card" shadow="never">
              <div class="m-card-head">
                <span class="m-name">{{ m.label }}</span>
                <el-tag v-if="preview.metricType === 'composite'" size="small" effect="plain" type="info">
                  权重 {{ m.weight }}
                </el-tag>
              </div>
              <!-- <div class="m-card-desc" v-if="m.desc">{{ m.desc }}</div> -->
              <div v-if="hasParams(m)" class="m-param-body">
                <div v-for="(val, k) in m.params" :key="k" class="m-param-row">
                  <span class="k">{{ metricParamSchemas[m.key]?.[k]?.label || k }}</span>
                  <span class="v">{{ formatParam(m.key, k, val) }}</span>
                </div>
              </div>
              <div v-else class="m-param-empty">无参数</div>
            </el-card>
          </div>
          <div class="sample-title">样例记录</div>
          <el-table :data="samples" v-loading="sampleLoading" border class="beauty-table">
            <el-table-column v-for="col in sampleColumns" :key="col" :prop="col" :label="col" />
          </el-table>
        </template>
      </el-drawer>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, CircleCheck, CircleClose, Search,
  HomeFilled, Opportunity, Histogram, Menu, ArrowDown, SwitchButton
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getMetricSets, approveItems, rejectItems } from '@/utils/localData'
import request from '@/utils/request'

const list = ref([])          // 审核混合列表
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const allRows = ref([])

const router = useRouter()
const userStore = useUserStore()
onMounted(() => userStore.hydrate())


// const isAdmin = computed(() => (userStore.role || 'guest') === 'admin')
const isAdmin=true
const goHome = () => router.push('/')

const metricParamSchemas = {
  exact_match: {
    ignoreCase: { label: '忽略大小写', type: 'boolean' },
    ignorePunctuation: { label: '忽略标点', type: 'boolean' }
  },
  bleu: {
    maxNgram: { label: '最大 n-gram', type: 'number' },
    smoothingMethod: { label: '平滑方法', type: 'select', options: { none: '无', add1: '加1平滑', exp: '指数平滑' } }
  },
  rouge: {
    variant: { label: 'ROUGE 变体', type: 'select', options: { rouge1: 'ROUGE-1', rouge2: 'ROUGE-2', rougeL: 'ROUGE-L' } },
    useF1: { label: '使用 F1 方式', type: 'boolean' }
  },
  f1: {
    averageType: { label: '平均方式', type: 'select', options: { micro: 'Micro', macro: 'Macro', weighted: 'Weighted' } }
  },
  pass_k: {
    k: { label: 'k 值', type: 'number' }
  },
  latency: {
    unit: { label: '时间单位', type: 'select', options: { s: '秒(s)', ms: '毫秒(ms)' } },
    p95: { label: '计算 P95', type: 'boolean' },
    threshold: { label: '警戒阈值', type: 'number' }
  },
  semantic_similarity: {
    method: { label: '相似度方法', type: 'select', options: { cosine: 'Cosine', dot: 'Dot' } },
    threshold: { label: '通过阈值', type: 'number' }
  },
  perplexity_fluency: {
    referenceModel: {
      label: '参考模型', type: 'select', options: {
        'gpt-3.5': 'GPT-3.5', 'llama2-13b': 'Llama2-13B', 'mistral-7b': 'Mistral-7B'
      }
    },
    normalize: { label: '归一化得分', type: 'boolean' }
  }
}
function formatParam(metricKey, paramKey, rawValue) {
  const schema = metricParamSchemas[metricKey]?.[paramKey]
  if (!schema) return rawValue === undefined ? '-' : String(rawValue)
  if (schema.type === 'boolean') return rawValue ? '是' : '否'
  if (schema.type === 'select') return schema.options?.[rawValue] || rawValue
  return rawValue
}
function hasParams(m) {
  return m?.params && Object.keys(m.params).length > 0
}

/* 查询与分页 */
const query = reactive({ keyword: '', status: '', range: null })
const onSearch = () => {
  page.value = 1
  unify()
}
const onReset = () => {
  query.keyword = ''
  query.status = ''
  query.range = null
  page.value = 1
  unify()
}
const onPageChange = (p) => {
  page.value = p
  unify()
}

/* 选择与批量操作 */
const selection = ref([])
const onSelectionChange = (rows) => (selection.value = rows)

const batchApprove = async () => {
  if (!selection.value.length) return
  await ElMessageBox.confirm(`确认通过选中的 ${selection.value.length} 项？`, '提示', { type: 'warning' })
  approveItems(selection.value.map(r => r.id))
  ElMessage.success('批量通过成功')
  selection.value = []
  fetchList()
}

const rejectVisible = ref(false)
const rejectReason = ref('')
const rejectTargetIds = ref([])

const batchReject = () => {
  if (!selection.value.length) return
  rejectTargetIds.value = selection.value.map(r => r.id)
  rejectReason.value = ''
  rejectVisible.value = true
}

/* 行操作 */
const approve = async (row) => {
  await ElMessageBox.confirm(`确认通过「${row.name}」吗？`, '提示', { type: 'warning' })
  const recombinationStandardId = row.id
  try {
    loading.value = true
    const res = await request({
      url: '/standard/approve',
      method: 'post',
      params: {
        recombinationStandardId,
        isValidated: 1,
        rejectReason: ''
      }
    })
    if (res.code!==200) {
      ElMessage.error('审批失败')
      return
    }
    ElMessage.success('已通过')
    fetchList()
  } catch (e) {
    ElMessage.error(e?.message || '审批失败')
  } finally {
    loading.value = false
  }
}

// const openReject = (row) => {
//   rejectTargetIds.value = [row.id]
//   rejectReason.value = ''
//   rejectVisible.value = true
// }

const reject = async (row) => {
  await ElMessageBox.confirm(`确认拒绝「${row.name}」吗？`, '提示', { type: 'warning' })
  const recombinationStandardId =  row.id
  try {
    loading.value = true
    const res = await request({
      url: '/standard/approve',
      method: 'post',
      params: {
        recombinationStandardId,
        isValidated: 0,
        rejectReason: ''
      }
    })
    if (res.code!==200) {
      ElMessage.error('审批失败')
      return
    }
    ElMessage.success('已拒绝')
    fetchList()
  } catch (e) {
    ElMessage.error(e?.message || '审批失败')
  } finally {
    loading.value = false
  }
}

/* 预览 */
const previewVisible = ref(false)
const preview = ref(null)
const samples = ref([])
const sampleColumns = ref([])
const sampleLoading = ref(false)

const mapMetrics = (singleStandards = []) => singleStandards.map(s => ({
  key: String(s.singleStandardId ?? s.singleStandardName ?? ''),
  label: s.singleStandardName || '',
  weight: typeof s.singleStandardScore === 'number' ? +(s.singleStandardScore).toFixed(2) : 0,
  params: Array.isArray(s.paramsList)
    ? s.paramsList.reduce((acc, p) => {
        acc[p.paramName] = p.paramValue
        return acc
      }, {})
    : {}
}))
const formatDate = (val) => (val ? new Date(val).toLocaleString() : '')
function unify() {
  const kw = query.keyword?.trim().toLowerCase()
  const status = query.status
  const [start, end] = query.range || []

  let merged = [...allRows.value]

  if (kw) {
    merged = merged.filter(r =>
      r.name.toLowerCase().includes(kw) ||
      (r.desc || '').toLowerCase().includes(kw) ||
      (r.ownerName || '').toLowerCase().includes(kw)
    )
  }
  if (status) merged = merged.filter(r => r.status === status)
  if (start && end) {
    const s = new Date(start).getTime()
    const e = new Date(end).getTime() + 86400000 - 1
    merged = merged.filter(r => {
      const t = new Date(r.createdAt).getTime()
      return !Number.isNaN(t) && t >= s && t <= e
    })
  }

  total.value = merged.length
  const offset = (page.value - 1) * pageSize.value
  list.value = merged.slice(offset, offset + pageSize.value)
}
const fetchList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/standard/listCombinationStandards',
      method: 'get'
    })
    console.log('获取的指标列表:', res)
    const ok = res?.code === 200
    const data = ok && Array.isArray(res?.data) ? res.data : []
    allRows.value = data.map(item => ({
      id: item.recombinationStandardId,
      name: item.recombinationStandardName || `评测标准-${item.recombinationStandardId}`,
      desc: item.description || '',
      ownerName: item.createUserName || '系统',
      category: '指标',
      tags: (item.singleStandards || []).map(s => s.singleStandardName).filter(Boolean),
      status: item.isValidated === 1 ? 'approved' : (item.isValidated === 0 ? 'rejected' : 'pending'),
      createdAt: formatDate(item.createTime),
      raw: item,
      metricType: 'composite',
      metrics: mapMetrics(item.singleStandards)
    }))
    page.value = 1
    unify()
  } catch (err) {
    ElMessage.error(err?.message || '获取指标列表失败')
    allRows.value = []
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}
const openPreview = async (row) => {
  preview.value = row
  previewVisible.value = true
  samples.value = []
  sampleColumns.value = []

  sampleColumns.value = ['singleStandard', 'weight']
  samples.value = (row.metrics || []).map(m => ({
    singleStandard: m.label,
    weight: m.weight
  }))
}
onMounted(fetchList)
</script>

<style scoped>
/* 页面占满视口，并用列式布局 */
.audit-page {
  /* max-width: 1900px; */
  margin: 0 auto;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
  min-height: 100vh;
  display: flex;
  /* min-width: 98vw; */
  flex-direction: column;
  padding: 0;
  /* 顶部导航自带内边距，主体区域单独留白 */

}

/* 顶部主导航（与 Home.vue 保持一致风格） */
.top_nav {
  color: #fff;
  height: 60px;
  background-color: rgb(65, 90, 220);
  display: flex;
  align-items: center;
  padding: 10px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo {
  height: 36px;
  width: auto;
  margin-right: 12px;
}

.main-nav {
  display: flex;
  height: 100%;
  margin-left: 10px;
}

.nav-item {
  display: flex;
  font-size: 16px;
  align-items: center;
  padding: 0 20px;
  height: 100%;
  cursor: pointer;
  position: relative;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
  transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0 4px;
  border-radius: 8px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.nav-item.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.user-area {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  color: #fff;
  cursor: pointer;
  user-select: none;
}

.user-trigger .avatar {
  background: #2d6cdf;
  font-weight: 700;
}

.user-trigger .username {
  margin: 0 6px 0 8px;
  font-weight: 600;
}

.user-trigger .caret {
  opacity: 0.9;
}

.user-brief {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 160px;
}

.user-brief .name {
  font-weight: 700;
}

.user-brief .role {
  font-size: 12px;
  color: #8a8f98;
}

/* 主体留白容器 */
.page-header,
.filter-card,
.table-card {
  margin-left: 16px;
  margin-right: 16px;
}

.page-header {
  margin-top: 14px;
}

/* 头部条 */
.page-header {
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 14px 16px;
  background: linear-gradient(180deg, #f7fbff, #ffffff);
  border: 1px solid #edf2f9;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(30, 60, 90, 0.04);
}

.page-header h2 {
  margin: 0 0 4px;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.page-header .sub {
  color: #6b7785;
  font-size: 13px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 筛选卡片 */
.filter-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #edf2f7;
  box-shadow: 0 4px 16px rgba(30, 60, 90, 0.06);
  margin-bottom: 12px;
}

:deep(.filter-card .el-card__body) {
  padding: 12px 16px;
}

/* 表格卡片填充剩余空间 */
.table-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #edf2f7;
  box-shadow: 0 4px 16px rgba(30, 60, 90, 0.06);
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 16px;
}

:deep(.table-card .el-card__body) {
  padding: 12px 12px 8px;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

/* 工具栏与分页 */
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex: 0 0 auto;
}

.pager {
  margin-top: 12px;
  text-align: right;
  flex: 0 0 auto;
}

.sel-tip {
  margin-left: 8px;
  background: #eaf2ff;
  color: #1e66f5;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.mr6 {
  margin-right: 6px;
}

/* 表格填满容器并在内部滚动 */
.table-fill {
  flex: 1 1 0;
  min-height: 0;
}

:deep(.beauty-table .el-table__header-wrapper th) {
  background: #f7f9fc;
  color: #3a4a5a;
  font-weight: 700;
}

:deep(.beauty-table .el-table__body tr:hover > td) {
  background: #f8fbff !important;
}


/* 数据集名称块 */
.ds-name {
  display: flex;
  gap: 10px;
  align-items: center;
}

.ds-cover {
  background: #eef3ff;
  color: #4e9cff;
  font-weight: 700;
}

.ds-cover.ring {
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px #cfe5ff;
  transition: box-shadow .2s ease;
}

.ds-name:hover .ds-cover.ring {
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px #9fd0ff;
}

.name-wrap .name {
  font-weight: 700;
}

.name-wrap .desc {
  color: #7a869a;
  font-size: 12px;
}

.ellipsis {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 抽屉 */
:deep(.beauty-drawer .el-drawer__header) {
  margin: 0;
  padding: 14px 16px;
  border-bottom: 1px solid #eef2f7;
  background: linear-gradient(180deg, #f9fbff, #ffffff);
}

:deep(.beauty-drawer .el-drawer__title) {
  font-weight: 800;
}

:deep(.beauty-drawer .el-drawer__body) {
  padding: 16px;
}

.preview-head .meta {
  margin-top: 6px;
  color: #7a869a;
  font-size: 12px;
  display: flex;
  gap: 12px;
}

.sample-title {
  font-weight: 800;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sample-title::before {
  content: "";
  width: 6px;
  height: 6px;
  background: #409eff;
  border-radius: 50%;
  box-shadow: 0 0 0 4px #e8f3ff;
}

/* 空态 */
.no-perm {
  padding: 80px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.metric-param-cards {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  margin-top: 4px;
}

.m-param-card {
  border: 1px solid #e6ebf2;
  border-radius: 10px;
  background: linear-gradient(180deg,#ffffff,#f8fbfd);
  padding: 10px 12px 12px;
  font-size: 12px;
}

.m-param-card:hover {
  box-shadow: 0 4px 16px rgba(40,60,100,.08);
}

.m-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.m-name {
  font-weight: 600;
  font-size: 13px;
  color: #2c3e50;
}

.m-card-desc {
  font-size: 12px;
  color: #647181;
  line-height: 1.4;
  margin-bottom: 6px;
  min-height: 28px;
}

.m-param-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 2px;
}

.m-param-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  background: #f2f6fa;
  padding: 4px 6px;
  border-radius: 4px;
  line-height: 1.3;
}

.m-param-row .k {
  color: #4a5b6b;
  font-weight: 500;
  flex: 0 0 auto;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-param-row .v {
  color: #1f2d3d;
  font-weight: 600;
  flex: 1;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-param-empty {
  font-style: italic;
  color: #8a97a6;
}

@media (max-width: 760px) {
  .metric-param-cards {
    grid-template-columns: 1fr;
  }
}
</style>