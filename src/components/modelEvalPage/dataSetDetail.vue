<template>
    <div class="dataset-detail">
        <!-- 顶部信息区域 -->
        <div class="header-section">
            <div class="dataset-header">
                <div class="header-left">
                    <div class="dataset-title-section">
                        <h1 class="dataset-title">
                            <el-icon class="title-icon">
                                <DataBoard />
                            </el-icon>
                            {{ datasetInfo.name }}
                        </h1>
                        <div class="dataset-meta">
                            <span class="meta-item">
                                <el-icon>
                                    <Calendar />
                                </el-icon>
                                创建时间：{{ datasetInfo.createTime }}
                            </span>
                        </div>
                    </div>

                    <!-- 标签区域 -->
                    <div class="tags-section">
                        <div class="tags-header">
                            <el-icon>
                                <CollectionTag />
                            </el-icon>
                            <span>应用场景</span>
                        </div>
                        <div class="tags-container">
                            <el-tag v-for="scene in datasetInfo.scenes" :key="scene" class="dataset-tag" type="primary"
                                effect="light">
                                <el-icon style="margin-right: 4px;">
                                    <PriceTag />
                                </el-icon>
                                {{ scene }}
                            </el-tag>
                            <span v-if="!datasetInfo.scenes || datasetInfo.scenes.length === 0"
                                style="color:#909399;">未设置</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 功能标签页 -->
        <div class="content-section">
            <el-tabs v-model="activeTab" class="dataset-tabs" @tab-change="handleTabChange">
                <!-- 数据集文件 -->
                <el-tab-pane label="数据集文件" name="files">
                    <template #label>
                        <div class="tab-label">
                            <el-icon>
                                <Folder />
                            </el-icon>
                            <span>数据集文件</span>
                        </div>
                    </template>
                    <div class="tab-content">
                        <div class="files-section">
                            <div class="files-toolbar" v-show="files.length === 0">


                                <div class="toolbar-left">
                                    <el-button type="primary" @click="uploadFile">
                                        <el-icon>
                                            <Upload />
                                        </el-icon>
                                        上传文件
                                    </el-button>
                                </div>
                            </div>

                            <div class="files-content">
                                <el-table :data="filteredFiles" border style="width: 100%">
                                    <el-table-column prop="name" label="文件名" >
                                        <template #default="scope">
                                            <div class="file-item">
                                                <el-icon class="file-icon">
                                                    <Document />
                                                </el-icon>
                                                <span>{{datasetInfo.name}}</span>
                                            </div>
                                        </template>
                                    </el-table-column>
                                    <el-table-column prop="size" label="文件大小" />
                                    <el-table-column prop="type" label="文件类型" />
                                    <el-table-column prop="updateTime" label="更新时间" />
                                    <el-table-column label="操作" >
                                        <template #default="scope">
                                            <!-- <el-button size="small" @click="previewFile(scope.row)">
                                                <el-icon>
                                                    <View />
                                                </el-icon>
                                                预览
                                            </el-button> -->
                                            <el-button size="small" @click="downloadFile(scope.row)">
                                                <el-icon>
                                                    <Download />
                                                </el-icon>
                                                下载
                                            </el-button>
                                            <el-button size="small" type="danger" @click="deleteFile(scope.row)">
                                                <el-icon>
                                                    <Delete />
                                                </el-icon>
                                                删除
                                            </el-button>
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>

                <!-- 设置 -->
                <el-tab-pane label="设置" name="settings">
                    <template #label>
                        <div class="tab-label">
                            <el-icon>
                                <Setting />
                            </el-icon>
                            <span>设置</span>
                        </div>
                    </template>
                    <div class="tab-content">
                        <div class="settings-section">
                            <!-- 基本信息设置 -->
                            <div class="setting-card">
                                <h3>
                                    <el-icon>
                                        <Document />
                                    </el-icon>
                                    基本信息设置
                                </h3>
                                <div class="setting-content">
                                    <el-form :model="settingsForm" label-width="120px" size="large">
                                        <el-form-item label="数据集名称" prop="name">
                                            <el-input v-model="settingsForm.name" placeholder="请输入数据集名称（3-50个字符）"
                                                maxlength="50" show-word-limit clearable />
                                        </el-form-item>


                                        <el-form-item label="应用场景">
                                            <div class="tags-container">
                                                <div class="recommended-tags">
                                                    <el-tag v-for="s in recommendedScenes" :key="s"
                                                        :class="{ selected: settingsForm.scenes.includes(s) }"
                                                        @click="toggleSettingScene(s)"
                                                        style="margin-right: 8px; margin-bottom: 8px; cursor: pointer;"
                                                        :type="settingsForm.scenes.includes(s) ? 'primary' : 'info'"
                                                        effect="plain">
                                                        {{ s }}
                                                    </el-tag>
                                                </div>
                                                <div class="selected-tags" v-if="settingsForm.scenes.length > 0">
                                                    <span class="tags-label">已选：</span>
                                                    <el-tag v-for="s in settingsForm.scenes" :key="s" closable
                                                        @close="removeSettingScene(s)" type="success"
                                                        style="margin-right: 8px; margin-bottom: 8px;">
                                                        {{ s }}
                                                    </el-tag>
                                                </div>
                                            </div>
                                        </el-form-item>

                                        <el-form-item label="数据集简介" prop="description">
                                            <el-input v-model="settingsForm.description" type="textarea" :rows="4"
                                                placeholder="请详细描述数据集的内容、用途和特点（选填）" maxlength="500" show-word-limit />
                                        </el-form-item>

                                        <!-- 替换原“数据集格式”表单项 -->
                                        <el-form-item label="数据集格式" prop="format">
                                            <el-radio-group v-model="settingsForm.format">
                                                <el-radio value="MCQ">选择题（MCQ）</el-radio>
                                                <el-radio value="QA">问答题（QA）</el-radio>
                                            </el-radio-group>
                                        </el-form-item>


                                    </el-form>
                                </div>
                            </div>



                            <!-- 危险操作 -->
                            <div class="setting-card danger">
                                <h3>
                                    <el-icon>
                                        <Warning />
                                    </el-icon>
                                    危险操作
                                </h3>
                                <div class="setting-content">
                                    <div class="danger-actions">
                                        <div class="danger-item">
                                            <div class="danger-info">
                                                <h4>删除数据集</h4>
                                                <p>此操作不可逆，将永久删除数据集及其所有数据</p>
                                            </div>
                                            <el-button type="danger" @click="confirmDelete">
                                                <el-icon>
                                                    <Delete />
                                                </el-icon>
                                                删除数据集
                                            </el-button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 操作按钮 -->
                            <div class="settings-actions">
                                <el-button @click="resetSettings">
                                    <el-icon>
                                        <RefreshLeft />
                                    </el-icon>
                                    重置设置
                                </el-button>
                                <el-button type="primary" @click="saveSettings" :loading="settingsSaving">
                                    <el-icon>
                                        <Check />
                                    </el-icon>
                                    保存设置
                                </el-button>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDataSetById, updateDataSet } from '@/utils/localData'
