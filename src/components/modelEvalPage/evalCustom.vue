<template>
    <div class="page-container">

        <div class="content">
            <div class="breadcrumb">
                <span class="breadcrumb-item" :class="{ completed: currentStep1 }">选择模型</span>
                <el-icon>
                    <ArrowRight />
                </el-icon>
                <span class="breadcrumb-item" :class="{ completed: currentStep2 }">选择数据集</span>
                <el-icon>
                    <ArrowRight />
                </el-icon>
                <span class="breadcrumb-item" :class="{ completed: currentStep3 }">选择指标</span>
            </div>

            <!-- 第一步：模型选择 + 新建模型（整合 createModel.vue 内容） -->
            <div v-if="currentStep1">
                <div class="form-section" style="margin-bottom:8px;">
                    <h3>项目名称</h3>
                    <div class="radio-group">
                        <el-input v-model="taskName" placeholder="请输入项目名称" style="width:500px;" required/>
                    </div>
                </div>
                <!-- <div class="form-section" style="margin-bottom:8px;">
                    <h3>模型类型</h3>
                    <div class="radio-group">
                        <el-radio-group v-model="modeltype">
                            <el-radio value="self" size="large">自定义模型</el-radio>
                            <el-radio value="finished" size="large">预置模型</el-radio>
                        </el-radio-group>
                    </div>
                </div> -->

                <!-- 预置模型（占位） -->
                <!-- <div class="form-section" v-if="modeltype === 'finished'">
                    <h4 style="margin-left:160px;color:#666;">（预置模型选择区域，待实现）</h4>
                </div> -->

                <!-- 自定义模型 -->
                <div v-if="modeltype === 'self'" class="form-section">
                    <!-- <h3 style="margin-bottom:8px;">自定义模型</h3> -->
                    <h3 style="margin-bottom:8px;">模型来源</h3>

                    <!-- 选择已有模型 -->
                    <div class="tree-select">
                        <el-select v-model="selectedExistingModelId" placeholder="选择我的模型" style="width:500px;"
                            filterable clearable required>
                            <el-option v-for="m in myModelOptions" :key="m.value" :label="m.label" :value="m.value" />
                        </el-select>
                    </div>


                    <!-- /newModelChoice -->
                </div>
            </div>

            <!-- 第二步：选择评测集 -->
            <el-form :inline="true" style="margin-left:290px;" v-if="currentStep2">
                <el-form-item label="数据集">
                    <el-select v-model="selectedDatasetIds" multiple collapse-tags-tooltip placeholder="选择数据集(可多选)"
                        filterable clearable style="width:260px ;margin-left: 12px;">
                        <el-option v-for="opt in dsOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                </el-form-item>

                <el-form-item label="应用场景">
                    <el-select v-model="selectedScenario" placeholder="选择应用场景" style="width:240px" clearable filterable>
                        <el-option v-for="sc in scenarioOptions" :key="sc" :label="sc" :value="sc" />
                    </el-select>
                </el-form-item>
            </el-form>

            <!-- 第三步：选择指标标准 -->
            <el-form :inline="true" style="margin-left:290px;" v-if="currentStep3">
                <el-form-item label="指标">
                    <el-select v-model="selectedStandardId" placeholder="选择指标" filterable clearable multiple
                        style="width:240px">
                        <el-option v-for="opt in stdOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                </el-form-item>
            </el-form>
        </div>

        <div class="footer">
            <el-button type="primary" size="large" class="btn-primary" @click="goCreateModel" v-if="currentStep1"
                style="margin-left: 200px;">新建模型</el-button>
            <el-button type="primary" size="large" class="btn-primary" @click="goNext1" v-if="currentStep1"
                style="margin-left: 200px;">下一步</el-button>
            <el-button type="primary" size="large" class="btn-primary" @click="goBack1"
                v-if="currentStep2">上一步</el-button>
            <el-button type="primary" size="large" class="btn-primary" @click="goNext2"
                v-if="currentStep2">下一步</el-button>
            <el-button type="primary" size="large" class="btn-primary" @click="goBack2"
                v-if="currentStep3">上一步</el-button>
            <el-button type="primary" size="large" class="btn-primary" @click="goEval" v-if="currentStep3"
                :loading="evaluating" :disabled="evaluating">开始测评</el-button>
        </div>

        <!-- 第三步交互信息提示 -->
        <!-- <div v-if="currentStep3 && evaluating" style="margin-top: 8px; display:flex; justify-content:center;">
            <el-alert type="info" :closable="false" show-icon title="正在创建评测任务，请稍候..." />
        </div> -->
    </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loadDataSets, toDatasetOptions, } from '@/utils/localData'
