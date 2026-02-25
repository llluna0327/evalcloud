<template>
    <div class="page-container">
        <!-- 页面头部 -->
        <div class="content-header">
            <div class="header-left">
                <h1 class="page-title">创建数据集</h1>
                <p class="page-subtitle">创建自定义评测数据集，用于模型性能评估</p>
            </div>
            <div class="btn-group">
                <el-button size="large" class="btn-outline" @click="goBack">
                    <el-icon style="margin-right: 5px;">
                        <ArrowLeft />
                    </el-icon>
                    返回列表
                </el-button>
                <el-button size="large" class="btn-outline">
                    <el-icon style="margin-right: 5px;">
                        <QuestionFilled />
                    </el-icon>
                    帮助
                </el-button>
            </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="main-content">
            <!-- 左侧表单区域 -->
            <div class="form-panel">
                <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" size="large">
                    <!-- 基本信息 -->
                    <div class="form-section">
                        <div class="section-header">
                        </div>
                        <div class="section-content">
                            <el-form-item label="数据集名称" prop="name">
                                <el-input v-model="formData.name" placeholder="请输入数据集名称（3-50个字符）" maxlength="50"
                                    show-word-limit clearable />
                            </el-form-item>

                            <el-form-item label="数据集描述" prop="description">
                                <el-input v-model="formData.description" type="textarea" :rows="4"
                                    placeholder="请详细描述数据集的内容、用途和特点（选填）" maxlength="500" show-word-limit />
                            </el-form-item>
                        </div>
                        <div class="section-content">
                            <el-form-item label="应用场景">
                                <div class="tags-container">
                                    <div class="recommended-tags">

                                        <el-tag v-for="s in recommendedScenes" :key="s"
                                            :class="{ selected: formData.scenes.includes(s) }" @click="toggleScene(s)"
                                            style="margin-right: 8px; margin-bottom: 8px; cursor: pointer;"
                                            :type="formData.scenes.includes(s) ? 'primary' : 'info'" effect="plain">
                                            {{ s }}
                                        </el-tag>
                                    </div>

                                    <!-- <div class="selected-tags" v-if="formData.scenes.length > 0">
                                        <span class="tags-label">已选：</span>
                                        <el-tag v-for="s in formData.scenes" :key="s" closable @close="removeScene(s)"
                                            type="success" style="margin-right: 8px; margin-bottom: 8px;">
                                            {{ s }}
                                        </el-tag>
                                    </div> -->
                                </div>
                            </el-form-item>
                        </div>
                        <div class="section-content">
                            <!-- <el-form-item label="发布时间" prop="publishTime" style="margin-top: -50px;">
                                <el-date-picker v-model="formData.publishTime" type="datetime" placeholder="选择发布时间"
                                    format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss"
                                    style="width: 100%" />
                            </el-form-item> -->

                            <el-form-item label="格式" prop="format">
                                <el-radio-group v-model="formData.format">
                                    <el-radio value="mcq">
                                        <div class="radio-option">
                                            <div>
                                                <div class="option-title">选择题（MCQ）</div>
                                                <div class="option-desc">适合用户是选择题的场景，评测指标为准确率（accuracy）。</div>
                                            </div>
                                        </div>
                                    </el-radio>
                                    <el-radio value="qa">
                                        <div class="radio-option">
                                            <div>
                                                <div class="option-title">问答题格式（QA）</div>
                                                <div class="option-desc">支持有参考答案和无参考答案两种问答题格式。</div>
                                            </div>
                                        </div>
                                    </el-radio>
                                </el-radio-group>
                            </el-form-item>

                            <el-form-item label="数据集文件" prop="files" style="margin-top: 50px;">
                                <el-upload class="upload-area" drag multiple :limit="5"
                                    v-model:file-list="uploadFileList" :http-request="handleUpload"
                                    :before-upload="beforeUpload" :on-remove="handleRemove" :on-exceed="handleExceed"
                                    :on-preview="handlePreview" :accept="accept" :show-file-list="true">
                                    <div class="el-upload__text">
                                        将文件拖到此处，或
                                        <em>点击上传</em>
                                    </div>
                                    <template #tip>
                                        <div class="el-upload__tip">
                                            支持 CSV / JSONL ，单文件不超过 20MB，最多 5 个文件。
                                        </div>
                                    </template>
                                </el-upload>
                            </el-form-item>
                        </div>
                        <div class="footer-content">
                            <div class="footer-info">
                                <el-icon>
                                    <InfoFilled />
                                </el-icon>
                                <span>请确保所有必要信息已填写完整，创建后可在"我的数据集"中管理</span>
                            </div>
                            <div class="footer-actions">
                                <el-button size="large" @click="resetForm">
                                    <el-icon>
                                        <RefreshLeft />
                                    </el-icon>
                                    重置表单
                                </el-button>
                                <el-button type="primary" size="large" @click="createDataset" :loading="loading">
                                    创建评测集
                                </el-button>
                            </div>
                        </div>
                    </div>
                </el-form>
            </div>

            <!-- 右侧预览面板 -->
            <div class="preview-panel">
                <!-- 信息预览 -->
                <div class="preview-section">
                    <div class="preview-header">
                        <h3>
                            <el-icon>
                                <View />
                            </el-icon>
                            信息预览
                        </h3>
                    </div>
                    <div class="preview-content">
                        <div class="preview-card">
                            <div class="card-header">
                                <h4>{{ formData.name || '评测集名称' }}</h4>
                                <!-- <el-tag :type="getDirectionTagType(formData.direction)">
                                    {{ getDirectionLabel(formData.direction) || '未选择方向' }}
                                </el-tag> -->
                            </div>
                            <div class="card-content">
                                <p class="description">
                                    {{ formData.description || '暂无描述' }}
                                </p>
                                <div class="meta-info">
                                    <!-- <div class="meta-item">
                                        <el-icon>
                                            <Calendar />
                                        </el-icon>
                                        <span>{{ formData.publishTime || '未设置发布时间' }}</span>
                                    </div> -->
                                    <div class="meta-item">
                                        <el-icon>
                                            <View />
                                        </el-icon>
                                        <span>{{ getFormatLabel(formData.format) }}</span>
                                    </div>
                                </div>
                                <div class="tags-preview" v-if="formData.scenes.length > 0">
                                    <el-tag v-for="s in formData.scenes" :key="s" size="small"
                                        style="margin-right: 4px; margin-bottom: 4px;">
                                        {{ s }}
                                    </el-tag>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { addDataSet } from '@/utils/localData'