import request from '@/utils/request'


const router = useRouter()
const route = useRoute()
const activeTab = ref('files')
const resultFilter = ref('all')
const fileSearch = ref('')

// 介绍编辑相关状态
const isEditing = ref(false)
const saving = ref(false)
const settingsSaving = ref(false)
const newTag = ref('')
const newSettingTag = ref('')
const introduction = ref('')
const editingIntroduction = ref('')
const originalIntroduction = ref('')



function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return ''
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    let num = Number(bytes)
    while (num >= 1024 && i < units.length - 1) {
        num /= 1024
        i++
    }
    return `${num % 1 === 0 ? num : num.toFixed(2)} ${units[i]}`
}

// 更新的评测结果数据
const evaluationResults = ref([
    {
        modelName: 'GPT-4',
        evaluationTime: '2023-12-10 15:30:00',
        status: '已完成',
        average: 8.6,
        instruct_format: 9.2,
        instruct_args: 8.7,
        plan_str: 8.5,
        plan_json: 8.3,
        reason_str: 9.4,
        reason_json: 8.9,
        retrieve_str: 8.1,
        retrieve_json: 7.8,
        understand_str: 9.0,
        understand_json: 8.8,
        review_str: 8.2
    },
    {
        modelName: 'ChatGPT',
        evaluationTime: '2023-12-09 12:15:00',
        status: '已完成',
        average: 7.8,
        instruct_format: 8.5,
        instruct_args: 7.9,
        plan_str: 7.6,
        plan_json: 7.4,
        reason_str: 8.2,
        reason_json: 7.8,
        retrieve_str: 7.5,
        retrieve_json: 7.2,
        understand_str: 8.3,
        understand_json: 7.9,
        review_str: 7.7
    },
    {
        modelName: 'BERT-Base',
        evaluationTime: '2023-12-08 09:45:00',
        status: '已完成',
        average: 6.5,
        instruct_format: 6.8,
        instruct_args: 6.2,
        plan_str: 6.4,
        plan_json: 6.0,
        reason_str: 6.9,
        reason_json: 6.3,
        retrieve_str: 6.7,
        retrieve_json: 6.1,
        understand_str: 7.2,
        understand_json: 6.5,
        review_str: 6.8
    },
    {
        modelName: 'LLaMA 3',
        evaluationTime: '2023-12-11 14:20:00',
        status: '已完成',
        average: 8.1,
        instruct_format: 8.7,
        instruct_args: 8.2,
        plan_str: 8.0,
        plan_json: 7.8,
        reason_str: 8.6,
        reason_json: 8.1,
        retrieve_str: 7.7,
        retrieve_json: 7.5,
        understand_str: 8.5,
        understand_json: 8.0,
        review_str: 8.4
    },
    {
        modelName: 'Claude 3',
        evaluationTime: '2023-12-12 10:15:00',
        status: '已完成',
        average: 8.3,
        instruct_format: 9.0,
        instruct_args: 8.5,
        plan_str: 8.2,
        plan_json: 7.9,
        reason_str: 8.8,
        reason_json: 8.3,
        retrieve_str: 7.9,
        retrieve_json: 7.6,
        understand_str: 8.7,
        understand_json: 8.4,
        review_str: 8.5
    }
])

