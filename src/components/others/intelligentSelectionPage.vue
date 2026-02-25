````vue
// filepath: d:\FRONT-PRACTICE\PROJECT\prompt_modelEval_system\src\components\others\intelligentSelectionPage.vue
<template>
  <div class="selection-page">
    <div class="header-left">
      <h2>模型-Prompt智能选型</h2>
      <p>输入任务 → 分析特征 → 推荐候选模型 → 最终推荐</p>
    </div>

    <el-steps :active="step" finish-status="success" align-center style="margin-bottom: 26px;">
      <el-step title="输入任务" />
      <el-step title="任务分析与候选" />
      <el-step title="评估与推荐" />
    </el-steps>

    <!-- STEP 0: 输入 -->
    <div class="panel" v-if="step === 0">
      <div class="panel-header">
        <span class="panel-title">任务与数据集</span>
      </div>
      <el-form label-position="top" class="task-form">
        <el-form-item label="项目名称">
          <el-input v-model="projectName" maxlength="60" show-word-limit placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="选择数据集">
          <el-select v-model="selectedDatasetIds" multiple filterable collapse-tags collapse-tags-tooltip
            placeholder="请选择数据集" :loading="dsLoading" style="width: 100%;">
            <el-option v-for="opt in datasetOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述（请描述使用目标、交互形态、是否涉及分析决策等）">
          <el-input v-model="taskInput" type="textarea" :rows="8" maxlength="2000" show-word-limit
            placeholder="例如：我需要一个支持多轮信息检索与追问的智能问答助手" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large"
            :disabled="!taskInput.trim() || !projectName.trim() || !selectedDatasetIds.length" @click="startAnalysis"
            :loading="isanalyzing">
            分析任务并生成初始 Prompt
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- STEP 1: 分析与候选 -->
    <div class="panel" v-if="step === 1">
      <div class="panel-header">
        <span class="panel-title">任务分析与候选模型</span>
        <el-tag v-if="scenarioName" type="info">{{ scenarioName }}</el-tag>
      </div>

      <div v-if="analyzing" class="progress-block">
        <div class="pb-row">
          <span>分析进度</span><span>{{ progress }}%</span>
        </div>
        <el-progress :percentage="progress" :stroke-width="16" striped striped-flow />
        <div class="loading-hint">
          <el-icon>
            <Loading />
          </el-icon> 正在分析任务并匹配候选模型...
        </div>
      </div>

      <template v-else>
        <el-alert v-if="analysisDone" type="success" :closable="false" show-icon class="analysis-summary"
          :title="`场景：${scenarioName} ｜ 复杂度：${analysisResult.complexity} ｜ 语言：${analysisResult.language}`" />

        <div class="sub-block">
          <h3 class="sub-title">候选模型（共 {{ filteredModels.length }} 个）</h3>
          <div class="model-grid">
            <div v-for="m in filteredModels" :key="m.id" class="model-card">
              <div class="mc-header">
                <span class="mc-name">{{ m.name }}</span>
              </div>
              <p class="mc-desc">{{ m.description }}</p>
              <div class="mc-strength"><strong>优势：</strong>{{ m.strength }}</div>
            </div>
          </div>
          <el-alert style="margin-top:12px" type="info" :closable="false" show-icon title="已按场景自动选取候选模型，无需手动筛选" />
        </div>

        <div class="sub-block">
          <h3 class="sub-title">初始 Prompt</h3>
          <div class="prompt-box">
            <pre>{{ initialPrompt }}</pre>
          </div>
        </div>

        <div class="actions-row">
          <el-button size="large" @click="resetAll">重新输入</el-button>
          <el-button type="primary" size="large" @click="startOptimize">开始评估全部候选</el-button>
        </div>
      </template>
    </div>

    <!-- STEP 2: 评估与推荐 -->
    <div class="panel" v-if="step === 2">
      <div class="panel-header">
        <span class="panel-title">评估与最终推荐</span>
        <el-tag v-if="filteredModels.length" type="success">已评估 {{ filteredModels.length }} 个候选</el-tag>
      </div>

      <div v-if="optimizing" class="progress-block">
        <div class="pb-row">
          <span>评估进度</span><span>{{ optimizeProgress }}%</span>
        </div>
        <el-progress :percentage="optimizeProgress" :stroke-width="16" status="success" striped />
        <div class="loading-hint">
          <el-icon>
            <Loading />
          </el-icon> 正在对全部候选模型执行多维度打分...
        </div>
      </div>

      <template v-else>
        <div class="sub-block" v-if="evaluationResults.length">
          <h3 class="sub-title">评估结果</h3>
          <div class="eval-list">
            <div v-for="r in evaluationResults" :key="r.modelId" class="eval-item">
              <div class="eval-head">
                <span class="eval-name">{{ r.name }}</span>
                <el-tag :type="r.modelId === finalModel.id ? 'success' : 'info'" size="small">
                  分数 {{ r.score }}
                </el-tag>
              </div>
              <el-progress :percentage="r.score" :stroke-width="12" />
            </div>
          </div>
        </div>

        <div class="sub-block">
          <h3 class="sub-title">最终推荐模型</h3>
          <div class="final-recommend">
            <div class="model-card active">
              <div class="mc-header">
                <span class="mc-name">{{ finalModel.name }}</span>
                <el-tag size="small" type="success">推荐</el-tag>
              </div>
              <p class="mc-desc">{{ finalModel.description }}</p>
              <div class="reason-box">
                <strong>推荐理由：</strong>{{ recommendationReason }}
              </div>
            </div>
          </div>
        </div>
        <!-- 新增：最优 Prompt 展示 -->
        <div class="sub-block" v-if="optimizedPrompt">
          <h3 class="sub-title">最优 Prompt</h3>
          <div class="prompt-box">
            <pre>{{ optimizedPrompt }}</pre>
          </div>
        </div>

        <div class="actions-row">
          <el-button @click="resetAll">重新开始</el-button>
          <el-button type="primary" @click="emitResult">保存为项目</el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useRouter } from 'vue-router'

