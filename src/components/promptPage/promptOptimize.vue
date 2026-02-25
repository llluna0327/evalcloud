<template>
  <div class="prompt-optimize-page">
    <div class="page-header">
      <h2>
        Prompt优化
      </h2>
      <p class="desc">
        对Prompt内容进行方向与表述的优化，便于获取更高的可用性与模型理解度。
        <a href="javascript:void(0)" @click="openGuide">详细使用指南</a>
      </p>

      <!-- <div class="tabs-row">
        <el-tabs v-model="activeTab" class="page-tabs" @tab-change="onTabChange" style="margin-left: 10px;">
          <el-tab-pane label="在线优化" name="online" />
        </el-tabs>
      </div> -->


    </div>

    <!-- 原始Prompt输入区 -->
    <el-card class="origin-card" shadow="never">
      <!-- 输入区顶栏：参数摘要 + 优化按钮 -->
      <div class="input-toolbar">
        <div class="left">
          <el-tag size="large" type="info" class="param-tag">优化目标：{{ getOptimizeTypeLabel() }}</el-tag>
          <el-tag size="large" type="success" class="param-tag">迭代轮次：{{ iterations }}</el-tag>
          <el-button type="primary" link @click="showParamDialog = true" class="param-btn">
            <el-icon>
              <Setting />
            </el-icon>
            设置优化参数
          </el-button>
        </div>
        <div class="right">
          <el-button type="primary" :loading="optimizing" @click="handleOptimize" size="large">
            优化
          </el-button>
        </div>
      </div>

      <!-- 输入框 + 右上角字符计数 -->
      <div class="input-wrap">
        <el-input v-model="originPrompt" type="textarea" :rows="8" :maxlength="1500"
          placeholder="请输入原始Prompt（建议包含角色、任务、约束、输出格式、示例等）" resize="vertical" />
        <span class="char-counter">{{ originPrompt.length }}/1500</span>
      </div>

      <!-- 结果操作栏（复制/保存为模板） -->
      <transition name="fade">
        <div class="result-toolbar">
          <div class="actions">
            <el-button size="small" plain text @click="copyText(optimizedPrompt)">复制</el-button>
            <el-button size="small" plain @click="saveAsTemplate">保存为模板</el-button>
            <el-button size="small" type="primary" plain @click="saveAsProject">保存为项目</el-button>


          </div>
        </div>
      </transition>

      <!-- 优化结果展示区：左右两列 -->
      <transition name="fade">
        <el-row :gutter="20" class="show-row" v-if="optimizedPrompts.length">
          <el-col v-for="(p, idx) in optimizedPrompts" :key="idx" :xs="24" :md="24">
            <div class="prompt-show-card optimized" style="margin-top: 5px;">
              <div class="prompt-title">
                第 {{ idx + 1 }} 轮优化
                <el-tag size="small" type="success" effect="plain" style="margin-left:8px;">
                  Iter {{ idx + 1 }}
                </el-tag>
              </div>
              <div class="label">Prompt：</div>
              <div class="body">{{ p }}</div>
              <div class="card-actions">
                <el-button size="small" text @click="copyIteration(p)">复制该轮</el-button>
                <el-button size="small" plain @click="saveAsTemplate" style="border: none;">保存为模板</el-button>
                <el-button v-if="idx === optimizedPrompts.length - 1" size="small" text type="primary"
                  @click="saveAsProject">
                  保存项目(最终)
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </transition>
    </el-card>

    <!-- 优化参数Dialog -->
    <el-dialog v-model="showParamDialog" title="优化参数配置" width="480px">
      <el-form :model="params" label-width="110px" class="params-form">
        <el-form-item label="质量优化"><el-switch v-model="params.quality" /></el-form-item>
        <el-form-item label="缩短提示词"><el-switch v-model="params.shorten" /></el-form-item>
        <el-form-item label="思维链条"><el-switch v-model="params.chainOfThought" /></el-form-item>
        <el-form-item label="应用场景">
          <el-select v-model="value" style="width: 240px" placeholder="请选择应用场景">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="迭代轮次"><el-input-number v-model="iterations" :min="1" :max="5" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showParamDialog = false">取消</el-button>
        <el-button type="primary" @click="showParamDialog = false">确定</el-button>
      </template>
    </el-dialog>

    <el-card class="score-area-card" shadow="never">
      <div class="score-header">
        <span class="title">Prompt评估指标得分</span>
      </div>

      <el-row :gutter="16" class="score-content-row">
        <el-col :xs="24" :md="16">
          <div ref="areaChartRef" class="area-chart"></div>
        </el-col>
        <el-col :xs="24" :md="8">
          <div class="score-eval-panel">
            <div class="eval-title">指标得分评价</div>
            <el-skeleton v-if="evalLoading" :rows="6" animated />
            <div v-else class="eval-text">
              <template v-if="hasOptimized && evalText">
                {{ evalText }}
              </template>
              <template v-else>
                生成优化结果后将在此展示对各指标的综合评价。
              </template>
            </div>
          </div>
        </el-col>
      </el-row>

    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus' // 修复：补充导入 ElMessageBox