// 过滤评测结果
const filteredEvaluationResults = computed(() => {
    if (resultFilter.value === 'all') {
        return evaluationResults.value
    }

    const filterMap = {
        'gpt4': 'GPT-4',
        'chatgpt': 'ChatGPT',
        'bert': 'BERT-Base',
        'llama': 'LLaMA 3',
        'claude': 'Claude 3'
    }

    const targetModel = filterMap[resultFilter.value]
    return evaluationResults.value.filter(item => item.modelName === targetModel)
})

// 获取分数对应的颜色
const getScoreColor = (score) => {
    if (score >= 9) return '#67C23A' // 优秀 - 绿色
    if (score >= 7.5) return '#409EFF' // 良好 - 蓝色
    if (score >= 6) return '#E6A23C' // 一般 - 黄色
    return '#F56C6C' // 较差 - 红色
}

// 刷新结果
const refreshResults = () => {
    ElMessage.success('评测结果已刷新')
    // 这里可以添加实际的数据刷新逻辑
}

// 推荐标签
const recommendedScenes = ref([
    '文本分类', '情感分析', '阅读理解',
    '对话生成', '文本摘要', '机器翻译',
    '检索增强问答(RAG)',
    '数学推理', '链式思维(CoT)',
    '图像分类', '视觉问答'
])

// 评测集信息
const datasetInfo = reactive({
    name: '',
    direction: '',
    createTime: '2023-12-01 10:30:00',
    updateTime: '2023-12-15 14:20:00',
    format: 'MCQ', // 修改：默认选择题
    fileSize: '',
    dataCount: 10000,
    evaluationCount: 156,
    userCount: 42,
    rating: 4.8,
    scenes: [],
    description: '这是简介',
    publishTime: '2023-12-01 10:30:00'
})



// 文件列表
const files = ref([])

// 设置表单 - 包含与创建评测集相同的字段
const settingsForm = reactive({
    name: '这是数据集名字',
    direction: 'sentiment-analysis',
    description: '这是简介',
    scenes: [],
    publishTime: '2023-12-01 10:30:00',
    visibility: 'public',
    format: 'MCQ' // 新增：数据集格式
})

// 计算属性
const filteredFiles = computed(() => {
    if (!fileSearch.value) return files.value
    return files.value.filter(file =>
        file.name.toLowerCase().includes(fileSearch.value.toLowerCase())
    )
})