const router = useRouter()

// 基础状态
const step = ref(0)
const projectName = ref('')
const taskInput = ref('')
const selectedDatasetIds = ref([])
const datasetOptions = ref([])
const dsLoading = ref(false)
const selectedDatasetNames = computed(() => {
  const map = new Map(datasetOptions.value.map(d => [d.value, d.label]))
  return selectedDatasetIds.value.map(id => map.get(id)).filter(Boolean)
})

const adviceTaskId = ref(null)
const scenarioName = ref('') // 后端返回场景名称：信息交互类 / 内容生成与加工类 / 分析与决策支持类 / 流程与任务自动化类

// 分析阶段
const isanalyzing = ref(false)
const analyzing = ref(false)
const progress = ref(0)
const analysisDone = ref(false)
const analysisResult = ref({
  complexity: '',
  language: '',
  length: ''
})
const initialPrompt = ref('')

// 评估阶段
const optimizing = ref(false)
const optimizeProgress = ref(0)
const filteredModels = ref([])
const evaluationResults = ref([])
const finalModel = ref({})
const recommendationReason = ref('')
const optimizedPrompt = ref('') //（不再优化生成，仅保留展示需要时可扩展）
// 新增：保存后端返回的初始 Prompt
const backendInitialPrompt = ref('')

// 模型列表（统一标签：交互 / 生成 / 分析 / 自动化）
const MODEL_REGISTRY = [
  {
    id: 'qwen2.5-0.5b-instruct',
    name: 'Qwen/Qwen2.5-0.5B-Instruct',
    description: '轻量级中文指令模型，适合快速响应与简单加工。',
    tags: ['交互', '生成'],
    strength: '资源占用低，适合轻量与边缘场景'
  },
  {
    id: 'kimi-k2-0905-preview',
    name: 'kimi-k2-0905-preview',
    description: '多轮追问与知识检索友好，交互体验自然。',
    tags: ['交互', '知识'],
    strength: '多轮上下文关联和信息回溯较好'
  },
  {
    id: 'tongyi-qwen-plus',
    name: 'Tongyi-Qwen-Plus',
    description: '中文泛化能力强，适合多用途生成与润色。',
    tags: ['生成', '交互'],
    strength: '文本结构化与自然语言风格稳定'
  },
  {
    id: 'hunyuanfin-3.0',
    name: 'HunyuanFin-3.0',
    description: '金融分析与结构指标说明更稳健。',
    tags: ['分析', '行业'],
    strength: '报表字段解释与财务语义理解较强'
  },
  {
    id: 'zhiniao-medical-pro',
    name: 'Zhiniao-Medical-Pro',
    description: '医疗知识增强，适合合规问答与专业概述。',
    tags: ['分析', '医疗'],
    strength: '医学术语与指南匹配度高'
  },
  {
    id: 'codellama-byte-7b',
    name: 'CodeLlama-Byte-7B',
    description: '代码与脚本生成能力较好，可支撑自动化流程原型。',
    tags: ['自动化', '代码'],
    strength: '结构化脚本与任务编排辅助'
  },
  {
    id: 'internal-business-llm-v2',
    name: 'Internal-Business-LLM-V2',
    description: '企业流程/策略理解优化，适合内部决策支持。',
    tags: ['分析', '决策', '自动化'],
    strength: '业务规则抽取与审批链条总结'
  },
  {
    id: 'ernie-4.0-multimodal',
    name: 'ERNIE-4.0-Multimodal',
    description: '多模态理解与内容加工表达优异。',
    tags: ['生成', '多模态'],
    strength: '复杂内容组织与统一风格输出'
  },
  {
    id: 'mathgpt-3.0',
    name: 'MathGPT-3.0',
    description: '逻辑与定量推理能力强，适合指标说明与计算辅助。',
    tags: ['分析', '推理'],
    strength: '公式与步骤化定量说明清晰'
  }
]