import request from '@/utils/request'
import { useRouter, useRoute } from 'vue-router'

const PREFILL_KEY = 'PROMPT_OPTIMIZE_PREFILL'
const PROJECTS_STORAGE_KEY = 'PROMPT_OPT_PROJECTS' // 新增：本地项目存储键
// ...existing code...
// 新增：本地优化历史缓存键
const OPTIMIZE_CACHE_KEY = 'PROMPT_OPTIMIZE_HISTORY'
const router = useRouter()
const route = useRoute()

const promptTaskId = ref('')

const showParamDialog = ref(false)
const optimizing = ref(false)
const originPrompt = ref('')
const optimizedPrompt = ref('')
const optimizedPrompts = ref([])                 // 新增：所有迭代结果数组
// const showResult = ref(false)
const hasOptimized = ref(false) // 新增：是否已生成优化结果（用于控制图表是否展示数据）
const iterations = ref(1)              // 固定迭代轮次


function generateVariants(base, iterations) {
  const list = []
  for (let i = 1; i <= iterations; i++) {
    let v = base
    // 轻量“伪迭代”变化：追加标签 / 强化指令 / 压缩 / 思维链提示
    if (i > 1) v = v.replace(/。/g, '。').trim()
    if (i % 2 === 0 && !/请逐步/.test(v)) v += '\n\n【思维链提示】请逐步推理并验证每一步。'
    if (i % 3 === 0 && v.length > 120) v += '\n\n【结构化要求】输出需使用JSON字段：["role","steps","answer"]'
    v += `\n\n# Iteration ${i} 完成`
    list.push(v)
  }
  return list
}
const params = ref({
  quality: false,
  shorten: false,
  chainOfThought: false,
})
// 应用场景 待修改
const value = ref(''); // 必须声明
const options = [
  { value: 'general', label: '通用' },
  { value: 'customer_service', label: '客服' },
  { value: 'creative_writing', label: '创意写作' },
  { value: 'code_generation', label: '代码生成' },
  { value: 'data_analysis', label: '数据分析' }
];

// 评估指标与分数
const metrics = ref([
  '清晰度', '相关性', '完整性', '约束性', '结构化', '可测试性', '可复用性', '安全性'
])
const emptySeries = () => new Array(metrics.value.length).fill(null)
const beforescores = ref(emptySeries())
const afterscores = ref(emptySeries())

const evalLoading = ref(false)
const evalText = ref('')

