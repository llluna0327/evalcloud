<template>
  <div class="metric-create-page">
    <div class="header-bar">
      <h2>创建评测指标</h2>
    </div>

    <div class="grid">
      <el-card class="setname-card" shadow="never">
        <el-form :model="form" label-width="110px" label-position="left" size="default" class="setname-form">
          <el-form-item label="指标名称">
            <el-input v-model="form.setName" placeholder="请输入指标名称（必填）" maxlength="40" show-word-limit clearable
              class="set-name" />
          </el-form-item>
          <el-form-item label="指标简介">
            <el-input v-model="form.setDesc" placeholder="请输入简介" maxlength="200" show-word-limit clearable
              class="set-name" />
          </el-form-item>

          <el-form-item label="场景">
            <el-select v-model="form.scenario" placeholder="请选择场景" style="width:240px" clearable>
              <el-option v-for="s in scenarioOptions" :key="s" :label="s" :value="s" />
            </el-select>
          </el-form-item>

          <el-form-item label="指标类型">
            <el-radio-group v-model="form.metricType">
              <el-radio label="single">单一指标</el-radio>
              <el-radio label="composite">复合指标</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="选择模板">
            <el-select v-model="templateModel" :multiple="form.metricType === 'composite'"
              :collapse-tags="form.metricType === 'composite'" :collapse-tags-tooltip="form.metricType === 'composite'"
              :max-collapse-tags="3" placeholder="请选择模板" style="width:480px" filterable clearable
              @change="onTemplateChange">
              <el-option v-for="tpl in templateOptions" :key="tpl.key" :label="tpl.label" :value="tpl.key" />
            </el-select>
          </el-form-item>

          <el-form-item label="聚合方式">
            <el-select v-model="form.aggregation" placeholder="请选择聚合方式" style="width:240px" clearable
              @change="onAggregationChange">
              <el-option v-for="a in aggregationOptions" :key="a.value" :label="a.label" :value="a.value" />
            </el-select>
          </el-form-item>


          <div class="metric-tools">
            <div class="left">
              <el-tag type="info" v-if="!form.metrics.length">未选择任何模板</el-tag>
              <el-tag v-else type="success">已选 {{ form.metrics.length }} 个指标</el-tag>
              <el-tag v-if="form.metricType === 'composite' && form.metrics.length"
                :type="Math.abs(totalWeight - 1) < 0.01 ? 'success' : 'warning'" effect="plain">
                权重合计：{{ totalWeight.toFixed(2) }}
              </el-tag>
            </div>
            <div class="right" v-if="form.metrics.length">
              <!-- <el-button size="small" @click="evenDistribute">均分权重</el-button>
              <el-button size="small" @click="normalizeWeights">归一化</el-button> -->
              <el-button size="small" type="danger" plain @click="clearTemplates">清空</el-button>
            </div>
          </div>
          <div v-if="form.metrics.length" class="metric-configs">
            <el-card v-for="m in form.metrics" :key="m.key" class="metric-config-card" shadow="never">
              <div class="cfg-header">
                <div class="title">
                  <span class="name">{{ m.label }}</span>
                  <el-tag v-if="form.metricType === 'composite'" size="small" type="info">权重 {{ m.weight }}</el-tag>
                </div>
                <div class="desc">{{ m.desc }}</div>
              </div>
              <div class="cfg-body">
                <el-form label-width="120px" class="cfg-inner-form">
                  <template v-for="(schema, paramKey) in metricParamSchemas[m.key]" :key="paramKey">
                    <!-- 布尔类型：用单独复选框，更直观 -->
                    <el-form-item v-if="schema.type === 'boolean'" label="">
                      <el-checkbox v-model="m.params[paramKey]">{{ schema.label }}</el-checkbox>
                    </el-form-item>

                    <el-form-item v-else :label="schema.label">
                      <el-input-number v-if="schema.type === 'number'" v-model="m.params[paramKey]" :min="schema.min"
                        :max="schema.max" :step="schema.step || 1" :precision="schema.step && schema.step < 1 ? 2 : 0"
                        controls-position="right" size="small" style="width:160px" />

                      <el-select v-else-if="schema.type === 'select'" v-model="m.params[paramKey]" style="width:200px"
                        size="small">
                        <el-option v-for="opt in schema.options" :key="opt.value" :label="opt.label"
                          :value="opt.value" />
                      </el-select>

                      <el-input v-else-if="schema.type === 'text'" v-model="m.params[paramKey]" size="small"
                        placeholder="请输入" style="width:240px" />
                    </el-form-item>
                  </template>
                </el-form>
              </div>
            </el-card>
          </div>
          <el-table v-if="form.metrics.length" :data="form.metrics" border stripe class="metric-table" size="small"
            style="margin-top: 10px;">
            <el-table-column prop="label" label="指标" min-width="160" />
            <el-table-column label="说明" min-width="300">
              <template #default="{ row }">
                <span class="metric-desc">{{ row.desc }}</span>
              </template>
            </el-table-column>
            <el-table-column label="权重" width="160">
              <template #default="{ row }">
                <el-input-number v-model="row.weight" :min="0" :max="1" :step="0.05" :precision="2"
                  :disabled="form.metricType === 'single'" size="small" />
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else description="请选择模板以生成指标行" :image-size="90" style="margin-top:10px;" />

          <el-divider />
          <div class="summary">
            <div class="row">
              <span>类型：</span><b>{{ form.metricType === 'single' ? '单一指标' : '复合指标' }}</b>
            </div>
            <div class="row" v-if="form.metricType === 'composite' && form.metrics.length">
              <span>权重合计：</span>
              <b :class="{ warn: Math.abs(totalWeight - 1) >= 0.01 }">{{ totalWeight.toFixed(2) }}</b>
            </div>
          </div>

          <div class="btn-row">
            <div></div>
            <div class="btns">
              <el-button type="primary" @click="submit">保存</el-button>
            </div>
          </div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getMetricSets, saveMetricSets } from '@/utils/localData'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'