// 四类应用场景 → 候选模型与推荐模型（纯前端捏造）
const SCENARIO_CANDIDATES = {
  '信息交互类': [
    'kimi-k2-0905-preview',
    'tongyi-qwen-plus',
    'qwen2.5-0.5b-instruct',
    'internal-business-llm-v2'
  ],
  '内容生成与加工类': [
    'ernie-4.0-multimodal',
    'tongyi-qwen-plus',
    'qwen2.5-0.5b-instruct',
    'kimi-k2-0905-preview'
  ],
  '分析与决策支持类': [
    'internal-business-llm-v2',
    'hunyuanfin-3.0',
    'mathgpt-3.0',
    'zhiniao-medical-pro'
  ],
  '流程与任务自动化类': [
    'codellama-byte-7b',
    'internal-business-llm-v2',
    'qwen2.5-0.5b-instruct',
    'tongyi-qwen-plus'
  ]
}
const SCENARIO_RECOMMEND = {
  '信息交互类': 'kimi-k2-0905-preview',
  '内容生成与加工类': 'ernie-4.0-multimodal',
  '分析与决策支持类': 'internal-business-llm-v2',
  '流程与任务自动化类': 'codellama-byte-7b'
}
const FALLBACK_ORDER = [
  'tongyi-qwen-plus',
  'qwen2.5-0.5b-instruct',
  'kimi-k2-0905-preview',
  'ernie-4.0-multimodal',
  'internal-business-llm-v2',
  'codellama-byte-7b',
  'hunyuanfin-3.0',
  'mathgpt-3.0',
  'zhiniao-medical-pro'
]
function ensureCandidates(scene) {
  const baseIds = (SCENARIO_CANDIDATES[scene] || []).map(i => i.toLowerCase())
  const set = new Set(baseIds)
  for (const id of FALLBACK_ORDER) {
    if (set.size >= 4) break
    if (!set.has(id)) set.add(id)
  }
  const finalList = Array.from(set)
  if (finalList.length < 3) {
    for (const id of FALLBACK_ORDER) {
      if (!set.has(id)) {
        set.add(id)
        if (set.size >= 3) break
      }
    }
  }
  return Array.from(set).slice(0, 4)
}
// 增加：场景归一化（处理后端可能返回的近似名称）
function normalizeScenario(s = '') {
  if (!s) return ''
  return (
    ['信息交互类', '内容生成与加工类', '分析与决策支持类', '流程与任务自动化类']
      .find(k => s.includes(k.replace(/与/g, '')) || s.includes(k.replace(/类/g, ''))) // 轻度模糊匹配
    || s
  )
}

// 修改 pickModels：大小写兼容
function pickModels(ids = []) {
  const map = new Map(MODEL_REGISTRY.map(m => [m.id.toLowerCase(), m]))
  return ids.map(i => map.get(String(i).toLowerCase())).filter(Boolean)
}

// 场景推断（若后端未提供，通过任务关键词粗略分类）
function inferScenario(text) {
  const t = text.toLowerCase()
  if (/(问答|检索|互动|聊天|查询|追问)/.test(t)) return '信息交互类'
  if (/(生成|润色|改写|总结|内容|写作)/.test(t)) return '内容生成与加工类'
  if (/(分析|决策|指标|评估|计算|报表|规划|预测)/.test(t)) return '分析与决策支持类'
  if (/(流程|自动化|脚本|编排|执行|任务)/.test(t)) return '流程与任务自动化类'
  return '内容生成与加工类'
}