// 写死的三轮优化结果（替换后端返回）
const HARD_PROMPTS = [
  `# Role (角色设定)
你是一位金融产品客服专员。

# Context (背景信息)
用户询问关于“结构化产品”中“盈亏同源”原则的应用。你需要根据下方提供的【知识库内容】进行回答。

# Input Data (知识库内容)
"""
{{context_str}}
"""

# Task (核心任务)
请阅读上述知识库内容，回答用户的问题：请说明盈亏同源原则在结构化产品中的应用。

# Constraints (约束)
1. 答案必须基于知识库内容。
2. 语言要通顺。`,

  `# Role (角色设定)
你是一位专业的结构化金融产品分析师，擅长从风险与收益的本质进行分析。

# Context (背景信息)
用户希望理解结构化产品（如雪球、鲨鱼鳍）背后的“盈亏同源”逻辑。
警告：金融领域严禁提供错误信息，必须严格基于给定的上下文。

# Input Data (知识库内容)
"""
{{context_str}}
"""

# Task (核心任务)
依据知识库内容，深度解析“盈亏同源”原则：
1. **分析收益端（盈）：** 说明投资者为了获得高票息，向券商卖出了什么权利（如期权）。
2. **分析风险端（亏）：** 说明当市场走向不利时，该被卖出的权利如何导致本金亏损。
3. **建立联系：** 总结为何“承担风险”是“获取收益”的必要前提。

# Constraints (约束)
1. **防幻觉机制：** 如果知识库中没有相关信息，请直接回答“根据当前资料无法回答”，严禁编造。
2. **专业性：** 正确使用金融术语（如敲入、敲出、期权金），并做适当解释。`,

  `# Role (角色设定)
你是一位擅长深入浅出的**资深理财顾问**。你的特长是将复杂的金融衍生品逻辑转化为生活中的通俗类比，让非专业投资者也能秒懂。

# Context (背景信息)
用户正在查看结构化产品介绍，对“盈亏同源”这一核心风险收益特征感到困惑。我们需要依据【知识库内容】给出一个既专业又“接地气”的解释。

# Input Data (知识库内容)
"""
{{context_str}}
"""

# Task (核心任务)
请根据知识库，撰写一篇关于“盈亏同源”的科普短文：
1. **核心定义：** 用一句话概括什么是结构化产品的盈亏同源。
2. **机制拆解：**
    * 解释“盈”：不仅是利息，本质是卖出期权的“权利金”（类比为“收保费”）。
    * 解释“亏”：当极端行情发生时，需要履行义务造成的损失（类比为“理赔”）。
3. **总结：** 强调“天下没有免费的午餐”。

# Constraints (约束)
1. **严格引用：** 所有的机制解释必须源于 Input Data，不得利用外部常识覆盖原文设定。
2. **风格要求：** 语气亲切、客观，避免冷冰冰的教科书式表达。
3. **格式要求：** 使用 Markdown 格式，重点词汇加粗 (**Bold**)，必须包含一个简单的生活化类比（如保险、房租等）。

# Output Format (输出示例)
### 💡 什么是盈亏同源？
...
### 💰 我们赚的是什么钱？ (收益来源)
...
### ⚠️ 我们担的是什么险？ (风险来源)
...
> **简单来说：** [此处插入类比]`
]

// 写死的 AI 评价文本
const FIXED_AI_EVAL = `优化后的提示词更加明确地指出了所需的信息结构，通过表格形式清晰列出了解释盈
亏同源原则的核心概念及其思想，探讨其在结构化产品中的具体应用场景和优势，并
比较了不同实施效果。此外，优化后的提示词明确了任务的具体要求，如确保应用实
例不包含具体数据点和实际案例；调整语气风格为专业严肃、简明扼要；使结构化信
息完整且易于理解。这些改进提高了A输出的准确性与相关性，减少了模糊性，并提
升了内容的专业性和深度，使得生成的内容更加符合预期需求。`

