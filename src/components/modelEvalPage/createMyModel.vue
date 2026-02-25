<template>
    <div class="page-container">
        <div class="header">
            <span> </span>
        </div>

        <div class="content">
            <div class="breadcrumb">
                <span class="breadcrumb-item" :class="{ completed: currentStep1 }">选择模型</span>
                <el-icon>
                    <ArrowRight />
                </el-icon>
                <span class="breadcrumb-item" :class="{ completed: currentStep2 }">选择评测集</span>
                <el-icon>
                    <ArrowRight />
                </el-icon>
                <span class="breadcrumb-item" :class="{ completed: currentStep3 }">选择指标</span>
            </div>

            <div class="form-section" v-if="currentStep1">
                <h3>模型类型</h3>
                <div class="radio-group">
                    <el-radio-group v-model="modeltype">
                        <el-radio value="self" size="large">自定义模型</el-radio>
                        <el-radio value="finished" size="large">预置模型</el-radio>
                    </el-radio-group>
                </div>
            </div>

            <div class="form-section" v-if="currentStep1 && modeltype === 'finished'">
                <!-- <h3>选择模型</h3>
                <div class="tree-select">
                    <el-tree-select v-model="value" :data="data" :render-after-expand="false"
                        style="width: 100%; max-width: 400px;" />
                </div> -->
            </div>

            <div class="form-section" v-if="currentStep1 && modeltype === 'self'">
                <h3>自定义模型</h3>
                <h4>模型来源</h4>
                <div class="radio-group">
                    <el-radio-group v-model="modelSource">
                        <el-radio value="newModel" size="large">新建api模型</el-radio>
                        <el-radio value="myModel" size="large">我的模型</el-radio>
                    </el-radio-group>

                </div>
                <!-- <div class="tree-select" v-if="modelSource === 'myModel'">
                    <el-tree-select v-model="value" :data="data" :render-after-expand="false"
                        style="width: 100%; max-width: 400px;" placeholder="还没写完" />
                </div> -->

                <div class="newModelChoice" v-if="modelSource === 'newModel'">
                    <h4>模型名称</h4>
                    <el-input v-model="modelName" style="margin-left: 160px; width: 500px" maxlength="60"
                        placeholder="请输入模型名称" show-word-limit type="text" />

                    <h4 style="color: dimgray;">API 参数支持 OpenAI 标准接口 API 模型</h4>

                    <div class="api-example-section">
                        <div class="example-header">
                            <el-icon class="code-icon">
                                <DocumentCopy />
                            </el-icon>
                            <span>API 调用示例</span>
                        </div>

                        <div class="code-tabs">
                            <div class="code-container">
                                <div class="code-header">
                                    <div class="language-info">
                                        <span class="language-dot"></span>
                                        <span class="language-name">{{codeTabs.find(t => t.key === activeTab)?.name
                                            }}</span>
                                    </div>
                                    <el-button size="small" text @click="copyCode" class="copy-btn">
                                        <el-icon>
                                            <DocumentCopy />
                                        </el-icon>
                                        复制代码
                                    </el-button>
                                </div>

                                <div class="code-content">
                                    <pre><code v-html="highlightedCode"></code></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <el-form :inline="true"  style="margin-left: 250px;">
                <el-form-item label="评测集" v-if="currentStep2">
                    <el-select v-model="selectedDatasetId" placeholder="选择评测集" filterable clearable
                        style="width: 240px">
                        <el-option v-for="opt in dsOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                </el-form-item>

                <el-form-item label="指标标准" v-if="currentStep3">
                    <el-select v-model="selectedStandardId" placeholder="选择指标标准" filterable clearable
                        style="width: 240px">
                        <el-option v-for="opt in stdOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                </el-form-item>
            </el-form>
        </div>

        <div class="footer">
            <el-button type="primary" size="large" class="btn-primary" @click="goNext1"
                v-if="currentStep1">下一步</el-button>
            <el-button type="primary" size="large" class="btn-primary" @click="goBack1"
                v-if="currentStep2">上一步</el-button>
            <el-button type="primary" size="large" class="btn-primary" @click="goNext2"
                v-if="currentStep2">下一步</el-button>
            <el-button type="primary" size="large" class="btn-primary" @click="goBack2"
                v-if="currentStep3">上一步</el-button>
            <el-button type="primary" size="large" class="btn-primary" @click="goEval"
                v-if="currentStep3">开始测评</el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loadDataSets, loadStandards, toDatasetOptions, toStandardOptions } from '@/utils/localData'

const router = useRouter()
const modeltype = ref('self')
const modelSource = ref('newModel')
const value = ref()
const currentStep1 = ref(true)
const currentStep2 = ref(false)
const currentStep3 = ref(false)
const modelName = ref('')
const activeTab = ref('python')

// 代码标签页配置
const codeTabs = [
    { key: 'python', name: 'Python', icon: 'Document' },
]