// 语言与复杂度判定（简单规则）
function analyzeTaskBase(task) {
  return {
    complexity: /复杂|战略|多部门|体系|集成/.test(task) ? '复杂' : '中等',
    language: /[\u4e00-\u9fa5]/.test(task) ? '中文' : '英文',
    length: task.length < 120 ? '短' : (task.length > 400 ? '长' : '中')
  }
}

// 初始 Prompt（按场景定制占位模板）
function buildInitialPrompt(scene, task) {
  const commonHeader = `你是一个智能系统助手，当前场景为【${scene}】。请基于给定的业务任务描述，输出规范化的执行指令。`
  const sceneBlocks = {
    '信息交互类': `输出结构：系统指令；输入字段；多轮交互策略；增强建议（3条）。`,
    '内容生成与加工类': `输出结构：角色描述；输入定义；生成策略；质量控制；阶段扩展。`,
    '分析与决策支持类': `输出结构：分析目标；指标/维度；决策模板；风险与不确定性规范。`,
    '流程与任务自动化类': `输出结构：流程概要；步骤表；异常与重试策略；可扩展挂钩。`
  }
  return `${commonHeader}
任务描述：
${task}

请仅输出上述“输出结构”对应的空骨架，不填充真实业务。`
}

// 新增：根据场景与模型构造最优 Prompt（前端捏造增强，基于 initialPrompt）
function buildOptimizedPrompt(scene, base, model) {
  const sceneAddons = {
    '信息交互类': `\n强化策略：\n- 多轮上下文摘要与意图澄清\n- 未命中回答时返回澄清问题列表\n- 引用来源标注 [#编号]`,
    '内容生成与加工类': `\n强化策略：\n- 分阶段：结构草稿→风格润色→一致性校对\n- 输出重复检测标记段\n- 必要时列出可继续扩展的2个方向`,
    '分析与决策支持类': `\n强化策略：\n- 决策结构：背景|结论|依据|风险|备选\n- 指标缺失时标注"(缺失待补)"\n- 依据部分提供量化或来源说明`,
    '流程与任务自动化类': `\n强化策略：\n- 步骤字段：序号|动作|输入|输出|失败重试\n- 并行步骤用 group:{步骤号,...}\n- 输出最终校验脚本雏形`
  }
  const modelTail = model?.name
    ? `\n模型适配 (${model.name}): 利用其优势(${model.strength})，保证响应结构稳定。`
    : ''
  return [
    '【优化后 Prompt - FINAL】',
    base.trim(),
    sceneAddons[scene] || '',
    modelTail,
    '\n请严格按以上结构返回，不输出多余解释。'
  ].join('\n')
}

// 评分逻辑（场景相关性 + 标签匹配 + 偏好加分）
function evaluateModel(model, scene, basePrompt) {
  let score = 70
  if (scene === '信息交互类' && model.tags.includes('交互')) score += 15
  if (scene === '内容生成与加工类' && model.tags.includes('生成')) score += 15
  if (scene === '分析与决策支持类' && (model.tags.includes('分析') || model.tags.includes('推理'))) score += 15
  if (scene === '流程与任务自动化类' && (model.tags.includes('自动化') || model.tags.includes('代码'))) score += 15
  if (/中文/.test(basePrompt) && model.description.includes('中文')) score += 5
  score += (model.id.length * 3 + basePrompt.length) % 9
  return Math.min(98, score)
}

// 推荐理由
function buildReason(model, scene) {
  return `该模型在“${scene}”场景下的核心能力（${model.strength}）与任务要求高度匹配，综合稳定性与扩展潜力较优，适合作为场景推荐模型。`
}

// 加载数据集（仅使用审核通过 isValidated === 1）
const loadDatasetOptions = async () => {
  dsLoading.value = true
  try {
    const res = await request.get('/file/dataSets/all')
    const ok = res && res.code === 200 && Array.isArray(res.data)
    const list = ok ? res.data : []
    const approved = list.filter(it => it?.isValidated === 1)
    datasetOptions.value = approved.map((d, i) => ({
      value: d.evalDatasetId ?? d.datasetId ?? d.id ?? i + 1,
      label: d.datasetName ?? d.name ?? d.fileName ?? `数据集-${(d.id ?? i + 1)}`
    }))
  } catch {
    datasetOptions.value = []
  } finally {
    dsLoading.value = false
  }
}

