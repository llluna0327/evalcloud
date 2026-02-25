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
          <h2>用户上传数据集审核</h2>
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

        <el-table :data="list" v-loading="loading" @selection-change="onSelectionChange" border style="width: 100%"
          stripe size="small" highlight-current-row class="beauty-table table-fill" height="100%">
          <el-table-column type="selection" width="48" />
          <el-table-column label="名称">
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
          <!-- <el-table-column label="文件数" prop="files" width="90" /> -->
          <!-- <el-table-column label="种类" prop="category" width="100" /> -->
          <!-- <el-table-column label="大小(MB)" prop="sizeMB" width="110" /> -->
          <el-table-column label="标签">
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
          <el-table-column label="操作" fixed="right" width="320">
            <template #default="{ row }">
              <!-- <el-button text type="primary" @click="goDetail(row)">详情</el-button>
              <el-divider direction="vertical" /> -->
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
          <div class="sample-title">样例记录</div>
          <el-table :data="samples" v-loading="sampleLoading" border class="beauty-table">
            <el-table-column v-for="col in sampleColumns" :key="col" :prop="col" :label="col" />
          </el-table>
        </template>
      </el-drawer>

      <!-- 拒绝原因 -->
      <el-dialog v-model="rejectVisible" title="填写拒绝原因" width="520px">
        <el-input v-model="rejectReason" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" maxlength="200"
          show-word-limit placeholder="请输入原因（将告知上传者）" />
        <template #footer>
          <el-button @click="rejectVisible = false">取消</el-button>
          <el-button type="danger" :disabled="!rejectTargetIds.length" @click="confirmReject">确认拒绝</el-button>
        </template>
      </el-dialog>
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
import { getDataSets, approveItems, rejectItems } from '@/utils/localData'
import request from '@/utils/request'

const list = ref([])          // 审核混合列表
const allRows = ref([])          // 新增：原始数据

const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const DATASET_SAMPLE_LIMIT = 50
const DETAIL_CACHE_PREFIX = 'DATASET_DETAIL_CACHE_'  // 本地缓存前缀


const router = useRouter()
// onMounted(() => userStore.hydrate())

const formatDate = (val) => (val ? new Date(val).toLocaleString() : '')

const applyFilters = () => {
  const kw = query.keyword?.trim().toLowerCase()
  const status = query.status
  const [start, end] = query.range || []

  let rows = [...allRows.value]
  if (kw) {
    rows = rows.filter(r =>
      r.name.toLowerCase().includes(kw) ||
      r.desc.toLowerCase().includes(kw) ||
      r.ownerName.toLowerCase().includes(kw)
    )
  }
  if (status) rows = rows.filter(r => r.status === status)
  if (start && end) {
    const s = new Date(start).getTime()
    const e = new Date(end).getTime() + 86400000 - 1
    rows = rows.filter(r => {
      const t = new Date(r.createdAt).getTime()
      return !Number.isNaN(t) && t >= s && t <= e
    })
  }

  total.value = rows.length
  const offset = (page.value - 1) * pageSize.value
  list.value = rows.slice(offset, offset + pageSize.value)
}


// const isAdmin = computed(() => (userStore.role || 'guest') === 'admin')
const isAdmin = true
const goHome = () => router.push('/')

/* 查询与分页 */
const query = reactive({ keyword: '', status: '', range: null })