// 不同语言的代码示例
const codeExamples = {
    python: `# Required parameters
openai_api_base="Please input url",
key="Please input api token",
model="Please input model name",
# For non-commercial API model, any string can be filled in key

# Optional parameters
system_prompt = "",
temperature = 0,
max_tokens = 1024,
# optional value: "low" or "high"
img_detail = "high"`,
}

// 当前激活的代码
const currentCode = computed(() => {
    return codeExamples[activeTab.value as keyof typeof codeExamples] || codeExamples.python
})

// 简单的语法高亮
const highlightedCode = computed(() => {
    let code = currentCode.value

    // Python 语法高亮
    if (activeTab.value === 'python') {
        code = code
            .replace(/\b(import|from|def|class|if|else|elif|for|while|try|except|finally|with|as|return|yield|break|continue|pass|lambda|and|or|not|in|is|True|False|None)\b/g, '<span class="keyword">$1</span>')
            .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
            .replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>')
            .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
            .replace(/#.*$/gm, '<span class="comment">$&</span>')
    }
    return code
})

// 复制代码功能
const copyCode = async () => {
    try {
        await navigator.clipboard.writeText(currentCode.value)
        ElMessage.success('代码已复制到剪贴板')
    } catch (err) {
        ElMessage.error('复制失败')
    }
}

const dsOptions = ref([])
const stdOptions = ref([])

const selectedDatasetId = ref()
const selectedStandardId = ref()

onMounted(() => {
    dsOptions.value = toDatasetOptions(loadDataSets())
    stdOptions.value = toStandardOptions(loadStandards())
})

// const dataSetsData = [
//     {
//         value: '1',
//         label: 'Level one 1',
//     },
//     {
//         value: '2',
//         label: 'Level one 2',
//     },
//     {
//         value: '3',
//         label: 'Level one 3',
//     },
// ]

// const standardsData = [
//     {
//         value: '1',
//         label: 'Level one 1',
//     },
//     {
//         value: '2',
//         label: 'Level one 2',
//     },
//     {
//         value: '3',
//         label: 'Level one 3',
//     },
// ]

const goNext1 = () => {
    currentStep1.value = false
    currentStep2.value = true
}
const goNext2 = () => {
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
const goEval = () => {
    // 跳转到评测页面
    router.push('/main/examine-model')
    ElMessage.success('评测开始！')
}
</script>

<style scoped>
.page-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
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

.footer {
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
}

.btn-primary {
    padding: 12px 32px;
    border-radius: 8px;
    font-weight: 500;
}

.api-example-section {
    margin: 24px 0 0 20px;
    max-width: 600px;
}

.example-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    margin-left: 140px;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
}

.code-icon {
    color: #4361ee;
    font-size: 18px;
}

.code-tabs {
    background: white;
    margin-left: 140px;
    width: 500px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e1e4e8;
}

.tab-buttons {
    display: flex;
    background: #f8f9fa;
    border-bottom: 1px solid #e1e4e8;
}

.tab-button {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: transparent;
    color: #6c757d;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    position: relative;
}

.tab-button:hover {
    background: rgba(67, 97, 238, 0.05);
    color: #4361ee;
}

.tab-button.active {
    background: white;
    color: #4361ee;
    font-weight: 600;
}

.tab-button.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #4361ee;
}

.code-container {
    background: white;
}

.code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fafbfc;
    border-bottom: 1px solid #e1e4e8;
}

.language-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #586069;
}

.language-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4361ee;
}

.language-name {
    font-weight: 500;
}

.copy-btn {
    color: #586069;
    transition: color 0.2s ease;
}

.copy-btn:hover {
    color: #4361ee;
}

.code-content {
    padding: 20px;
    background: #ffffff;
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', Consolas, 'Liberation Mono', Menlo, monospace;
    overflow-x: auto;
    line-height: 1.6;
}

.code-content pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.code-content code {
    font-size: 14px;
    color: #24292e;
    font-weight: 400;
}

/* 语法高亮样式 */
:deep(.keyword) {
    color: #d73a49;
    font-weight: 600;
}

:deep(.string) {
    color: #032f62;
}

:deep(.number) {
    color: #005cc5;
}

:deep(.comment) {
    color: #6a737d;
    font-style: italic;
}

:deep(.flag) {
    color: #e36209;
    font-weight: 600;
}

:deep(.url) {
    color: #0366d6;
    text-decoration: underline;
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

/* 响应式设计 */
@media (max-width: 768px) {
    .api-example-section {
        margin-left: 0;
        max-width: 100%;
    }

    .input-group {
        margin-left: 0;
        max-width: 100%;
    }

    .api-info {
        margin-left: 0;
        max-width: 100%;
    }

    .radio-group,
    .tree-select {
        margin-left: 0;
    }

    .tab-button {
        font-size: 12px;
        padding: 10px 8px;
    }

    .code-content {
        padding: 16px;
        font-size: 13px;
    }
}
</style>