// 分析启动
async function startAnalysis() {
  if (!projectName.value.trim()) { ElMessage.error('请填写项目名称'); return }
  if (!selectedDatasetIds.value.length) { ElMessage.error('请选择数据集'); return }
  if (!taskInput.value.trim()) { ElMessage.error('任务描述为空'); return }
  isanalyzing.value = true
  ElMessage.success('正在创建与分析任务...')

  try {
    const res = await request({
      url: '/adviceTask/insert',
      method: 'post',
      data: {
        evalAdviceName: projectName.value.trim(),
        taskDesc: taskInput.value.trim(),
        datasetName: selectedDatasetNames.value.join(', ')
      },
      headers: { 'Content-Type': 'application/json' }
    })
    console.log('Create advice task response:', res)
    if (res?.code !== 200) {
      ElMessage.error(res?.msg || '创建选型任务失败')
      isanalyzing.value = false
      return
    }
    adviceTaskId.value = res.data.evalAdviceId
    scenarioName.value = normalizeScenario(res?.data?.scenarioName) || inferScenario(taskInput.value.trim())

    // 取后端返回的初始 Prompt（支持多字段兼容），为空时暂不生成，留给后续兜底
    const backendPrompt =
      res?.data?.originalPrompt ||
      res?.data?.initPrompt ||
      res?.data?.firstPrompt ||
      res?.data?.promptTemplate ||
      res?.data?.prompt ||
      ''

    backendInitialPrompt.value = backendPrompt
    initialPrompt.value = backendPrompt // 第二步直接展示后端提供的初始 Prompt

    isanalyzing.value = false
  } catch (e) {
    ElMessage.error(e?.message || '创建任务接口异常')
    isanalyzing.value = false
    return
  }

  // 进入分析进度
  step.value = 1
  analyzing.value = true
  progress.value = 0
  analysisDone.value = false
  filteredModels.value = []

  const baseInfo = analyzeTaskBase(taskInput.value.trim())
  analysisResult.value = baseInfo

  const timer = setInterval(() => {
    progress.value += 5
    if (progress.value >= 100) {
      clearInterval(timer)
      if (!initialPrompt.value.trim()) {
        initialPrompt.value = buildInitialPrompt(scenarioName.value, taskInput.value.trim())
      }
      // 使用 ensureCandidates 保证数量
      const ids = ensureCandidates(scenarioName.value)
      filteredModels.value = pickModels(ids)
      analysisDone.value = true
      analyzing.value = false
    }
  }, 20)
}

// 评估启动
function startOptimize() {
  if (!filteredModels.value.length) {
    ElMessage.warning('暂无候选模型')
    return
  }
  // 二次保障
  let ids = filteredModels.value.map(m => m.id.toLowerCase())
  if (ids.length < 3) {
    const ensured = ensureCandidates(scenarioName.value)
    filteredModels.value = pickModels(ensured)
    ids = filteredModels.value.map(m => m.id.toLowerCase())
  }

  step.value = 2
  optimizing.value = true
  optimizeProgress.value = 0
  evaluationResults.value = []
  finalModel.value = {}
  recommendationReason.value = ''

  const recommendId = SCENARIO_RECOMMEND[scenarioName.value]

  const timer = setInterval(() => {
    optimizeProgress.value += 3
    if (optimizeProgress.value >= 100) {
      clearInterval(timer)

      // 原始评分
      let scored = filteredModels.value.map(m => ({
        modelId: m.id,
        name: m.name,
        rawScore: evaluateModel(m, scenarioName.value, initialPrompt.value)
      }))
      // 按原始分排序
      scored.sort((a, b) => b.rawScore - a.rawScore)

      // 保证推荐模型置于首位并最终拥有最高区间
      const idxRec = scored.findIndex(s => s.modelId === recommendId)
      if (idxRec > -1) {
        const recItem = scored.splice(idxRec, 1)[0]
        scored.unshift(recItem)
      }

      // 分数区间
      const ranges = [[95, 90], [92, 85], [85, 78], [80, 75]]
      const evaluated = scored.map((r, idx) => {
        let score = r.rawScore
        if (idx < ranges.length) {
          const [max, min] = ranges[idx]
          const norm = (score - 70) / (100 - 70)
          score = Math.round(min + (max - min) * Math.min(1, Math.max(0, norm)))
        } else {
          score = Math.min(74, Math.max(60, Math.round(score * 0.8)))
        }
        return { modelId: r.modelId, name: r.name, score }
      })

      evaluationResults.value = evaluated
      finalModel.value = filteredModels.value.find(m => m.id === recommendId) || filteredModels.value.find(m => m.id === evaluated[0].modelId) || filteredModels.value[0]
      recommendationReason.value = buildReason(finalModel.value, scenarioName.value)
      optimizedPrompt.value = buildOptimizedPrompt(scenarioName.value, initialPrompt.value, finalModel.value)
      optimizing.value = false
    }
  }, 33)
}