import { getModels } from '@/utils/modelLocalData'
import { getMetricSets } from '@/utils/localData'   // 新增：确保真正读取 metric_sets_v1
import { useRoute } from 'vue-router'
import request from '@/utils/request'


const route = useRoute()
const router = useRouter()
const taskName = ref('')
const evaluating = ref(false)

// 评测任务本地存储 Key
const EVAL_TASK_KEY = 'evaluationTasks'
const PROJECTS_STORAGE_KEY = 'MODEL_EVAL_PROJECTS_V1'   // 新增：项目本地存储键

function loadEvalTasks() {
    try { return JSON.parse(localStorage.getItem(EVAL_TASK_KEY) || '[]') } catch { return [] }
}
function saveEvalTask(task) {
    const list = loadEvalTasks()
    list.unshift(task)
    localStorage.setItem(EVAL_TASK_KEY, JSON.stringify(list))
}

// 步骤
const currentStep1 = ref(true)
const currentStep2 = ref(false)
const currentStep3 = ref(false)

// 模型来源
const modeltype = ref('self')
const modelSource = ref('newModel')

// 已有模型
const selectedExistingModelId = ref()
const myModelOptions = ref([])



// 新建模型表单
const modelFormRef = ref()
const modelForm = ref({
    modelName: '',
    modelType: 'api',
    openai_api_base: '',
    apiKey: '',
    apiModel: '',
    system_prompt: '',
    temperature: 0.7,
    max_tokens: 1024,
    img_detail: 'high',
    description: ''
})
// 顶层模型类型（来自 examineModel 选择：language / multimodal / code）
const topModelType = ref(route.query.modelType || 'language')
// 构造任务名时的类型前缀映射
const typeNameMap = {
    language: '语言',
    multimodal: '多模态',
    code: '代码'
}



const isCustomEditing = ref(false)
const customCode = ref('')

const parseCustomCode = () => {
    const code = customCode.value
    const getVal = re => {
        const m = code.match(re)
        return m ? m[1].trim() : ''
    }
    const base = getVal(/openai_api_base\s*=\s*["']([^"']+)["']/)
    const mdl = getVal(/model\s*=\s*["']([^"']+)["']/)
    const temp = getVal(/temperature\s*=\s*([0-9.]+)/)
    const maxT = getVal(/max_tokens\s*=\s*([0-9]+)/)
    if (base) modelForm.value.openai_api_base = base
    if (mdl) modelForm.value.apiModel = mdl
    if (temp && !isNaN(+temp)) modelForm.value.temperature = +temp
    if (maxT && !isNaN(+maxT)) modelForm.value.max_tokens = +maxT
}

// 数据集 / 指标 
const dsOptions = ref([])
const stdOptions = ref([])

const scenarioOptions = ref([])
const selectedScenario = ref('')


const selectedDatasetIds = ref([])          // 多选数组
const selectedStandardId = ref()