const fetchList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/file/dataSets/all',
      method: 'get'
    })
    const ok = res?.code === 200
    const data = ok && Array.isArray(res?.data) ? res.data : []
    allRows.value = data.map(item => ({
      id: item.evalDatasetId,
      name: item.datasetName || `数据集-${item.id ?? ''}`,
      desc: item.remark || '',
      ownerName: item.createUserName || `用户${item.createUserId ?? ''}`,
      tags: item.scenarioName ? [item.scenarioName] : [],
      status: item.isValidated === 1 ? 'approved' : (item.isValidated === 0 ? 'rejected' : 'pending'),
      createdAt: formatDate(item.createTime),
      raw: item,
      minioObjectPath: item.minioObjectPath
    }))
    page.value = 1
    applyFilters()
  } catch (err) {
    ElMessage.error(err?.message || '获取数据集失败')
    allRows.value = []
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const onSearch = () => { page.value = 1; applyFilters() }
const onReset = () => {
  query.keyword = ''
  query.status = ''
  query.range = null
  page.value = 1
  applyFilters()
}
const onPageChange = (p) => { page.value = p; applyFilters() }

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
  const evalDatasetId = row.id
  try {
    loading.value = true
    const res = await request({
      url: '/file/dataSets/approve',
      method: 'post',
      params: {
        evalDatasetId,
        isValidated: 1,
        rejectReason: ''
      }
    })
    if (res.code !== 200) {
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

const reject = async (row) => {
  await ElMessageBox.confirm(`确认通过「${row.name}」吗？`, '提示', { type: 'warning' })
  const evalDatasetId = row.id
  try {
    loading.value = true
    const res = await request({
      url: '/file/dataSets/approve',
      method: 'post',
      params: {
        evalDatasetId,
        isValidated: 0,
        rejectReason: ''
      }
    })
    if (res.code !== 200) {
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
const previewTitle = ref('预览')
const sampleColumns = ref([])
const sampleLoading = ref(false)

const openPreview = async (row) => {
  ElMessage.success('文件解析中...')
  const objectName = row.minioObjectPath || row.raw?.minioObjectPath
  if (!objectName) {
    ElMessage.error('未找到文件路径（minioObjectPath）')
    return
  }

  sampleLoading.value = true
  try {
    const res = await request({
      url: '/file/minio/download',
      method: 'get',
      params: { objectName },
      responseType: 'blob'
    })
    ElMessage.success('文件下载中...')
    const blob = res?.data instanceof Blob ? res.data : new Blob([res])
    const text = await blob.text()

    // 解析 CSV 作为抽屉预览
    const lines = text.trim().split(/\r?\n/)
    if (!lines.length) {
      ElMessage.info('文件为空')
      return
    }
    const headers = lines[0].split(',').map(h => h.trim())
    sampleColumns.value = headers
    samples.value = lines.slice(1).map(line => {
      const cols = line.split(',')
      return headers.reduce((acc, key, idx) => {
        acc[key] = cols[idx] ?? ''
        return acc
      }, {})
    }).slice(0, DATASET_SAMPLE_LIMIT)

    // previewVisible.value = true
    preview.value = row

    // 同时提供下载
    const filename = decodeURIComponent(objectName.split('/').pop() || `dataset-${row.id || ''}.csv`)
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error(e?.message || '预览/下载失败')
  } finally {
    sampleLoading.value = false
  }
}

/* 初次拉取 */
onMounted(fetchList)


const api_getDatasetSample = async (id, limit = 50) => {
  await new Promise(r => setTimeout(r, 180))

  // 生成120条GSM8K数据
  const generateGSM8KData = () => {
    const baseQuestions = [
      {
        question: "Natalie's sister had 8 pink balloons but Natalie popped 2 of them. How many pink balloons does Natalie's sister have now?",
        answer: "Natalie's sister had 8 pink balloons.\nNatalie popped 2 balloons.\n8 - 2 = 6\nNatalie's sister now has 6 pink balloons.",
        final_answer: "6"
      },
      {
        question: "Janet's ducks lay 16 eggs per day. She eats 3 for breakfast every morning and bakes muffins for her friends every day with 4. She sells the remainder at the farmers' market daily for $2 per dozen. How much in dollars does she make every day?",
        answer: "Janet's ducks lay 16 eggs per day.\nShe eats 3 for breakfast and uses 4 for muffins.\n3 + 4 = 7 eggs used daily.\n16 - 7 = 9 eggs remaining.\nShe sells them for $2 per dozen.\n9 eggs = 9/12 = 0.75 dozen.\n0.75 × $2 = $1.50",
        final_answer: "1.5"
      },
      // ... (保留之前的12个基础问题)
    ]

    // 生成更多变体问题
    const questionTemplates = [
      {
        template: "A bakery makes {0} cookies per batch. If they make {1} batches, how many cookies do they make in total?",
        solve: (a, b) => ({ answer: `Cookies per batch: ${a}\nNumber of batches: ${b}\nTotal cookies: ${a} × ${b} = ${a * b}`, final_answer: String(a * b) })
      },
      {
        template: "Sarah has {0} stickers. She gives {1} stickers to each of her {2} friends. How many stickers does she have left?",
        solve: (a, b, c) => ({ answer: `Sarah starts with ${a} stickers.\nShe gives ${b} stickers to each of ${c} friends.\nStickers given away: ${b} × ${c} = ${b * c}\nStickers left: ${a} - ${b * c} = ${a - b * c}`, final_answer: String(a - b * c) })
      },
      {
        template: "A movie theater has {0} rows with {1} seats in each row. If {2} seats are broken, how many working seats are there?",
        solve: (a, b, c) => ({ answer: `Total seats: ${a} rows × ${b} seats = ${a * b}\nBroken seats: ${c}\nWorking seats: ${a * b} - ${c} = ${a * b - c}`, final_answer: String(a * b - c) })
      }
    ]

    const allSamples = [...baseQuestions] // 从基础问题开始

    // 生成额外的问题以达到120条
    while (allSamples.length < 120) {
      const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)]
      const nums = template.template.match(/\{(\d+)\}/g).map(() => Math.floor(Math.random() * 20) + 1)

      const question = template.template.replace(/\{(\d+)\}/g, (match, index) => nums[parseInt(index)])
      const solution = template.solve(...nums)

      allSamples.push({
        id: allSamples.length + 1,
        question,
        answer: solution.answer,
        final_answer: solution.final_answer
      })
    }

    return allSamples
  }

  const gsm8kSamples = generateGSM8KData()

  // 限制返回数量
  const realLimit = Math.min(limit, gsm8kSamples.length)
  const columns = ['id', 'question', 'answer', 'final_answer']

  // 随机排序并取前 realLimit 条
  const shuffled = [...gsm8kSamples].sort(() => 0.5 - Math.random())
  const samples = shuffled.slice(0, realLimit)

  return { columns, samples }
}
function sleep(ms) { return new Promise(res => setTimeout(res, ms)) }
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

:deep(.beauty-table .cell) {
  line-height: 20px;
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
</style>