// 保存结果（纯后端）
function emitResult() {
  if (!adviceTaskId.value) { ElMessage.error('缺少任务ID'); return }
  if (!finalModel.value?.name) { ElMessage.error('缺少推荐模型'); return }
  const payload = {
    evalAdviceId: adviceTaskId.value,
    evalAdviceName: projectName.value.trim(),
    datasetName: selectedDatasetNames.value.join(', ') || '-',
    favorableModelName: finalModel.value.name,
    scenarioName: scenarioName.value,
    resultPrompt: initialPrompt.value // 当前仅保存初始结构指令（可扩展）
  }
  request({
    url: '/adviceTask/updateAdvice',
    method: 'post',
    data: payload,
    headers: { 'Content-Type': 'application/json' }
  }).then(res => {
    if (res?.code !== 200) {
      ElMessage.error(res?.msg || '保存失败')
      return
    }
    ElMessage.success('已保存为选型项目')
    router.push('/main/selection-result')
  }).catch(err => {
    ElMessage.error(err?.message || '保存接口异常')
  })
}

function resetAll() {
  step.value = 0
  projectName.value = ''
  taskInput.value = ''
  selectedDatasetIds.value = []
  scenarioName.value = ''
  initialPrompt.value = ''
  optimizedPrompt.value = ''
  analyzing.value = false
  optimizeProgress.value = 0
  optimizing.value = false
  progress.value = 0
  analysisDone.value = false
  filteredModels.value = []
  evaluationResults.value = []
  finalModel.value = {}
  recommendationReason.value = ''
  adviceTaskId.value = null
}

onMounted(() => {
  loadDatasetOptions()
})
</script>

<style scoped>
.selection-page {
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
  letter-spacing: .2px;
}

.header-left p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
}

.panel {
  background: #fff;
  border: 1px solid #e5eaf3;
  border-radius: 16px;
  padding: 24px 26px 30px;
  margin-bottom: 32px;
  position: relative;
  box-shadow: 0 4px 16px rgba(67, 97, 238, .06);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f3f8;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.task-form {
  margin-top: 10px;
}

.progress-block {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pb-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #637083;
}

.loading-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #4361ee;
  background: #f3f6fd;
  padding: 8px 12px;
  border-radius: 8px;
}

.analysis-summary {
  margin-bottom: 18px;
}

.sub-block {
  margin-top: 10px;
  margin-bottom: 30px;
}

.sub-title {
  font-size: 16px;
  font-weight: 600;
  color: #4361ee;
  margin: 0 0 15px;
  letter-spacing: .5px;
}

.model-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.model-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e6ebf1;
  border-radius: 12px;
  padding: 14px 16px 16px;
  font-size: 13px;
  transition: .25s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.model-card:hover {
  box-shadow: 0 4px 14px rgba(50, 70, 120, .12);
  transform: translateY(-2px);
}

.mc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mc-name {
  font-weight: 600;
  font-size: 14px;
  color: #2c3e50;
}

.mc-desc {
  margin: 0;
  color: #607080;
  line-height: 1.4;
  min-height: 38px;
}

.mc-strength {
  font-size: 12px;
  color: #2c3e50;
  background: #eef3f9;
  padding: 6px 8px;
  border-radius: 6px;
  line-height: 1.3;
}

.prompt-box {
  background: #f8f9fb;
  border: 1px solid #e6ebf1;
  border-radius: 12px;
  padding: 10px 16px;
  font-family: Consolas, Menlo, monospace;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: -10px;
}

.final-recommend {
  display: grid;
  grid-template-columns: 1fr;
}

.reason-box {
  margin-top: 10px;
  background: #fff;
  border-left: 4px solid #52c41a;
  padding: 10px 12px;
  font-size: 12px;
  color: #34495e;
  border-radius: 8px;
  line-height: 1.5;
}

.eval-list {
  display: grid;
  gap: 14px;
}

.eval-item {
  border: 1px solid #e6ebf1;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fcfdff;
}

.eval-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.eval-name {
  font-weight: 600;
  color: #2c3e50;
}

@media (max-width:900px) {
  .model-grid {
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  }
}
</style>