const fetchDatasets = async () => {
  try {
    const res = await request({
      url: '/file/dataSets/all',
      method: 'get'
    })
    if (res.code === 200) {
      const rawList = Array.isArray(res?.data) ? res.data : []
      // 仅保留审核通过的数据集（isValidated: true/1/'1'）
      const approved = rawList.filter(it =>  it?.isValidated === 1 )
      dsOptions.value = approved.map(item => ({
        label: item.datasetName,
        value: item.evalDatasetId,
        raw: item
      }))

      // 由“审核通过”的数据集生成场景选项
      const scenarios = new Set(approved.map(it => it.scenarioName).filter(Boolean))
      scenarioOptions.value = scenarios.size ? [...scenarios] : ['问答', '摘要', '翻译', '代码生成', '对话', '教育内容', '其他']
      selectedScenario.value = scenarioOptions.value[0] || ''

      // 清理已选中但未通过审核或已不存在的项
      const validIds = new Set(dsOptions.value.map(o => o.value))
      selectedDatasetIds.value = (selectedDatasetIds.value || []).filter(id => validIds.has(id))

      if (!dsOptions.value.length) {
        ElMessage.warning('暂无审核通过的数据集可选')
      }
    } else {
      dsOptions.value = []
      ElMessage.error(res?.msg || '获取数据集失败')
    }
  } catch (err) {
    dsOptions.value = []
    ElMessage.error(err?.message || '获取数据集失败')
  }
}

const fetchStandards = async () => {
  try {
    const res = await request({
      url: '/standard/listCombinationStandards',
      method: 'get'
    })
    if (res.code === 200) {
      const rawList = Array.isArray(res?.data) ? res.data : []
      // 仅保留审核通过的指标
      const approved = rawList.filter(it =>  it?.isValidated === 1 )

      stdOptions.value = approved.map(item => ({
        label: item.recombinationStandardName || `指标-${item.recombinationStandardId}`,
        value: item.recombinationStandardId,
        metricType: 'composite',
        metrics: item.singleStandards || [],
        raw: item
      }))

      // 清理已选中但未通过审核或已不存在的项（多选）
      if (Array.isArray(selectedStandardId.value)) {
        const validIds = new Set(stdOptions.value.map(o => o.value))
        selectedStandardId.value = selectedStandardId.value.filter(id => validIds.has(id))
      } else if (selectedStandardId.value) {
        const ok = stdOptions.value.some(o => o.value === selectedStandardId.value)
        if (!ok) selectedStandardId.value = undefined
      }

      if (!stdOptions.value.length) {
        ElMessage.warning('暂无审核通过的指标可选')
      }
    } else {
      stdOptions.value = []
      ElMessage.error(res?.msg || '获取指标失败')
    }
  } catch (err) {
    stdOptions.value = []
    ElMessage.error(err?.message || '获取指标失败')
  }
}

const fetchModels = async () => {
    try {
        const res = await request({
            url: '/aiModel/selectModel',
            method: 'get'
        })
        const ok = res?.code === 0 || res?.code === 200
        const list = ok && Array.isArray(res?.data) ? res.data : []
        myModelOptions.value = list.map(m => ({
            label: m.modelName || `模型-${m.modelInfoId}`,
            value: m.modelInfoId,
            full: m
        }))
    } catch (e) {
        myModelOptions.value = []
        ElMessage.error(e?.message || '获取模型失败')
    }
}

onMounted(async () => {
    await Promise.all([
        fetchDatasets(),
        fetchStandards(),
        fetchModels()
    ])

    try {
        const models = getModels()
        myModelOptions.value = models.map(m => ({ label: m.modelName, value: m.id, full: m }))
    } catch { }
})

// 步骤
const goCreateModel = () => {
    router.push({ path: '/main/my-model/create' })
}
const goNext1 = async () => {
    if (!taskName.value.trim()) {
        ElMessage.error('请填写项目名称')
        return
    }
    if (!selectedExistingModelId.value) {
        ElMessage.error('请选择模型')
        return
    }
    if (modeltype.value === 'self' && modelSource.value === 'newModel') {
        try {
            await modelFormRef.value?.validate?.()
            if (isCustomEditing.value) parseCustomCode()
        } catch {
            ElMessage.error('请先完成模型表单校验')
            return
        }
    }
    currentStep1.value = false
    currentStep2.value = true
}
const goNext2 = () => {
    if (!selectedDatasetIds.value.length) {
        ElMessage.error('请选择数据集')
        return
    }
    currentStep2.value = false
    currentStep3.value = true
}
const goBack1 = () => {
    currentStep1.value = true
    currentStep2.value = false
}
const goBack2 = () => {
    currentStep2.value = true
    currentStep3.value = false
}