import { useUserStore } from '@/stores/user'


const userStore = useUserStore()
const router = useRouter()
const formRef = ref()
const loading = ref(false)
const newTag = ref('')


// 上传相关
const accept = '.csv,.jsonl,.json'
const maxSizeMB = 20
const uploadFileList = ref([]) // Element Plus 文件列表

// 表单数据
const formData = reactive({
    name: '',
    // direction: '',
    description: '',
    scenes: [],
    publishTime: '',
    format: 'mcq',
    files: [],
    minioBucket:'',
    minioObjectPath:'',
    fileFormat:'',
    fileSize:ref(0)
})

// 表单验证规则
const rules = {
    name: [
        { required: true, message: '请输入评测集名称', trigger: 'blur' },
        { min: 3, max: 50, message: '名称长度在 3 到 50 个字符', trigger: 'blur' }
    ],
    direction: [
        { required: true, message: '请选择评测方向', trigger: 'change' }
    ],
    publishTime: [
        { required: true, message: '请选择发布时间', trigger: 'change' }
    ],
    format: [
        { required: true, message: '请选择格式（选择题/问答题）', trigger: 'change' }
    ],
    files: [
        {
            validator: (_r, _v, cb) => {
                if (!formData.files || formData.files.length === 0) cb(new Error('请上传评测集文件'))
                else cb()
            },
            trigger: 'change'
        }
    ]
}