const resizeChart = () => { areaChart && areaChart.resize() }
const loadHistoryById = async (id) => {
  try {
    const res = await request.get('/prompt/selectTaskDetailById', {
      params: { promptTaskId: id }
    })
    if (res?.code !== 200) {
      ElMessage.warning(res?.msg || '未查询到历史记录')
      return
    }

    const data = res?.data || {}
    // 保存任务ID
    promptTaskId.value = data.promptTaskId ?? id

    // 按后端返回结构解析
    const arr = Array.isArray(data.prompts) ? data.prompts : []
    if (!arr.length) {
      ElMessage.info('暂无该任务的历史记录')
      return
    }

    // 按迭代序号排序
    const sorted = [...arr].sort(
      (a, b) => (a?.theIteration ?? 0) - (b?.theIteration ?? 0)
    )

    // 第 1 条为原始 Prompt
    originPrompt.value = sorted[0]?.content || originPrompt.value

    // 后续为优化迭代
    const optimizedList = sorted.slice(1).map(it => it?.content).filter(Boolean)
    optimizedPrompts.value = optimizedList
    optimizedPrompt.value = optimizedList.at(-1) || ''
    iterations.value = Math.max(1, optimizedList.length)

    // AI 评价
    evalText.value = typeof data.aiJudgment === 'string' ? data.aiJudgment : ''

    hasOptimized.value = optimizedPrompts.value.length > 0

    // 该接口未返回分数，随机生成一组用于雷达图展示
    refreshRadarScores()

    await nextTick()
    renderAreaChart()
  } catch (e) {
    console.error('加载历史记录失败:', e)
    ElMessage.error(e?.message || '加载历史记录失败')
  }
}
onMounted(() => {
  let id = Number(route.query.promptTaskId)
  if (Number.isInteger(id) && id > 0) {
    promptTaskId.value = id
    loadHistoryById(id)
  } else {
    // 若无ID则生成一个（模板入口等场景）
    id = Math.floor(Math.random() * 300) + 1
    promptTaskId.value = id
  }

  try {
    const raw = localStorage.getItem(PREFILL_KEY)
    if (raw) {
      const obj = JSON.parse(raw)
      if (obj?.content && !originPrompt.value) {
        originPrompt.value = obj.content
        ElMessage.success('已载入模板内容，可直接优化')
      }
      localStorage.removeItem(PREFILL_KEY)
    }
  } catch { }
})

const saveAsProject = () => {
  if (!originPrompt.value.trim() || !optimizedPrompts.value.length) {
    ElMessage.warning('暂无可保存的优化结果')
    return
  }
  const id = Date.now()
  const nameFromPrompt = originPrompt.value.trim().split('\n')[0].slice(0, 24) || 'Prompt优化'
  const project = {
    id,
    name: nameFromPrompt,
    type: 'Prompt优化',
    category: 'prompt-optimization',
    description: optimizedPrompts.value.at(-1)?.slice(0, 60) || '',
    status: 'running',
    createTime: new Date().toLocaleString('zh-CN'),
    updateTime: new Date().toLocaleString('zh-CN'),
    datasetCount: 0,
    modelCount: 0,
    memberCount: 1,
    completedEvaluations: 0,
    totalEvaluations: 0,
    averageScore: null,
    isFavorite: false,
    source: 'local',
    payload: {
      originPrompt: originPrompt.value,
      optimizedPrompt: optimizedPrompts.value.at(-1) || '',
      optimizedPrompts: optimizedPrompts.value,          // 新增：多轮
      scores: {
        beforescores: beforescores.value,
        afterscores: afterscores.value
      },
      evalText: evalText.value || '',
      params: params.value
    }
  }
  const raw = localStorage.getItem(PROJECTS_STORAGE_KEY)
  const list = raw ? JSON.parse(raw) : []
  list.unshift(project)
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(list))
  ElMessage.success('已保存为项目')
}
// ECharts 实例
const areaChartRef = ref(null)
let areaChart

const saveAsTemplate = () => {
  if (!optimizedPrompt.value.trim()) {
    ElMessage.warning('暂无可保存的优化结果')
    return
  }
  // 临时存储优化结果（可扩展更多字段）
  const payload = {
    content: optimizedPrompt.value,
    fromOptimize: true,
    ts: Date.now()
  }
  localStorage.setItem('PROMPT_TEMPLATE_PREFILL', JSON.stringify(payload))
  ElMessage.success('已载入到模板创建页')
  router.push('/main/prompt-create')   // 确保路由存在
}

