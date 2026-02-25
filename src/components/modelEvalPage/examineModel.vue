<template>
  <div class="page-container">

    <!-- 列表顶部筛选栏 -->
    <div class="table-container">
      <div class="header-left">
        <h2>模型评测</h2>
      </div>
      <div class="table-header">
        <div class="table-actions">
          <el-input v-model="searchText" placeholder="搜索任务..."
            style="width: 200px; margin-right: 30px; margin-left: -20px;" clearable>
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
          <!-- <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 120px;">
            <el-option label="全部" value="" />
            <el-option label="已完成" value="已完成" />
            <el-option label="进行中" value="进行中" />
            <el-option label="排队中" value="排队中" />
          </el-select> -->
          <div class="btn-group">
            <el-button size="large" class="btn-outline" round @click="goHelp">
              <el-icon style="margin-right: 5px;">
                <InfoFilled />
              </el-icon>
              帮助
            </el-button>
            <el-button type="primary" size="large" class="btn-primary" @click="dialogVisible = true">
              新建评测任务
            </el-button>
          </div>
        </div>
      </div>
      <el-skeleton v-if="isInitLoading" :rows="8" animated style="padding:40px;" />

      <el-table :data="filteredTableData" class="custom-table" stripe header-row-class-name="table-header-row"
        row-class-name="table-row">
        <el-table-column prop="name" label="任务名称" show-overflow-tooltip width="300">
          <template #default="scope">
            <div class="task-name">
              <el-tag size="small" :type="modelTypeTag(scope.row)" effect="dark">
                {{ modelTypeLabel(scope.row) }}
              </el-tag>
              <span style="margin-left:6px;">{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="model" label="评测模型">
          <template #default="scope">
            <el-tag class="model-tag" type="info">{{ scope.row.model }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="模型类型" />
        <el-table-column prop="evaluationset" label="评测集" />
        <el-table-column label="参数">
          <template #default="scope">
            <el-tooltip placement="top"
              :content="`temperature: ${scope.row.temperature ?? '-'}  max_tokens: ${scope.row.max_tokens ?? '-'}`">
              <span class="params-text">
                temp {{ scope.row.temperature ?? '-' }} / max {{ scope.row.max_tokens ?? '-' }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间">
          <template #default="scope">
            <div class="time-info">
              <el-icon>
                <Calendar />
              </el-icon>
              <span>{{ formatTime(scope.row.createdAt) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" link
                @click="$router.push({ path: '/main/eval/detail', query: { id: scope.row.id } })">
                <el-icon>
                  <View />
                </el-icon>详情
              </el-button>
              <el-button type="danger" link @click="deleteTask(scope.row.id)">
                <el-icon>
                  <Delete />
                </el-icon>删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          :total="tableData.length" layout=" prev, pager, next, sizes," background />
      </div>
    </div>
    <el-dialog v-model="dialogVisible" title="新建评测任务" width="600" :before-close="handleClose">
      <div class="dialog-header">
        <h3>选择模型类型</h3>
        <p>请选择您要评测的模型类型，我们将为您提供相应的评测方案</p>
      </div>
      <div class="model-type-options">
        <div class="model-option" :class="{ active: selectedModelType === 'language' }"
          @click="selectedModelType = 'language'">
          <div class="option-icon language">
            <el-icon>
              <ChatDotRound />
            </el-icon>
          </div>
          <div class="option-content">
            <h4>大语言模型</h4>
            <p>适用于文本生成、对话系统等任务</p>
            <div class="option-features">
              <el-tag type="info" effect="light" size="small">文本生成</el-tag>
              <el-tag type="info" effect="light" size="small">语言理解</el-tag>
              <el-tag type="info" effect="light" size="small">对话系统</el-tag>
            </div>
          </div>
          <div class="option-check">
            <el-icon v-if="selectedModelType === 'language'">
              <Check />
            </el-icon>
          </div>
        </div>
        <div class="model-option" :class="{ active: selectedModelType === 'multimodal' }"
          @click="selectedModelType = 'multimodal'">
          <div class="option-icon multimodal">
            <el-icon>
              <Picture />
            </el-icon>
          </div>
          <div class="option-content">
            <h4>多模态模型</h4>
            <p>评测图像、音频、视频等多模态理解能力</p>
            <div class="option-features">
              <el-tag size="small" type="success">图像理解</el-tag>
              <el-tag size="small" type="success">视觉问答</el-tag>
              <el-tag size="small" type="success">跨模态</el-tag>
            </div>
          </div>
          <div class="option-check">
            <el-icon v-if="selectedModelType === 'multimodal'">
              <Check />
            </el-icon>
          </div>
        </div>
        <!-- 新增：代码大模型 -->
        <div class="model-option" :class="{ active: selectedModelType === 'code' }" @click="selectedModelType = 'code'">
          <div class="option-icon code">
            <el-icon>
              <Edit />
            </el-icon>
          </div>
          <div class="option-content">
            <h4>代码大模型</h4>
            <p>评测模型在代码生成、补全、解释与调试等任务上的能力</p>
            <div class="option-features">
              <el-tag size="small" type="warning">代码生成</el-tag>
              <el-tag size="small" type="info">代码理解</el-tag>
              <el-tag size="small" type="success">调试辅助</el-tag>
            </div>
          </div>
          <div class="option-check">
            <el-icon v-if="selectedModelType === 'code'">
              <Check />
            </el-icon>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="nextToEvalMode" :disabled="!selectedModelType">
            下一步
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showEvalModeDialog" title="新建评测任务" width="700px" align-center :close-on-click-modal="false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>选择评测模式</h3>
          <p>根据您的需求选择合适的评测模式</p>
        </div>

        <div class="eval-mode-options">
          <div class="eval-option" :class="{ active: selectedEvalMode === 'quick' }"
            @click="selectedEvalMode = 'quick'">
            <div class="option-icon quick">
              <el-icon>
                <Lightning />
              </el-icon>
            </div>
            <div class="option-content">
              <h4>快速评测</h4>
              <p>使用预设配置快速启动评测，适合初学者和常规需求</p>
              <div class="option-details">
                <div class="detail-item">
                  <el-icon>
                    <Timer />
                  </el-icon>
                  <span>预计用时：1-3分钟</span>
                </div>
                <div class="detail-item">
                  <el-icon>
                    <Setting />
                  </el-icon>
                  <span>预设参数，开箱即用</span>
                </div>
                <div class="detail-item">
                  <el-icon>
                    <TrendCharts />
                  </el-icon>
                  <span>标准评测指标</span>
                </div>
              </div>
              <div class="option-features">
                <el-tag size="small" type="warning">推荐</el-tag>
                <el-tag size="small" type="info">简单易用</el-tag>
              </div>
            </div>
            <div class="option-check">
              <el-icon v-if="selectedEvalMode === 'quick'">
                <Check />
              </el-icon>
            </div>
          </div>

          <div class="eval-option" :class="{ active: selectedEvalMode === 'custom' }"
            @click="selectedEvalMode = 'custom'">
            <div class="option-icon custom">
              <el-icon>
                <Operation />
              </el-icon>
            </div>
            <div class="option-content">
              <h4>自定义评测</h4>
              <p>完全自定义评测配置，适合专业用户和特殊需求</p>
              <div class="option-details">
                <div class="detail-item">
                  <el-icon>
                    <Timer />
                  </el-icon>
                  <span>预计用时：3-5分钟</span>
                </div>
                <div class="detail-item">
                  <el-icon>
                    <Setting />
                  </el-icon>
                  <span>完全自定义配置</span>
                </div>
                <div class="detail-item">
                  <el-icon>
                    <TrendCharts />
                  </el-icon>
                  <span>自选评测指标</span>
                </div>
              </div>
              <div class="option-features">
                <el-tag size="small" type="success">专业</el-tag>
                <el-tag size="small" type="info">灵活配置</el-tag>
              </div>
            </div>
            <div class="option-check">
              <el-icon v-if="selectedEvalMode === 'custom'">
                <Check />
              </el-icon>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="backToModelType">
            上一步
          </el-button>
          <el-button type="primary" @click="startEvaluation" :disabled="!selectedEvalMode">
            开始评测
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed ,onMounted} from 'vue'
import { useRouter ,useRoute} from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

function modelTypeLabel(row) {
  const t = row.topModelType || row.modelTypeRaw || row.type || ''
  if (t === 'multimodal') return '多模态'
  if (t === 'code') return '代码'
  if (t === 'language' || t === 'api' || t === 'local' || t === 'LLM') return '语言'
  return '模型'
}
function modelTypeTag(row) {
  const t = row.topModelType || row.modelTypeRaw || row.type || ''
  if (t === 'multimodal') return 'success'
  if (t === 'code') return 'warning'
  return 'info'
}

// 本地存储读取
const EVAL_TASK_KEY = 'evaluationTasks'
function loadEvalTasks() {
  try { return JSON.parse(localStorage.getItem(EVAL_TASK_KEY) || '[]') } catch { return [] }
}

function saveTasks(list) {
  localStorage.setItem(EVAL_TASK_KEY, JSON.stringify(list))
}
function deleteTask(id) {
  const list = loadEvalTasks().filter(t => t.id !== id)
  saveTasks(list)
  // 重新合并（示例数据仍附加在后面）
  tableData.value = [...list, ...sampleData]
  ElMessage.success('已删除')
}

// 原静态示例数据（可保留作为对比）
const sampleData = [
  // {
  //   name: '图像分类精度评测-V1',
  //   model: 'ResNet50',
  //   type: 'CNN',
  //   evaluationset: 'ImageNet-1K',
  //   createdAt: '2025-08-28T09:15:00Z'
  // },
  // {
  //   name: '情感分析F1评测-V2',
  //   model: 'BERT-base-chinese',
  //   type: 'Transformer',
  //   evaluationset: 'ChnSentiCorp',
  //   createdAt: '2025-08-27T14:30:00Z'
  // }
]

// 动态任务 + 示例
const tableData = ref([
  ...loadEvalTasks(),
  ...sampleData
])

const searchText = ref('')
const statusFilter = ref('') // 保留
const currentPage = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const selectedModelType = ref('')
const selectedEvalMode = ref('')
const showModelTypeDialog = ref(false)
const showEvalModeDialog = ref(false)

const filteredTableData = computed(() => {
  let filtered = tableData.value
  if (searchText.value) {
    filtered = filtered.filter(item =>
      (item.name || '').includes(searchText.value) ||
      (item.model || '').includes(searchText.value)
    )
  }
  if (statusFilter.value) {
    filtered = filtered.filter(item => item.status === statusFilter.value)
  }
  return filtered
})

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const nextToEvalMode = () => {
  if (!selectedModelType.value) {
    ElMessage.warning('请选择模型类型')
    return
  }
  // if (selectedModelType.value === 'multimodal') {
  //   router.push('/main/eval/custom')
  // }
  showModelTypeDialog.value = false
  showEvalModeDialog.value = true
}

const backToModelType = () => {
  showEvalModeDialog.value = false
  showModelTypeDialog.value = true
}

const startEvaluation = () => {
  if (!selectedEvalMode.value) {
    ElMessage.warning('请选择评测模式')
    return
  }
  const mt = selectedModelType.value || 'language'
  showEvalModeDialog.value = false
  if (selectedEvalMode.value === 'quick') {
    router.push({ path: '/main/eval/easy', query: { modelType: mt } })
  } else {
    router.push({ path: '/main/eval/custom', query: { modelType: mt } })
  }
}

const goHelp = () => {
  router.push({ path: '/help' })
}

// 抽离加载函数
function loadTasks() {
  tableData.value = [...loadEvalTasks(), ...sampleData]
}
// 新增：初始加载遮罩
const isInitLoading = ref(false)
// onMounted(() => {
//   if (route.query.newTask) {
//     // 进入页面后显示“加载中”效果 5 秒，再刷新列表并提示
//     isInitLoading.value = true
//     tableData.value = []        // 清空暂不显示旧数据
//     setTimeout(() => {
//       loadTasks()
//       isInitLoading.value = false
//       ElMessage.success('评测任务已完成')
//       // 清除 URL 参数（避免刷新再次触发）
//       router.replace({ path: route.path })
//     }, 13000)
//   } else {
//     loadTasks()
//   }
// })

onMounted(() => {
  // 进入页面统一显示加载骨架屏 6 秒
  isInitLoading.value = true
  tableData.value = [] // 清空，保持骨架屏
  setTimeout(() => {
    loadTasks()
    isInitLoading.value = false
    // 如果带有新任务参数，加载完成后提示并清理 URL
    if (route.query.newTask) {
      ElMessage.success('评测任务已完成')
      router.replace({ path: route.path })
    }
  }, 10000) // 6000ms = 6s
})
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

.page-subtitle {
  color: #6c757d;
  margin: 0;
  font-size: 14px;
}

.btn-group {
  margin-left: 1080px;
  display: flex;
  gap: 12px;
}

.btn-primary {
  padding: 12px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4361ee, #4895ef);
  border: none;
  box-shadow: 0 8px 20px rgba(67, 97, 238, 0.15);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(67, 97, 238, 0.25);
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.stat-icon.completed {
  background: linear-gradient(135deg, #52c41a, #73d13d);
}

.stat-icon.running {
  background: linear-gradient(135deg, #faad14, #ffc53d);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
}

.stat-content h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
}

.stat-content p {
  margin: 4px 0 0 0;
  color: #6c757d;
  font-size: 14px;
}

.table-container {
  background: white;
  border-radius: 16px;
  /* box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); */
  overflow: hidden;
  /* border: 1px solid #f0f0f0; */
}

.table-header {
  margin-top: -25px;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* background: #fafafa; */
}

.table-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.table-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

:deep(.custom-table) {
  border-radius: 0;
  width: 100%;
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
  transition: all 0.2s ease;
}

:deep(.table-row:hover) {
  background-color: #f8f9fa !important;
}

:deep(.el-table td) {
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.task-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-icon {
  color: #4361ee;
  font-size: 16px;
}

.model-tag {
  border-radius: 6px;
  font-weight: 500;
}

.model-type {
  color: #495057;
  font-weight: 500;
}

.evaluation-set {
  color: #6c757d;
  font-size: 13px;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6c757d;
  font-size: 13px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.table-pagination {
  padding: 20px 24px;
  display: flex;
  justify-content: center;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

:deep(.el-pagination) {
  --el-pagination-button-bg-color: white;
  --el-pagination-hover-color: #4361ee;
}

.dialog-content {
  padding: 20px;
}

.dialog-header {
  text-align: center;
  margin-bottom: 30px;
}

.dialog-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.dialog-header p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
}


.model-type-options {
  display: flex;
  gap: 20px;
  flex-direction: column;
}

.model-option {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border: 2px solid #f0f0f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.model-option:hover {
  border-color: #66c2ec;
  box-shadow: 0 4px 12px rgba(124, 143, 228, 0.1);
}

.model-option.active {
  border-color: #4361ee;
  background: #f8f9ff;
  box-shadow: 0 4px 12px rgba(67, 97, 238, 0.15);
}

.option-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.option-icon.language {
  background: linear-gradient(135deg, #90a0eb, #4895ef);
}

.option-icon.multimodal {
  background: linear-gradient(135deg, #53c9a2, #34d399);
}

.option-icon.quick {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.option-icon.custom {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
}

.option-content {
  flex: 1;
}

.option-content h4 {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.option-content p {
  margin: 0 0 12px 0;
  color: #6c757d;
  font-size: 14px;
  line-height: 1.4;
}

.option-features {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.option-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #9babdf;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.eval-mode-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.eval-option {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.eval-option:hover {
  border-color: #4361ee;
  box-shadow: 0 4px 12px rgba(67, 97, 238, 0.1);
}

.eval-option.active {
  border-color: #4361ee;
  background: #f8f9ff;
  box-shadow: 0 4px 12px rgba(67, 97, 238, 0.15);
}

.option-details {
  margin: 12px 0;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c757d;
  font-size: 13px;
  margin-bottom: 6px;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.option-icon.code {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}
</style>