// 校验类型与大小
const beforeUpload = (file) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    const allow = accept.split(',').map(s => s.trim())
    if (!allow.includes(ext)) {
        ElMessage.error(`不支持的文件类型：${ext}`)
        return false
    }
    if (file.size / 1024 / 1024 > maxSizeMB) {
        ElMessage.error(`文件过大：最大 ${maxSizeMB}MB`)
        return false
    }
    return true
}

// 自定义上传请求（使用项目 request 工具，Multipart/FormData）
// const handleUpload = async (opts) => {
//     const { file, onProgress, onSuccess, onError } = opts
//     try {
//         let p = 0
//         const timer = setInterval(() => {
//             p = Math.min(p + 15, 95)
//             onProgress && onProgress({ percent: p })
//         }, 120)

//         setTimeout(() => {
//             clearInterval(timer)
//             const fakeRes = {
//                 code: 0,
//                 data: {
//                     id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
//                     url: '',
//                     name: file.name,
//                     size: file.size
//                 }
//             }
//             const fid = fakeRes.data.id
//             const furl = fakeRes.data.url
//             const fname = fakeRes.data.name
//             const fsize = fakeRes.data.size
//             const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : ''
//             const now = new Date().toISOString()
//             formData.files.push({ id: fid, name: fname, url: furl, size: fsize, type: ext.toUpperCase(), updateTime: now })
//             onSuccess && onSuccess(fakeRes)
//             ElMessage.success(`${fname} 上传成功`)
//             onProgress && onProgress({ percent: 100 })
//         }, 800)
//     } catch (err) {
//         onError && onError(err)
//         ElMessage.error(`上传失败：${file.name}`)
//     }
// }
const handleUpload = async (opts) => {
    const { file, onProgress, onSuccess, onError } = opts
    try {
        const fd = new FormData()
        fd.append('file', file)

        const res = await request.post('/file/minio/upload', fd, {
            onUploadProgress: (e) => {
                if (e.total) {
                    const percent = Math.min(99, Math.round((e.loaded / e.total) * 100))
                    onProgress && onProgress({ percent })
                }
            }
        })
        console.log('后端返回:', res)
        const data = res
        //get file name
        const fileName = data?.name ?? data?.fileName ?? file.name
        //后端返回
        const minioBucket = data.minioBucket
        const minioObjectPath = data.minioObjectPath
        const fileFormat = data.fileFormat
        const fileSize = Number(data.fileSize)
        //id is a number 
        const id  =  data?.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

        //没啥用
        const url = data?.url ?? data?.fileUrl ?? data?.path ?? ''
        const name = data?.name ?? data?.fileName ?? file.name
        const size = data?.size ?? file.size
        const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
        const now = new Date().toISOString()

        // 写入本地表单状态，供后续提交/删除使用
        formData.files.push({
            id,
            name,
            url,
            size,
            type: ext.toUpperCase(),
            updateTime: now,
            minioBucket,
            minioObjectPath,
            fileFormat,
            fileSize,
            fileName
        })

        console.log('formData.files:', formData.files)
        // 让 el-upload 记录服务端返回，供 handleRemove 使用
        if (file) {
            file.serverId = id
            if (url) file.url = url
        }

        onSuccess && onSuccess({ data })
        onProgress && onProgress({ percent: 100 })
        ElMessage.success(`${name} 上传成功`)
    } catch (err) {
        onError && onError(err)
        ElMessage.error(`上传失败：${opts?.file?.name || '文件'}`)
    }
}

// 删除文件
const handleRemove = async (file, fileList) => {
    // el-upload 会维护 v-model:file-list，这里同步移除 formData.files
    const serverId = file?.response?.data?.id || file?.serverId || formData.files.find(f => f.name === file.name)?.id
    if (serverId) {
        try {
            // 可选：通知服务端删除
            await request.post('/file/dataSets/remove', { id: serverId })
        } catch {
            // 忽略删除失败（或提示）
        }
    }
    formData.files = formData.files.filter(f => f.name !== file.name && f.id !== serverId)
}