const userStore = useUserStore()
import router from '@/router'

const STORAGE_KEY = 'metric_sets_v1'

/* 模板指标定义 */
const metricTemplates = [
  { key: 'exact_match', label: '精确匹配', desc: '预测与参考答案完全一致的比例（Exact Match）' },
  { key: 'bleu', label: 'BLEU', desc: '基于 n-gram 的机器翻译常用匹配度指标' },
  { key: 'rouge', label: 'ROUGE', desc: '面向摘要/生成文本的召回导向匹配指标' },
  { key: 'f1', label: 'F1', desc: 'Precision 与 Recall 的调和平均' },
  { key: 'pass_k', label: 'Pass@k', desc: '代码/生成任务在 k 次尝试中至少一次成功的概率' },
  { key: 'latency', label: 'Latency', desc: '模型响应耗时（秒），越低越好' },
  { key: 'semantic_similarity', label: 'Semantic Similarity', desc: '基于向量相似度的语义接近度评分' },
  { key: 'perplexity_fluency', label: 'Perplexity-based Fluency', desc: '根据困惑度估计输出流畅度/自然度' }
]

const metricParamSchemas = {
  exact_match: {
    ignoreCase: { type: 'boolean', label: '忽略大小写', default: true },
    ignorePunctuation: { type: 'boolean', label: '忽略标点', default: true }
  },
  bleu: {
    maxNgram: { type: 'number', label: '最大 n-gram', default: 4, min: 1, max: 8, step: 1 },
    smoothingMethod: {
      type: 'select', label: '平滑方法', default: 'none',
      options: [
        { label: '无', value: 'none' },
        { label: '加1平滑', value: 'add1' },
        { label: '指数平滑', value: 'exp' }
      ]
    }
  },
  rouge: {
    variant: {
      type: 'select', label: 'ROUGE 变体', default: 'rougeL',
      options: [
        { label: 'ROUGE-1', value: 'rouge1' },
        { label: 'ROUGE-2', value: 'rouge2' },
        { label: 'ROUGE-L', value: 'rougeL' }
      ]
    },
    useF1: { type: 'boolean', label: '使用 F1 方式', default: true }
  },
  f1: {
    averageType: {
      type: 'select', label: '平均方式', default: 'micro',
      options: [
        { label: 'Micro', value: 'micro' },
        { label: 'Macro', value: 'macro' },
        { label: 'Weighted', value: 'weighted' }
      ]
    }
  },
  pass_k: {
    k: { type: 'number', label: 'k 值', default: 5, min: 1, max: 20, step: 1 }
  },
  latency: {
    unit: {
      type: 'select', label: '时间单位', default: 's',
      options: [
        { label: '秒 (s)', value: 's' },
        { label: '毫秒 (ms)', value: 'ms' }
      ]
    },
    p95: { type: 'boolean', label: '计算 P95', default: true },
    threshold: { type: 'number', label: '警戒阈值', default: 2, min: 0, max: 999, step: 0.1 }
  },
  semantic_similarity: {
    method: {
      type: 'select', label: '相似度方法', default: 'cosine',
      options: [
        { label: 'Cosine', value: 'cosine' },
        { label: 'Dot', value: 'dot' }
      ]
    },
    threshold: { type: 'number', label: '通过阈值', default: 0.8, min: 0, max: 1, step: 0.01 }
  },
  perplexity_fluency: {
    referenceModel: {
      type: 'select', label: '参考模型', default: 'gpt-3.5',
      options: [
        { label: 'GPT-3.5', value: 'gpt-3.5' },
        { label: 'Llama2-13B', value: 'llama2-13b' },
        { label: 'Mistral-7B', value: 'mistral-7b' }
      ]
    },
    normalize: { type: 'boolean', label: '归一化得分', default: true }
  }
}