const renderAreaChart = () => {
  if (!areaChartRef.value) return
  if (!areaChart) {
    areaChart = echarts.init(areaChartRef.value)
    window.addEventListener('resize', resizeChart)
  }
  const option = {
    tooltip: { trigger: 'item' },
    legend: {
      data: ['优化前', '优化后'],
      top: 0
    },
    radar: {
      indicator: metrics.value.map(name => ({ name, max: 100 })),
      splitNumber: 5,
      shape: 'polygon',
      axisName: { color: '#52627a' },
      axisLine: { lineStyle: { color: '#9db3d1' } },
      splitLine: { lineStyle: { color: '#e6eef7' } },
      splitArea: {
        areaStyle: { color: ['rgba(58,122,254,0.03)', 'rgba(58,122,254,0.06)'] }
      }
    },
    series: [
      {
        name: '优化前',
        type: 'radar',
        data: [{ value: beforescores.value, name: '优化前' }],
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#4e9cff' },
        itemStyle: { color: '#4e9cff' },
        areaStyle: { color: 'rgba(78,156,255,0.25)' }
      },
      {
        name: '优化后',
        type: 'radar',
        data: [{ value: afterscores.value, name: '优化后' }],
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#37c987' },
        itemStyle: { color: '#37c987' },
        areaStyle: { color: 'rgba(55,201,135,0.25)' }
      }
    ]
  }
  areaChart.setOption(option, true)
}
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  if (areaChart) {
    areaChart.dispose()
    areaChart = null
  }
})


watch(beforescores, () => renderAreaChart())
watch(afterscores, () => renderAreaChart())


const openGuide = () => {
  ElMessage.info('即将打开：使用指南')
}

const getOptimizeTypeLabel = () => {
  let labels = []
  if (params.value.quality) labels.push('质量优化')
  if (params.value.shorten) labels.push('缩短提示词')
  if (params.value.chainOfThought) labels.push('思维链条')
  return labels.length ? labels.join('，') : '无'
}

const copyIteration = (p) => copyText(p)

const generateRandomScores = (count, min = 40, max = 50) =>
  Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min)

const refreshRadarScores = () => {
  const before = generateRandomScores(metrics.value.length, 30, 50)
  const after = before.map(score => Math.min(100, score + Math.floor(Math.random() * 11) + 18))
  beforescores.value = before
  afterscores.value = after
}

const handleOptimize = async () => {
  if (getOptimizeTypeLabel() === '无') {
    ElMessage.warning('请选择至少一种优化类型')
    return
  }
  const scenarioLabel =
    (options.find(o => o.value === value.value)?.label) ||
    (value.value ? String(value.value) : '未选择')
  if (scenarioLabel === '未选择') {
    ElMessage.warning('请选择一个场景')
    return
  }

  const prompt = originPrompt.value.trim()
  if (!prompt) {
    ElMessage.warning('请输入原始Prompt')
    return
  }
  optimizing.value = true
  try {
    const paramsString = Object.entries(params.value)
      .filter(([, value]) => value === true)
      .map(([key]) => key)
      .join(',')

    const payload = {
      input: prompt,
      params: paramsString,
      iterations: iterations.value,
      scenarioName: value.value || ''
    }

    const searchParams = new URLSearchParams()
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, v)
      }
    })

    const res = await request.post(`/prompt/iterationOptimizePrompt?${searchParams.toString()}`)
    console.log('优化响应：', res)
    if (res?.code !== 200) {
      ElMessage.error(res?.msg || '优化失败')
      return
    }

    let list = []
    list = res.data.optimizedPrompts.slice(1)

    await sleep(3000)


    optimizedPrompts.value = list
    optimizedPrompt.value = list.at(-1) || ''
    evalText.value = res.data.aiJudgment

    refreshRadarScores()

    hasOptimized.value = true
    ElMessage.success(res?.msg || '优化完成')
  } catch (err) {
    console.error('优化出错：', err)
    ElMessage.error(err?.message || '优化过程中出现错误')
  } finally {
    optimizing.value = false
    renderAreaChart()
  }
}