// 保存评测任务
function buildTask() {
    let modelName = ''
    let modelTypeShow = ''
    let temperature = ''
    let max_tokens = ''
    let base = ''
    let existingModelId = null
    if (modeltype.value === 'self') {
        if (modelSource.value === 'newModel') {
            modelName = modelForm.value.modelName || '未命名模型'
            modelTypeShow = modelForm.value.modelType === 'api' ? 'API' : 'LOCAL'
            temperature = modelForm.value.temperature
            max_tokens = modelForm.value.max_tokens
            base = modelForm.value.openai_api_base
        } else {
            const found = myModelOptions.value.find(m => m.value === selectedExistingModelId.value)
            modelName = found ? found.label : '我的模型'
            modelTypeShow = 'EXISTING'
            existingModelId = selectedExistingModelId.value || null
        }
    } else {
        modelName = '预置模型'
        modelTypeShow = 'PRESET'
    }
    const typePrefix = `[${typeNameMap[topModelType.value] || '模型'}]`
    const dsObjs = dsOptions.value.filter(d => selectedDatasetIds.value.includes(d.value))
    const dsLabels = dsObjs.map(d => d.label).join(', ')
    const firstDs = dsObjs[0]?.label || '数据集'
    const taskName1 = taskName.value.trim() || `${typePrefix}基于${firstDs}的模型评测任务`
    const stdObj = stdOptions.value.find(s => s.value === selectedStandardId.value) || {}

    return {
        id: Date.now(),
        name: taskName1,
        topModelType: topModelType.value,
        model: modelName,
        type: modelTypeShow,
        modelTypeRaw: modelForm.value.modelType,
        existingModelId,
        evaluationset: dsLabels,          // 展示
        datasetIds: [...selectedDatasetIds.value], // 多选ID保存
        standard: stdObj.label || '',
        standardId: selectedStandardId.value || null,
        scenario: selectedScenario.value,
        temperature,
        max_tokens,
        base,
        createdAt: new Date().toISOString()
    }
}
function loadStoredProjects() {
    try { return JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || '[]') } catch { return [] }
}
function saveStoredProjects(list) {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(list))
}
const goEval = async () => {
    if (evaluating.value) return // 防重复点击
    if(!selectedStandardId.value || selectedStandardId.value.length === 0) {
        ElMessage.error('请选择评测指标')
        return
    }
    if (modeltype.value === 'self' && modelSource.value === 'newModel') {
        try {
            await modelFormRef.value?.validate?.()
            if (isCustomEditing.value) parseCustomCode()
        } catch {
            ElMessage.error('模型表单未通过')
            return
        }
    }

    evaluating.value = true
    ElMessage.success('评测任务创建中，请稍后...')
    const task = buildTask()
    saveEvalTask(task)

    const dsObjs = dsOptions.value.filter(d => selectedDatasetIds.value.includes(d.value))
    const dsNames = dsObjs.map(d => d.label).join(', ')
    const stdObjs = stdOptions.value.filter(s => selectedStandardId.value.includes(s.value))
    const stdNames = stdObjs.map(s => s.label).join(', ')
    const scenarioNameStr = selectedScenario.value || ''
    // const modelInfoId = task.existingModelId ?? 0

    try {
        await request({
            url: '/evalTask/insertEvalTask',
            method: 'post',
            params: {
                taskName: task.name,
                // modelInfoId,
                modelName: task.model,
                scenarioName: scenarioNameStr,
                standardName: stdNames,
                datasetName: dsNames
            }
        })
    } catch (err) {
        ElMessage.error(err?.message || '创建评测任务失败')
        return
    } finally {
        evaluating.value = false
    }

    const projects = loadStoredProjects()
    if (!projects.find(p => p.id === task.id)) {
        const now = new Date().toLocaleString('zh-CN')
        projects.unshift({
            id: task.id,
            name: task.name,
            type: '模型评测',
            category: 'model-eval',
            description: `${task.model} | 数据集: ${task.evaluationset}${task.standard ? ' | 指标: ' + task.standard : ''}`,
            status: 'running',
            createTime: now,
            updateTime: now,
            datasetCount: task.datasetIds?.length || 0,
            modelCount: 1,
            memberCount: 1,
            completedEvaluations: 0,
            totalEvaluations: 0,
            averageScore: null,
            isFavorite: false,
            taskRef: task.id
        })
        saveStoredProjects(projects)
    }

    ElMessage.success('评测任务已创建，跳转中...')
    router.push({ path: '/main/model-project-list' })
}
</script>