const templateModel = computed({
  get() {
    return form.value.metricType === 'composite'
      ? form.value.selectedTemplates
      : (form.value.selectedTemplates[0] ?? null)
  },
  set(val) {
    if (form.value.metricType === 'composite') {
      form.value.selectedTemplates = Array.isArray(val) ? val : (val != null ? [val] : [])
    } else {
      form.value.selectedTemplates = val != null ? [val] : []
    }
  }
})



function buildParams(key) {
  const schema = metricParamSchemas[key]
  if (!schema) return {}
  const obj = {}
  Object.entries(schema).forEach(([p, sc]) => {
    obj[p] = sc.default
  })
  return obj
}

const templateOptions = metricTemplates

const aggregationOptions = [
  { value: 'weighted_mean', label: '加权平均' },
  { value: 'arithmetic_mean', label: '算术平均' },
  { value: 'median', label: '中位数' },
  { value: 'max', label: '最大值' },
  { value: 'min', label: '最小值' }
]

const scenarioOptions = ['问答', '摘要', '翻译', '代码生成', '对话', '教育内容', '其他']



const form = ref({
  setName: '',
  setDesc: '',
  scenario: '',
  metricType: 'single',          // single | composite
  selectedTemplates: [],
  aggregation: 'weighted_mean',
  metrics: []                    // { key,label,desc,weight }
})

/* 生成表格指标数据 */
function rebuildMetrics() {
  const sel = form.value.selectedTemplates
  const oldMap = {}
  form.value.metrics.forEach(m => (oldMap[m.key] = m))

  const rows = sel
    .map(k => metricTemplates.find(t => t.key === k))
    .filter(Boolean)
    .map(t => ({
      key: t.key,
      label: t.label,
      desc: t.desc,
      weight: oldMap[t.key]?.weight ?? 1,
      params: oldMap[t.key]?.params ? { ...oldMap[t.key].params } : buildParams(t.key)
    }))

  if (form.value.metricType === 'single') {
    rows.forEach(r => (r.weight = 1))
  } else {
    if (rows.length) {
      // 若是新增或数量变化，对没有旧记录的均分
      const needRebalance = rows.some(r => !oldMap[r.key])
      if (needRebalance) {
        const w = +(1 / rows.length).toFixed(2)
        rows.forEach(r => (r.weight = w))
        normalizeWeights(rows)
      } else {
        normalizeWeights(rows)
      }
    }
  }
  form.value.metrics = rows
}

function onTemplateChange() {
  rebuildMetrics()
}

watch(() => form.value.metricType, (val, oldVal) => {
  if (val === 'single') {
    // 只保留第一个
    if (form.value.selectedTemplates.length > 1) {
      form.value.selectedTemplates = [form.value.selectedTemplates[0]]
    }
  }
  rebuildMetrics()
})

/* 计算总权重 */
const totalWeight = computed(() =>
  form.value.metrics.reduce((s, m) => s + (Number(m.weight) || 0), 0)
)