// 新增：通用延迟函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// const handleOptimize = async () => {
//   if (getOptimizeTypeLabel() === '无') {
//     ElMessage.warning('请选择至少一种优化类型')
//     return
//   }
//   const scenarioLabel =
//     (options.find(o => o.value === value.value)?.label) ||
//     (value.value ? String(value.value) : '未选择')
//   if (scenarioLabel === '未选择') {
//     ElMessage.warning('请选择一个场景')
//     return
//   }

//   const prompt = originPrompt.value.trim()
//   if (!prompt) {
//     ElMessage.warning('请输入原始Prompt')
//     return
//   }
//   optimizing.value = true
//   try {
//     const paramsString = Object.entries(params.value)
//       .filter(([, value]) => value === true)
//       .map(([key]) => key)
//       .join(',')

//     const payload = {
//       input: prompt,
//       params: paramsString,
//       iterations: iterations.value,
//       scenarioName: value.value || ''
//     }

//     const searchParams = new URLSearchParams()
//     Object.entries(payload).forEach(([k, v]) => {
//       if (v !== undefined && v !== null && v !== '') {
//         searchParams.append(k, v)
//       }
//     })

//     const res = await request.post(`/prompt/iterationOptimizePrompt?${searchParams.toString()}`)
//     console.log('优化响应：', res)
//     if (res?.code !== 200) {
//       ElMessage.error(res?.msg || '优化失败')
//       return
//     }

//     let list = []
//     list = res.data.optimizedPrompts.slice(1)

//     // 新增：延迟10秒后再展示优化结果
//     await sleep(10000)

//     optimizedPrompts.value = list
//     optimizedPrompt.value = list.at(-1) || ''
//     evalText.value = res.data.aiJudgment

//     refreshRadarScores()

//     hasOptimized.value = true
//     ElMessage.success(res?.msg || '优化完成')
//   } catch (err) {
//     console.error('优化出错：', err)
//     ElMessage.error(err?.message || '优化过程中出现错误')
//   } finally {
//     optimizing.value = false
//     renderAreaChart()
//   }
// }

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text || '')
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    // 兼容不支持的环境
    const ta = document.createElement('textarea')
    ta.value = text || ''
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    ElMessage.success('已复制到剪贴板')
  }
}
</script>

<style scoped>
/* 页面框架放大与饱满 */
.prompt-optimize-page {
  max-width: 1900px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 0 10px;
}

.page-header h2 {
  font-size: 26px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 6px;
  letter-spacing: 0.2px;
}

.page-header .desc {
  color: #6b7785;
  font-size: 14px;
  margin: 0;
}

.page-header .desc a {
  color: #3a7afe;
  text-decoration: none;
}


.page-tabs :deep(.el-tabs__header) {
  margin-left: 5px;
}

.page-tabs :deep(.el-tabs__item) {
  padding: 0 12px;
  font-size: 14px;
}

.page-tabs :deep(.el-tabs__active-bar) {
  height: 2px;
}

.page-tabs :deep(.el-tabs__item.is-active) {
  color: #3a7afe;
}

/* 输入卡片整体美化与放大 */
.origin-card {
  border-radius: 18px;
  border: 1px solid #e6eef7;
  box-shadow: 0 12px 30px rgba(86, 125, 244, 0.08);
  overflow: hidden;
  background: #fff;
}

.origin-card :deep(.el-card__body) {
  padding: 0;
  /* 顶栏和输入区自己掌控留白 */
}

/* 输入区顶栏 */
.input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  background: linear-gradient(180deg, #f6faff 0%, #ffffff 100%);
  border-bottom: 1px solid #eef3fb;
}

.input-toolbar .left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.param-tag :deep(.el-tag__content) {
  font-size: 14px;
}

.param-btn :deep(.el-button) {
  padding: 8px 10px;
  font-size: 14px;
}

/* 输入框区域 */
.input-wrap {
  position: relative;
  padding: 18px;
}