<style scoped>
.page-container {
    max-width: 900px;
    /* margin: 0 auto; */
    margin-left: 15%;
    padding: 40px 20px 60px;
}

.content {
    margin-bottom: 40px;
}

.breadcrumb {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 40px;
    font-size: 16px;
}

.breadcrumb-item {
    color: #8b949e;
    transition: color 0.2s ease;
    font-weight: 500;
}

.breadcrumb-item.completed {
    color: #1a87e0;
    font-weight: 600;
}

.form-section {
    margin-left: 125PX;
    margin-bottom: 32px;
}

.form-section h3 {
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
    margin: 0px 0px 16px 160px;
}

.form-section h4 {
    color: #2c3e50;
    font-size: 16px;
    margin: 0px 0px 16px 160px;
}

.radio-group {
    padding-left: 160px;
}

.tree-select {
    padding-left: 160px;
}

.base-form {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 12px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
}

.inline-val {
    display: inline-block;
    width: 40px;
    text-align: center;
    font-size: 13px;
    color: #555;
    margin-left: 8px;
}

/* 参数说明卡片 */
.param-hint-card {
    margin: 18px 0 26px 160px;
    width: 540px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 18px;
    font-size: 13px;
    line-height: 1.5;
    color: #334155;
}

.param-hint-card ul {
    margin: 6px 0 0 18px;
    padding: 0;
}

.param-hint-card li {
    margin: 2px 0;
}

/* 代码块（来自 createModel 样式） */
.code-block-wrapper {
    position: relative;
    background: #1e1e1e;
    color: #eee;
    border-radius: 12px;
    padding: 14px 14px 18px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
    margin-bottom: 30px;
    font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
}

.merged-wrapper {
    margin-left: 80px;
    width: 100%;
}

.code-toolbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    align-items: center;
    color: #dcdcdc;
    font-size: 14px;
}

.code-toolbar .left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.code-view {
    max-height: 520px;
    overflow: auto;
    white-space: pre;
    line-height: 1.45;
    font-size: 13px;
    padding: 6px 4px;
}

.editable-code :deep(textarea),
.editable-code {
    font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
}

.editable-code :deep(textarea) {
    background: #141414;
    color: #ddd;
    border: 1px solid #333;
    resize: vertical;
    line-height: 1.45;
    font-size: 13px;
    padding: 10px;
}

.parse-hint {
    margin-top: 6px;
    font-size: 12px;
    color: #ffa94d;
}

/* 语法高亮 */
.keyword {
    color: #c792ea;
}

.string {
    color: #a5e075;
}

.comment {
    color: #5c6370;
    font-style: italic;
}

.footer {
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: center;
    gap: 12px;
}

.btn-primary {
    padding: 12px 32px;
    border-radius: 8px;
    font-weight: 500;
}

/* 响应式 */
@media (max-width: 900px) {

    .form-section h3,
    .form-section h4,
    .radio-group,
    .tree-select,
    .merged-wrapper,
    .param-hint-card {
        margin-left: 0;
        width: 100%;
        padding-left: 0;
    }

    .base-form {
        margin-left: 0 !important;
        width: 100% !important;
    }
}
</style>