function onAggregationChange() {
  if (form.value.metricType !== 'composite') return
  const n = form.value.metrics.length
  if (!n) return
  const agg = form.value.aggregation

  if (agg === 'weighted_mean') {
    // 恢复并规范权重
    normalizeWeights()
  } else if (agg === 'arithmetic_mean') {
    // 等权平均：均分并禁用编辑
    const v = +(1 / n).toFixed(2)
    form.value.metrics.forEach(m => (m.weight = v))
    normalizeWeights()
  } else {
    // median/max/min：不使用权重，但为保持结构可提交，仍均分占位
    const v = +(1 / n).toFixed(2)
    form.value.metrics.forEach(m => (m.weight = v))
    // 不调用 normalize 也可以；调用以确保精度对齐
    normalizeWeights()
  }
}

watch(() => form.value.metricType, (val) => {
  if (val === 'single') {
    form.value.metrics.forEach(m => (m.weight = 1))
  } else {
    onAggregationChange()
  }
})


function normalizeWeights(arr = form.value.metrics) {
  if (form.value.metricType === 'single') {
    arr.forEach(m => (m.weight = 1))
    return
  }
  const sum = arr.reduce((s, m) => s + (Number(m.weight) || 0), 0)
  if (sum === 0) {
    const n = arr.length
    if (!n) return
    const v = +(1 / n).toFixed(2)
    arr.forEach(m => (m.weight = v))
  } else {
    arr.forEach(m => (m.weight = +(m.weight / sum).toFixed(2)))
  }
  let diff = 1 - arr.reduce((s, m) => s + (Number(m.weight) || 0), 0)
  if (Math.abs(diff) >= 0.01 && arr[0]) {
    arr[0].weight = +(arr[0].weight + diff).toFixed(2)
  }
}

function clearTemplates() {
  form.value.selectedTemplates = []
  form.value.metrics = []
}

function validateBeforeSubmit() {
  if (!form.value.setName.trim()) {
    ElMessage.warning('请填写指标集名称')
    return false
  }
  if (!form.value.selectedTemplates.length) {
    ElMessage.warning('请选择至少一个模板指标')
    return false
  }
  if (!form.value.aggregation) {
    ElMessage.warning('请选择聚合方式')
    return false
  }
  if (form.value.metricType === 'composite') {
    const tw = totalWeight.value
    if (Math.abs(tw - 1) > 0.01) {
      ElMessage.error('复合指标的权重之和需约等于 1（允许 ±0.01）')
      return false
    }
  }
  return true
}

// function submit() {
//   if (!validateBeforeSubmit()) return

//   if (form.value.metricType === 'single') {
//     form.value.metrics.forEach(m => (m.weight = 1))
//   } else {
//     normalizeWeights()
//   }

//   const payload = {
//     id: Date.now(),
//     name: form.value.setName.trim(),
//     desc: form.value.setDesc || '',
//     scenario: form.value.scenario || '',
//     metricType: form.value.metricType,
//     aggregation: form.value.aggregation,
//     createdAt: new Date().toISOString(),
//     ownerName: userStore.username || 'user',
//     status: 'pending',
//     metrics: form.value.metrics.map(m => ({
//       key: m.key,
//       label: m.label,
//       desc: m.desc,
//       weight: m.weight,
//       params: { ...m.params }        // 保存参数
//     }))
//   }

//   try {
//     const raw = localStorage.getItem(STORAGE_KEY)
//     const arr = raw ? JSON.parse(raw) : []
//     arr.unshift(payload)
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
//     ElMessage.success('已保存，状态为：待审核')
//     router.push({ path: '/main/standard-list' })
//   } catch {
//     ElMessage.error('保存失败：本地存储异常')
//   }
// }
const submitting = ref(false)