// 超出数量
const handleExceed = () => {
    ElMessage.warning('最多只能上传 5 个文件')
}

// 预览（如服务器返回可访问 URL）
const handlePreview = (file) => {
    const url = file?.url || file?.response?.data?.url
    if (url) window.open(url, '_blank')
}

// 下载样例
const downloadTemplate = () => {
    // 若有真实模板地址可替换
    window.open('/templates/dataset_template.csv', '_blank')
}

// ...existing code...

// const createDataset = async () => {
//     try {
//         await formRef.value.validate()
//         loading.value = true
//         const now = new Date()
//         addDataSet({
//             name: formData.name,
//             direction: formData.direction,
//             description: formData.description,
//             scenes: formData.scenes,
//             publishTime: formData.publishTime,
//             visibility: formData.visibility,
//             createTime: now.toISOString(),
//             updateTime: now.toISOString(),
//             files: formData.files,
//             status: 'pending', // 新增：默认审核中
//             ownerName: userStore.username || 'user'
//         })
//         loading.value = false
//         ElMessage.success('评测集创建成')
//         router.push('/main/my-dataset')
//     } catch (error) {
//         loading.value = false
//         if (error?.message) {
//             ElMessage.error(error.message)
//         }
//     }
// }
const createDataset = async () => {
    try {
        await formRef.value.validate()
        if (!formData.files.length) {
            ElMessage.error('请先上传至少一个文件')
            return
        }
        loading.value = true

        const payload = {
            id: 0,
            scenarioId: 0,
            datasetName: formData.name,
            remark: formData.description,
            scenarioName: Array.isArray(formData.scenes) ? formData.scenes.join(',') : (formData.scenes || ''),
            sampleCount: 21,
            contentFormat:formData.format,
            //don't need gsm8k.csv/.jsonl ,just need like gsm8k 
            fileOriginalName: formData.files[0].fileName.replace(/\.(csv|jsonl)$/i, ''),
            minioBucket: formData.files[0].minioBucket,
            minioObjectPath: formData.files[0].minioObjectPath,
            fileFormat: formData.files[0].fileFormat,
            fileSize: formData.files[0].fileSize,
        }
        console.log('payload:', payload)
        const res = await request.post('/file/dataSets/uploadDataSet', payload)
        if (res.code === 200) {
            ElMessage.success('评测集创建成功')
            router.push('/main/my-dataset')
        } else {
            ElMessage.error(res?.message || res?.msg || '创建失败')
        }
    } catch (error) {
        if (error?.message) ElMessage.error(error.message)
    } finally {
        loading.value = false
    }
}


// 推荐标签
const recommendedScenes = ref([
    // 语言理解
    '文本分类', '情感分析', '阅读理解',
    // 文本生成
    '对话生成', '文本摘要', '机器翻译',
    // 检索与问答
    '检索增强问答(RAG)',
    // 推理与规划
    '数学推理', '链式思维(CoT)',
    // 多模态
    '图像分类', '视觉问答',
])

// 方法
const goBack = () => {
    router.push('/main/my-dataset')
}

const toggleScene = (scene) => {
    const idx = formData.scenes.indexOf(scene)
    if (idx > -1) formData.scenes.splice(idx, 1)
    else {
        if (formData.scenes.length < 10) formData.scenes.push(scene)
        else ElMessage.warning('最多只能选择10个应用场景')
    }
}

const removeScene = (scene) => {
    const idx = formData.scenes.indexOf(scene)
    if (idx > -1) formData.scenes.splice(idx, 1)
}

const getDirectionTagType = (direction) => {
    const typeMap = {
        'text-classification': 'primary',
        'sentiment-analysis': 'success',
        'reading-comprehension': 'info',
        'dialogue-generation': 'warning',
        'text-summarization': 'danger',
        'machine-translation': 'primary',
        'image-classification': 'success',
        'visual-qa': 'warning'
    }
    return typeMap[direction] || 'info'
}