// 标签操作方法
const toggleSettingScene = (scene) => {
    const i = settingsForm.scenes.indexOf(scene)
    if (i > -1) settingsForm.scenes.splice(i, 1)
    else {
        if (settingsForm.scenes.length < 10) settingsForm.scenes.push(scene)
        else ElMessage.warning('最多只能选择10个应用场景')
    }
}
const removeSettingScene = (scene) => {
    const i = settingsForm.scenes.indexOf(scene)
    if (i > -1) settingsForm.scenes.splice(i, 1)
}



const handleTabChange = (tabName) => {
    console.log('切换到标签页:', tabName)
}

const handleEdit = () => {
    ElMessage.info('编辑功能开发中...')
}

const handleEvaluate = () => {
    ElMessage.info('开始评测功能开发中...')
}

const handleMoreAction = (command) => {
    switch (command) {
        case 'share':
            ElMessage.info('分享功能开发中...')
            break
        case 'export':
            ElMessage.info('导出功能开发中...')
            break
        case 'duplicate':
            ElMessage.info('复制功能开发中...')
            break
        case 'delete':
            confirmDelete()
            break
    }
}

const startNewEvaluation = () => {
    ElMessage.info('新建评测功能开发中...')
}



const uploadFile = () => {
    ElMessage.info('上传文件功能开发中...')
}

const downloadAll = () => {
    ElMessage.info('批量下载功能开发中...')
}

const previewFile = (file) => {
    ElMessage.info(`预览文件: ${file.name}`)
}

const downloadFile = (file) => {
    ElMessage.info(`下载文件: ${file.name}`)
}

const deleteFile = (file) => {
    ElMessageBox.confirm(`确定要删除文件 ${file.name} 吗？`, '确认删除', {
        type: 'warning'
    }).then(() => {
        ElMessage.success('删除成功')
    })
}

// 设置相关方法
const saveSettings = () => {
    if (!settingsForm.name || settingsForm.name.trim().length < 3) {
        ElMessage.error('评测集名称至少需要3个字符')
        return
    }
    if (!settingsForm.publishTime) {
        ElMessage.error('请选择发布时间')
        return
    }
    settingsSaving.value = true
    setTimeout(() => {
        datasetInfo.name = settingsForm.name
        datasetInfo.direction = settingsForm.direction
        datasetInfo.description = settingsForm.description
        datasetInfo.scenes = [...settingsForm.scenes]
        datasetInfo.publishTime = settingsForm.publishTime
        datasetInfo.format = settingsForm.format // 保存格式
        if (settingsForm.description !== introduction.value) {
            introduction.value = settingsForm.description
        }
        const now = new Date()
        datasetInfo.updateTime = now.toLocaleString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).replace(/\//g, '-')
        const id = route.params.id
        updateDataSet(id, {
            name: datasetInfo.name,
            direction: datasetInfo.direction,
            description: datasetInfo.description,
            scenes: datasetInfo.scenes,
            visibility: datasetInfo.visibility,
            publishTime: datasetInfo.publishTime,
            format: datasetInfo.format
        })
        settingsSaving.value = false
        ElMessage.success('设置已保存')
    }, 1500)
}

const resetSettings = () => {
    ElMessageBox.confirm('确定要重置设置吗？', '确认重置', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        settingsForm.name = datasetInfo.name
        settingsForm.direction = datasetInfo.direction
        settingsForm.description = datasetInfo.description
        settingsForm.scenes = [...datasetInfo.scenes]
        settingsForm.publishTime = datasetInfo.publishTime
        settingsForm.visibility = datasetInfo.visibility
        settingsForm.format = datasetInfo.format // 重置格式
        ElMessage.success('设置已重置')
    })
}

const confirmDelete = () => {
    ElMessageBox.confirm('此操作将永久删除该数据集，是否继续？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async() => {
        const res= await request({
          url: `/file/dataSets/${route.params.id}`,
          method: 'delete'
        })
        if (res.code!==200) {
          ElMessage.error(res?.msg || '删除数据集失败')
          return
        }
        ElMessage.success('删除成功')
        router.push('/main/my-dataset')
    })
}