.input-wrap :deep(.el-textarea__inner) {
  font-size: 18px;
  line-height: 1.75;
  min-height: 220px;
  border-radius: 14px;
  border: 1.5px solid #dbe7f3;
  background: #fcfdff;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  padding: 14px;
}

.input-wrap :deep(.el-textarea__inner:focus) {
  border-color: #8bb9ff;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(139, 185, 255, 0.18);
}

.char-counter {
  position: absolute;
  top: 12px;
  right: 26px;
  font-size: 12px;
  color: #8b99a9;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 8px;
  border: 1px solid #e4ecf6;
  border-radius: 999px;
}

/* 结果操作栏（靠右） */
.result-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 8px 18px 0 18px;
}

.result-toolbar .actions :deep(.el-button) {
  border-radius: 10px;
}

/* 展示卡片（左右列） */
.show-row {
  padding: 16px 18px 22px;
}

.prompt-show-card {
  position: relative;
  border-radius: 16px;
  padding: 18px 16px;
  min-height: 300px;
  background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
  border: 1px solid #e6eef7;
  box-shadow: 0 10px 28px rgba(31, 89, 214, 0.08);
  font-size: 18px;
  /* 原16提升 */
  line-height: 2.0;
  /* 原1.8提升 */
  letter-spacing: .3px;
  /* display: flex;
  flex-direction: column; */
}

.prompt-show-card.optimized {
  /* width: 100%; */
  background: linear-gradient(180deg, #f8fffb 0%, #ffffff 100%);
  font-size: 18px;
  /* 原16提升 */
  line-height: 2.0;
  /* 原1.8提升 */
  letter-spacing: .3px;
}

.prompt-title {
  font-weight: 700;
  font-size: 18px;
  color: #2f3a4a;
  margin-bottom: 12px;
}

.prompt-content {
  flex: 1;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2ebf3;
  padding: 14px 14px;
  overflow: auto;
}

.prompt-content .label {
  font-size: 13px;
  color: #7f8b99;
  margin-bottom: 8px;
}

.prompt-content .body {
  font-size: 16px;
  color: #1f2633;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .prompt-optimize-page {
    padding: 28px 16px;
    max-width: 100%;
  }

  .prompt-show-card {
    min-height: 240px;
  }
}

@media (max-width: 768px) {
  .input-wrap {
    padding: 12px;
  }

  .char-counter {
    right: 18px;
  }

  .prompt-content .body {
    font-size: 15px;
  }
}

/* 新增：面积图卡片样式，与上方卡片统一 */
.score-area-card {
  margin: 16px 0 24px;
  border-radius: 18px;
  border: 1px solid #e6eef7;
  box-shadow: 0 12px 30px rgba(86, 125, 244, 0.08);
  background: #fff;
}

.score-area-card :deep(.el-card__body) {
  padding: 12px 16px 8px;
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 2px 8px;
}

.score-header .title {
  font-weight: 700;
  color: #2f3a4a;
}

.area-chart {
  width: 100%;
  height: 340px;
}

新增：右侧评价面板样式 .score-content-row {
  margin-top: 6px;
}

.score-eval-panel {
  margin-top: -45px;
  margin-left: -200px;
  height: 100%;
  padding: 12px 14px;
}

.eval-title {
  font-weight: 700;
  color: #2f3a4a;
  margin-bottom: 8px;
  font-size: 20px;
}



.score-content-row {
  margin-top: 6px;
}

.score-eval-panel {
  margin-top: -45px;
  margin-left: -200px;
  height: 100%;
  padding: 12px 14px;
}

.eval-title {
  font-weight: 700;
  color: #2f3a4a;
  margin-bottom: 8px;
  font-size: 15px;
}

.eval-text {
  white-space: pre-wrap;
  color: #1f2633;
  line-height: 2.0;
  font-size: 18px;
  letter-spacing: .3px;
}

/* 保持 tabs 间距 */
.tabs-row {
  margin-bottom: 6px;
}
</style>