const getDirectionLabel = (direction) => {
    const labelMap = {
        'text-classification': '文本分类',
        'sentiment-analysis': '情感分析',
        'reading-comprehension': '阅读理解',
        'dialogue-generation': '对话生成',
        'text-summarization': '文本摘要',
        'machine-translation': '机器翻译',
        'image-classification': '图像分类',
        'visual-qa': '视觉问答'
    }
    return labelMap[direction] || ''
}

const getFormatLabel = (format) => {
    const map = {
        mcq: '选择题（MCQ）',
        qa: '问答题（QA）'
    }
    return map[format] || '选择题（MCQ）'
}

const resetForm = () => {
    ElMessageBox.confirm('确定要重置表单吗？所有已填写的信息将丢失。', '确认重置', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        formRef.value.resetFields()
        formData.tags = []
        ElMessage.success('表单已重置')
    })
}
const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}


</script>

<style scoped>
.page-container {
    padding: 30px;
    background-color: #ffffff;
    min-height: calc(100vh - 60px);
}

.content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.header-left {
    flex: 1;
}

.page-title {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 8px 0;
    background: black;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.page-subtitle {
    color: #6c757d;
    margin: 0;
    font-size: 14px;
}

.btn-group {
    display: flex;
    gap: 12px;
}

.btn-outline {
    border-radius: 12px;
    background: white;
    border: 1px solid #dee2e6;
    color: #495057;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.btn-outline:hover {
    background: #f8f9fa;
    border-color: #4361ee;
    color: #4361ee;
    transform: translateY(-1px);
}

/* 主要内容区域 */
.main-content {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 30px;
    margin-bottom: 30px;
}

.form-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.form-section {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
}

.section-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #4361ee, #4895ef);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.section-info h3 {
    margin: 0 0 4px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
}

.section-info p {
    margin: 0;
    color: #6c757d;
    font-size: 14px;
}

.section-content {
    padding: 24px;
}

/* 选项样式 */
.option-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.radio-option {
    align-items: center;
    gap: 20px;
    margin-bottom: 12px;
    margin-left: 10px;
}

.option-title {
    font-weight: 600;
    color: #2c3e50;
    /* margin-bottom: -20px; */
    margin-top: 50px;
}

.option-desc {
    font-size: 12px;
    color: #6c757d;

}

/* 标签样式 */
.tags-container {
    width: 100%;
}

.tags-label {
    display: inline-block;
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 8px;
    margin-right: 8px;
}

.recommended-tags,
.custom-tags,
.selected-tags {
    margin-bottom: 16px;
}

.recommended-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
}

.custom-tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

.selected-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
}

/* 预览面板 */
.preview-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.preview-section {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
}

.preview-header {
    padding: 20px 24px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
}

.preview-header h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
}

.preview-content {
    padding: 24px;
}

/* 预览卡片 */
.preview-card {
    border: 1px solid #f0f0f0;
    border-radius: 12px;
    overflow: hidden;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #f0f0f0;
}

.card-header h4 {
    margin: 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
}

.card-content {
    padding: 20px;
}

.description {
    color: #6c757d;
    margin: 0 0 16px 0;
    line-height: 1.5;
}

.meta-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #6c757d;
    font-size: 14px;
}

.tags-preview {
    display: flex;
    flex-wrap: wrap;
}


/* 底部操作栏 */
.action-footer {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
}

.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 30px;
}

.footer-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6c757d;
    font-size: 14px;
}

.footer-actions {
    display: flex;
    gap: 12px;
}



/* 响应式设计 */
@media (max-width: 1200px) {
    .main-content {
        grid-template-columns: 1fr;
    }

    .preview-panel {
        order: -1;
    }
}

@media (max-width: 768px) {
    .page-container {
        padding: 20px;
    }

    .footer-content {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
    }

    .footer-actions {
        justify-content: stretch;
    }

    .custom-tags {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
}
</style>