async function fetchDatasetDetail() {
  const id = route.params.id
  if (!id) {
    ElMessage.error('缺少数据集ID')
    return
  }
  try {
    const res = await request({
      url: `/file/dataSets/${id}`,
      method: 'get'
    })
    if (res.code!==200) {
      ElMessage.error(res?.msg || '获取数据集失败')
      return
    }
    console.log('数据集详情:', res.data)
    const d = res.data
    datasetInfo.name = d.datasetName
    datasetInfo.direction = d.direction || ''
    datasetInfo.createTime = (d.createTime || '').replace('T', ' ').slice(0, 19)
    datasetInfo.updateTime = (d.updateTime || '').replace('T', ' ').slice(0, 19)
    datasetInfo.scenes = d.scenarioName ? d.scenarioName.split(',').map(s => s.trim()).filter(Boolean) : []
    datasetInfo.description = d.remark || ''
    datasetInfo.publishTime = datasetInfo.createTime
    datasetInfo.format = d.fileFormat?.toUpperCase() === 'APPLICATION/JSON' ? 'QA' : (d.fileFormat || 'MCQ')
    datasetInfo.fileSize = formatBytes(d.fileSize)
    datasetInfo.dataCount = d.sampleCount || 0

    // 同步到设置表单
    settingsForm.name = datasetInfo.name
    settingsForm.direction = datasetInfo.direction
    settingsForm.description = datasetInfo.description
    settingsForm.scenes = [...datasetInfo.scenes]
    settingsForm.publishTime = datasetInfo.publishTime
    settingsForm.format = d.contentFormat.toUpperCase() 

    // 文件（若后端返回文件列表可在此替换）
    files.value = Array.isArray(d.files)
      ? d.files.map(f => ({
          name: f.fileOriginalName || f.name || 'file',
          size: formatBytes(f.fileSize || f.size),
          type: f.fileFormat || f.type || '',
          updateTime: (f.updateTime || d.updateTime || '').replace('T', ' ').slice(0, 19)
        }))
      : [{
          name: d.minioObjectPath?.split('/').pop() || 'dataset.json',
          size: formatBytes(d.fileSize),
          type: d.fileFormat || 'JSON',
          updateTime: datasetInfo.updateTime
        }]
  } catch (e) {
    ElMessage.error(e?.message || '加载数据集失败')
  }
}

onMounted(() => {
  fetchDatasetDetail()
})
</script>

<style scoped>
.dataset-detail {
    max-width: 1900px;
    margin: 0 auto;
    padding: 24px;
    background: #fff;
    border-radius: 16px;
}

/* 头部区域 */
.header-section {
    background: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.dataset-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
}

.header-left {
    flex: 1;
}

.dataset-title-section {
    margin-bottom: 16px;
}

.dataset-title {
    font-size: 28px;
    font-weight: 700;
    color: #2c3e50;
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    gap: 12px;
}

.title-icon {
    font-size: 32px;
    color: #409eff;
}

.dataset-meta {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #6c757d;
    font-size: 14px;
}

.tags-section {
    margin-top: 16px;
}

.tags-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: #2c3e50;
    font-weight: 600;
}