// 将参数对象转为后端需要的 paramsList 数组
function toParamsList(m) {
  const params = m?.params || {}
  const schema = metricParamSchemas[m.key] || {}
  return Object.entries(params).map(([k, v]) => ({
    paramName: schema[k]?.label || k,
    paramDesc: schema[k]?.label || '',
    paramValue: String(v ?? '')
  }))
}
const singleStandardIdMap = {
  exact_match: 11,
  bleu: 12,
  rouge: 13,
  f1: 14,
  pass_k: 15,
  latency: 16,
  semantic_similarity: 17,
  perplexity_fluency: 18
}
function getSingleStandardId(key) {
  return singleStandardIdMap[key] ?? (metricTemplates.findIndex(t => t.key === key) + 1)
}
async function submit() {
  if (!validateBeforeSubmit()) return
  if (submitting.value) return

  // 规范权重
  if (form.value.metricType === 'single') {
    form.value.metrics.forEach(m => (m.weight = 1))
  } else {
    normalizeWeights()
  }

  const payload = {
    recombinationStandardName: form.value.setName.trim(),
    description: form.value.setDesc || '',
    scenarioName: form.value.scenario || '',
    //选择的指标类型：单一/复合
    convergenceMode: form.value.metricType,
    aggregationOptions: form.value.aggregation,
    singleStandards: form.value.metrics.map(m => ({
      singleStandardId: getSingleStandardId(m.key),
      singleStandardName: m.label,
      singleStandardScore: Number((Number(m.weight) || 0) * 100),
      paramsList: toParamsList(m)
    })),
    totalWeight: Number((totalWeight.value || 0) * 100)

  }

  try {
    submitting.value = true
    const res = await request.post('/standard/add', payload)

    if (res.code) {
      ElMessage.success('已保存到后端')
      router.push({ path: '/main/standard-list' })
    } else {
      const msg = res?.message || res?.msg || '保存失败'
      ElMessage.error(msg)
    }
  } catch (err) {
    ElMessage.error(err?.message || '保存失败：网络或服务异常')
  } finally {
    submitting.value = false
  }
}

</script>

<style scoped>
.metric-create-page {
  max-width: 1900px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 0 10px;
}

.header-bar h2 {
  font-size: 26px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 6px;
  letter-spacing: 0.2px;
}

.grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: stretch;
  grid-auto-rows: minmax(0, auto);
}

.setname-card {
  border-radius: 12px;
  background: #fff;
  padding: 10px 14px 24px;
}

.setname-form {
  margin: 4px 0 0;
}

.set-name {
  width: 100%;
}

.metric-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 4px 0 10px;
  flex-wrap: wrap;
  gap: 8px;
}

.metric-tools .left {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.metric-tools .right {
  display: flex;
  gap: 8px;
}

.metric-table :deep(.el-table__header th) {
  background: #f5f8fc;
  color: #3a4a5d;
  font-weight: 600;
  font-size: 13px;
  height: 42px;
}

.metric-table :deep(.cell) {
  padding: 10px 12px;
  line-height: 1.4;
  white-space: normal;
  word-break: break-word;
}

.metric-desc {
  color: #5f6c7b;
  font-size: 12.5px;
}

.summary {
  display: grid;
  gap: 4px;
  margin-bottom: 10px;
}

.summary .row {
  display: flex;
  justify-content: flex-start;
  gap: 6px;
  font-size: 12px;
  color: #596674;
}

.summary .row b {
  color: #2c3e50;
}

.summary .row b.warn {
  color: #e67e22;
}

.btn-row {
  margin-top: 6px;
  display: flex;
  justify-content: flex-end;
}

.btns {
  display: flex;
  gap: 10px;
}

@media (max-width: 900px) {
  .metric-table :deep(.cell) {
    padding: 8px 10px;
  }

  .metric-tools {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* 新增：强制所有 label 左对齐（Element Plus 默认右对齐） */
.setname-form :deep(.el-form-item__label) {
  text-align: left;
  justify-content: flex-start;
  padding-left: 0;
}

/* 保证内容区域自然靠左（若之前被拉伸） */
.setname-form :deep(.el-form-item) {
  align-items: flex-start;
}

.metric-configs {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.metric-config-card {
  border: 1px solid #eef2f6;
  border-radius: 10px;
  padding: 10px 12px 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbfd 100%);
}

.metric-config-card:hover {
  box-shadow: 0 4px 14px rgba(40, 70, 120, 0.08);
}

.metric-config-card .cfg-header .title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  font-size: 14px;
}

.metric-config-card .cfg-header .desc {
  font-size: 12px;
  line-height: 1.4;
  color: #5d6b78;
  margin-bottom: 6px;
  min-height: 32px;
}

.cfg-inner-form :deep(.el-form-item) {
  margin-bottom: 10px;
}

.cfg-inner-form :deep(.el-form-item__label) {
  font-size: 12px;
  color: #546170;
  padding-right: 6px;
}

.cfg-inner-form :deep(.el-checkbox) {
  font-size: 12.5px;
  --el-checkbox-font-weight: 500;
}

@media (max-width: 800px) {
  .metric-configs {
    grid-template-columns: 1fr;
  }
}
</style>