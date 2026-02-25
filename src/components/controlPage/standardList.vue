<template>
  <div class="page-container">
    <div class="table-container">
      <div class="header-left">
        <h2>我的指标</h2>
      </div>
      <div class="table-header">
        <div class="table-actions">
          <el-input v-model="search" placeholder="搜索名称或简介" style="width:200px;margin-right:30px;margin-left:-20px;"
            clearable>
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
          <div class="btn-group">
            <el-button type="primary" size="large" class="btn-primary" @click="goCreate">
              新建指标
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格视图已弃用，改为卡片视图展示指标集 -->
    <!-- <el-table :data="pagedList" class="custom-table" stripe border header-row-class-name="table-header-row"
      row-class-name="table-row" v-loading="loading" style="margin-top: 20px;">
      <el-table-column prop="name" label="指标名称" min-width="220" show-overflow-tooltip />
      <el-table-column label="简介" min-width="220" show-overflow-tooltip>
        <template #default="scope">
          <span class="desc-text">{{ scope.row.desc || '（暂无简介）' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="metricType" label="类型" width="150">
        <template #default="scope">
          <el-tag type="info" size="small">
            {{ scope.row.metricType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="aggregation" label="聚合方式" width="150">
        <template #default="scope">
          <span>{{ aggregationLabel(scope.row.aggregation) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="scope">
          <el-tag :type="statusType(scope.row.status)" size="small">
            {{ statusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="170">
        <template #default="scope">
          {{ formatTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="160">
        <template #default="scope">
          <el-button type="primary" link @click="openEdit(scope.row)">编辑</el-button>
          <el-button type="danger" link @click="remove(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table> -->

    <div class="metrics-grid" v-loading="loading" style="margin-top: 20px;">
      <div v-for="item in pagedList" :key="item.id" class="metric-card" @click="openEdit(item)">
        <div class="card-header">
          <div class="metric-info">
            <h3 class="metric-name">{{ item.name }}</h3>
            <div class="metric-meta">
              <el-tag :type="statusType(item.status)" size="small" effect="plain">
                {{ statusLabel(item.status) }}
              </el-tag>
              <el-tag v-if="item.metricType" type="info" size="small" effect="plain">
                {{ item.metricType }}
              </el-tag>
            </div>
          </div>
          <div class="card-actions">
            <el-dropdown @command="handleAction" trigger="click">
              <el-button link size="small" @click.stop>
                <el-icon>
                  <MoreFilled />
                </el-icon> 
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="`edit-${item.id}`">
                    <el-icon>
                      <Edit />
                    </el-icon> 编辑
                  </el-dropdown-item>
                  <el-dropdown-item :command="`delete-${item.id}`" divided>
                    <el-icon>
                      <Delete />
                    </el-icon> 删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="card-content">
          <p class="metric-desc">{{ item.desc || '（暂无简介）' }}</p>
          <div class="metric-tags">
            <el-tag v-for="m in (item.metrics || []).slice(0, 3)" :key="m.key" size="small" type="primary"
              effect="plain">
              {{ m.label }}
            </el-tag>
            <el-tag v-if="(item.metrics || []).length > 3" size="small" type="info" effect="plain">
              +{{ (item.metrics || []).length - 3 }}
            </el-tag>
          </div>
        </div>

        <div class="card-footer">
          <div class="time-info">
            <div class="create-time">
              <el-icon>
                <Calendar />
              </el-icon>
              <span>创建于 {{ formatTime(item.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="pager" v-if="total > pageSize" style=" margin-top: 20px;">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" background
        layout="total, sizes, prev, pager, next" :page-sizes="[10, 20, 30, 50]" :total="total" />
    </div>
    <el-empty v-if="!loading && !metricSets.length" description="暂无指标集" />


    <!-- 编辑弹窗 -->
    <el-dialog v-model="editVisible" title="编辑指标集" width="560px" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="100px" ref="editFormRef">
        <el-form-item label="名称" prop="name" :rules="[{ required: true, message: '请输入名称', trigger: 'blur' }]">
          <el-input v-model="editForm.name" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="editForm.desc" type="textarea" :rows="3" maxlength="200" show-word-limit
            placeholder="请输入简介" />
        </el-form-item>
        <!-- 新增：指标与权重查看区域 -->

        <el-form-item v-if="editForm.metrics && editForm.metrics.length" label="参数配置">
          <div class="param-cards-wrap">
            <el-empty v-if="!editForm.metrics.some(m => m.params && Object.keys(m.params || {}).length)"
              description="该指标集未保存任何参数信息" :image-size="80" />
            <template v-else>
              <div v-for="m in editForm.metrics" :key="m.key" class="metric-param-card">
                <div class="mp-header">
                  <span class="mp-name">{{ m.label }}</span>
                  <el-tag v-if="editForm.metricType !== 'single'" size="small" effect="plain">
                    权重 {{ Number(m.weight || 0) }}
                  </el-tag>
                </div>
                <div class="mp-body" v-if="m.params && Object.keys(m.params).length">
                  <div v-for="(val, k) in m.params" :key="k" class="mp-row">
                    <span class="mp-key">
                      {{ metricParamSchemas[m.key]?.[k]?.label || k }}
                    </span>
                    <span class="mp-val">
                      {{ formatParam(m.key, k, val) }}
                    </span>
                  </div>
                </div>
                <div class="mp-empty" v-else>（无参数）</div>
              </div>
            </template>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import router from '@/router'
import request from '@/utils/request'

const STORAGE_KEY = 'metric_sets_v1'

const loading = ref(false)
const metricSets = ref([])
const search = ref('')
const page = ref(1)
const pageSize = ref(10)

const editVisible = ref(false)
const editFormRef = ref()
const editForm = ref({
  id: null,
  name: '',
  desc: '',
  status: 0,
  metrics: []
})

const handleAction = (command) => {
  const [action, idStr] = String(command).split('-')
  const id = Number(idStr)
  const row = metricSets.value.find(i => i.id === id)
  if (!row) return
  if (action === 'edit') {
    openEdit(row)
  } else if (action === 'delete') {
    remove(row)
  }
}
function loadSets() {
  loading.value = true
  request({
    url: '/standard/listCombinationStandards',
    method: 'get'
  })
    .then(res => {
      console.log('Fetched metric sets:', res)
      const ok = res?.code === 200
      const list = ok && Array.isArray(res?.data) ? res.data : []
      metricSets.value = list.map(it => {
        const metrics = Array.isArray(it.singleStandards)
          ? it.singleStandards.map(s => ({
            key: String(s.singleStandardId ?? s.singleStandardName ?? ''),
            label: s.singleStandardName || '',
            desc: '',
            // 后端单项分值通常为百分比，转为 0~1
            weight: Number(s.singleStandardScore ?? 0) / 100,
            params: (Array.isArray(s.paramsList) ? s.paramsList : []).reduce((acc, p) => {
              acc[p.paramName] = p.paramValue
              return acc
            }, {})
          }))
          : []
        return {
          id: it.recombinationStandardId,
          name: it.recombinationStandardName,
          desc: it.description,
          scenario: it.scenarioName,
          metricType: it.isSingle,
          aggregation: it.convergenceMode, // 后端无该字段，留空
          // aggregation: it.convergenceMode, // 后端无该字段，留空
          status: it.isValidated, // 无状态字段时给默认值
          // createdAt: it.createdAt ,
          createdAt: it.createTime,
          metrics
        }
      })
    })
    .catch(err => {
      ElMessage.error(err?.message || '获取指标列表失败')
      metricSets.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(metricSets.value))
}

function formatTime(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('zh-CN', { hour12: false })
}

function statusLabel(s) {
  return s === 0
    ? '退回'
    : s === 1
      ? '已通过'
      : s === 2
        ? '审核中'
        : s
}

function statusType(s) {
  return s === 0
    ? 'danger'
    : s === 1
      ? 'success'
      : s === 2
        ? 'warning'
        : ''
}

function aggregationLabel(v) {
  const map = {
    weighted_mean: '加权平均',
    arithmetic_mean: '算术平均',
    median: '中位数',
    max: '最大值',
    min: '最小值'
  }
  return map[v] || v
}

const filtered = computed(() => {
  const kw = search.value.trim().toLowerCase()
  let list = metricSets.value.slice()
  if (kw) {
    list = list.filter(i =>
      (i.name || '').toLowerCase().includes(kw) ||
      (i.desc || '').toLowerCase().includes(kw)
    )
  }
  return list
})

const total = computed(() => filtered.value.length)
const pagedList = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch([search, pageSize], () => { page.value = 1 })
watch(metricSets, persist, { deep: true })

function goCreate() {
  router.push({ path: '/main/standard-create' })
}

function openEdit(row) {
  editForm.value = {
    id: row.id,
    name: row.name,
    desc: row.desc,
    status: row.status,
    metrics: row.metrics || []
  }
  editVisible.value = true
}


//接口还没写
function remove(row) {
  ElMessageBox.confirm(`确认删除指标「${row.name}」？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  }).then(async () => {
    metricSets.value = metricSets.value.filter(s => s.id !== row.id)
    ElMessage.success('已删除')
  }).catch(() => { })
}

onMounted(() => {
  loadSets()
})

const metricParamSchemas = {
  exact_match: {
    ignoreCase: { label: '忽略大小写', type: 'boolean' },
    ignorePunctuation: { label: '忽略标点', type: 'boolean' }
  },
  bleu: {
    maxNgram: { label: '最大 n-gram', type: 'number' },
    smoothingMethod: {
      label: '平滑方法', type: 'select', options: {
        none: '无', add1: '加1平滑', exp: '指数平滑'
      }
    }
  },
  rouge: {
    variant: {
      label: 'ROUGE 变体', type: 'select', options: {
        rouge1: 'ROUGE-1', rouge2: 'ROUGE-2', rougeL: 'ROUGE-L'
      }
    },
    useF1: { label: '使用 F1 方式', type: 'boolean' }
  },
  f1: {
    averageType: {
      label: '平均方式', type: 'select', options: {
        micro: 'Micro', macro: 'Macro', weighted: 'Weighted'
      }
    }
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
        'gpt-3.5': 'GPT-3.5',
        'llama2-13b': 'Llama2-13B',
        'mistral-7b': 'Mistral-7B'
      }
    },
    normalize: { label: '归一化得分', type: 'boolean' }
  }
}

// 新增：权重合计（编辑弹窗使用）
const weightSum = computed(() =>
  (editForm.value.metrics || []).reduce((s, m) => s + (Number(m.weight) || 0), 0)
)

// 格式化参数值
function formatParam(metricKey, paramKey, rawValue) {
  const schema = metricParamSchemas[metricKey]?.[paramKey]
  if (!schema) return rawValue === undefined ? '-' : String(rawValue)
  if (schema.type === 'boolean') return rawValue ? '是' : '否'
  if (schema.type === 'select') {
    return schema.options?.[rawValue] || rawValue
  }
  return rawValue
}
</script>

<style scoped>
.page-container {
  max-width: 1900px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
  border-radius: 16px;

}

.header-left {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 0 10px;
}

.header-left h2 {
  font-size: 26px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 6px;
  letter-spacing: 0.2px;
}

.header-left p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
}

.btn-group {
  margin-left: 1200px;
  display: flex;
  gap: 12px;
}

.btn-primary {
  padding: 12px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4361ee, #4895ef);
  border: none;
  box-shadow: 0 8px 20px rgba(67, 97, 238, .15);
  transition: all .3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(67, 97, 238, .25);
}

.table-container {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}

.table-header {
  margin-top: -10px;
  padding: 0 24px 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

:deep(.table-header-row) {
  background-color: #f8f9fa !important;
}

:deep(.table-header-row th) {
  background-color: #f8f9fa !important;
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  padding: 16px 12px;
}

:deep(.table-row) {
  transition: all .2s ease;
}

:deep(.table-row:hover) {
  background-color: #f8f9fa !important;
}

:deep(.el-table td) {
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.desc-text {
  color: #637083;
}

.table-pagination {
  padding: 20px 24px;
  display: flex;
  justify-content: center;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.param-cards-wrap {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  width: 100%;
  /* max-width: 430px; */
}

.metric-param-card {
  width: 100%;
  border: 1px solid #e6ebf1;
  border-radius: 8px;
  padding: 8px 10px 10px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  font-size: 12px;
  /* position: relative; */
}

.metric-param-card:hover {
  box-shadow: 0 4px 14px rgba(30, 50, 80, .08);
}

.mp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.mp-name {
  font-weight: 600;
  font-size: 13px;
  color: #2c3e50;
}

.mp-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 2px;
}

.mp-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  line-height: 1.3;
  background: #f2f6fa;
  padding: 4px 6px;
  border-radius: 4px;
}

.mp-key {
  color: #4a5b6b;
  font-weight: 500;
  flex: 0 0 auto;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mp-val {
  color: #1f2d3d;
  font-weight: 600;
  text-align: right;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mp-empty {
  color: #8a97a6;
  font-style: italic;
  font-size: 12px;
}

.weight-warn {
  margin-top: 6px;
  font-size: 11px;
  color: #d48806;
}
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.metric-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(233, 236, 239, 0.6);
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.metric-name {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.metric-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-content {
  margin-bottom: 20px;
}

.metric-desc {
  color: #6c757d;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.metric-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 16px;
  border-top: 1px solid rgba(233, 236, 239, 0.6);
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.create-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6c757d;
  font-size: 12px;
} 
</style>