.tag-count {
    margin-left: auto;
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.dataset-tag {
    border-radius: 8px;
    font-weight: 500;
}

.header-actions {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.action-btn {
    border-radius: 10px;
    font-weight: 500;
}

/* 内容区域 */
.content-section {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.dataset-tabs {
    padding: 0;
}

:deep(.el-tabs__header) {
    margin: 0;
    background: #f8f9fa;
    padding: 0 24px;
    border-bottom: 1px solid #e9ecef;
}

:deep(.el-tabs__nav-wrap) {
    padding: 0;
}

:deep(.el-tabs__item) {
    padding: 20px 24px;
    font-size: 16px;
    font-weight: 500;
}

.tab-label {
    display: flex;
    align-items: center;
    gap: 8px;
}

.tab-content {
    padding: 24px;
}

/* 介绍页面 */
.intro-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.intro-card {
    border: 1px solid #e9ecef;
    border-radius: 12px;
    overflow: hidden;
}

.intro-card h3 {
    background: #f8f9fa;
    padding: 16px 20px;
    margin: 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid #e9ecef;
}

/* 介绍编辑区域样式 */
.intro-header {
    background: #f8f9fa;
    padding: 16px 20px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.intro-header h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    padding: 0;
    border: none;
}

.intro-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.edit-actions {
    display: flex;
    gap: 8px;
}

.intro-content {
    padding: 20px;
}

.edit-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.intro-textarea {
    width: 100%;
}

:deep(.intro-textarea .el-textarea__inner) {
    border-radius: 8px;
    font-family: inherit;
    line-height: 1.6;
    resize: vertical;
}

.edit-tips {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #6c757d;
    font-size: 13px;
    background: #f8f9fa;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.display-section {
    min-height: 120px;
}

.introduction-content {
    background: #fafafa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 16px;
}

.introduction-text {
    color: #495057;
    line-height: 1.8;
    margin: 0;
    font-family: inherit;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 14px;
}

.empty-introduction {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    background: #fafafa;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
}

.empty-icon {
    font-size: 48px;
    color: #d9d9d9;
    margin-bottom: 16px;
}

.empty-text {
    color: #8c8c8c;
    font-size: 16px;
    margin: 0 0 8px 0;
    font-weight: 500;
}

.empty-desc {
    color: #bfbfbf;
    font-size: 13px;
    margin: 0;
    line-height: 1.4;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.info-item {
    display: flex;
    align-items: center;
}

.info-label {
    font-weight: 500;
    color: #6c757d;
    min-width: 100px;
}

.info-value {
    color: #2c3e50;
    font-weight: 500;
}

.description-text {
    color: #495057;
    line-height: 1.6;
    margin: 0;
}

/* 评测结果表格样式 */
.results-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.results-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8f9fa;
    border-radius: 8px;
}

.toolbar-left {
    display: flex;
    gap: 12px;
}

.toolbar-right {
    display: flex;
    gap: 12px;
    align-items: center;
}

.results-content {
    background: white;
    border-radius: 8px;
    overflow: hidden;
}

.score-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 4px 0;
}

.score-value {
    font-weight: 700;
    font-size: 14px;
    color: #2c3e50;
    text-align: center;
}

/* 表格样式优化 */
:deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
}

:deep(.el-table .el-table__header-wrapper th) {
    background-color: #f8f9fa;
    color: #2c3e50;
    font-weight: 600;
}

:deep(.el-table .el-table__body-wrapper tr:hover td) {
    background-color: #f0f9ff;
}

:deep(.el-progress-bar__outer) {
    border-radius: 4px;
    background-color: #e9ecef;
}

:deep(.el-progress-bar__inner) {
    border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .results-toolbar {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
    }

    .toolbar-right {
        justify-content: flex-end;
    }
}

/* 结果和文件页面 */
.results-section,
.files-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.results-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8f9fa;
    border-radius: 8px;
}

.toolbar-left {
    display: flex;
    gap: 12px;
}

.file-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.file-icon {
    color: #409eff;
}

/* 设置页面 */
.settings-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.setting-card {
    border: 1px solid #e9ecef;
    border-radius: 12px;
    overflow: hidden;
}

.setting-card.danger {
    border-color: #f56c6c;
}

.setting-card h3 {
    background: #f8f9fa;
    padding: 16px 20px;
    margin: 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid #e9ecef;
}

.setting-card.danger h3 {
    background: #fef0f0;
    color: #f56c6c;
    border-bottom-color: #fbc4c4;
}

.setting-content {
    padding: 20px;
}

.danger-actions {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.danger-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #fef0f0;
    border-radius: 8px;
    border: 1px solid #fbc4c4;
}

.danger-info h4 {
    margin: 0 0 4px 0;
    color: #f56c6c;
    font-size: 16px;
}

.danger-info p {
    margin: 0;
    color: #6c757d;
    font-size: 14px;
}

.settings-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 20px;
    border-top: 1px solid #e9ecef;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .stats-cards {
        grid-template-columns: repeat(2, 1fr);
    }

    .info-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {

    .dataset-header {
        flex-direction: column;
        gap: 16px;
    }

    .header-actions {
        width: 100%;
        justify-content: flex-end;
    }

    .stats-cards {
        grid-template-columns: 1fr;
    }

    .results-toolbar,
    .files-toolbar {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
    }

    .danger-item {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
    }

    .intro-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
    }

    .edit-actions {
        justify-content: flex-end;
    }
}
</style>