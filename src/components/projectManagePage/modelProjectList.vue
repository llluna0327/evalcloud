<template>
  <div class="project-list-page">

    <div class="page-header ">
      <h2>
        模型评测项目总览
      </h2>
      <el-button type="primary" size="large" class="btn-primary" @click="dialogVisible = true">
        新建评测任务
      </el-button>
    </div>
    <!-- 常用项目区域 -->
    <div v-if="favoriteProjects.length > 0" class="favorite-section">
      <div class="section-header">
        <h3>
          <el-icon>
            <Star />
          </el-icon>
          常用项目
        </h3>
      </div>
      <div class="favorite-projects">
        <div v-for="project in favoriteProjects" :key="project.id" class="favorite-project-card"
          @click="viewProject(project)">
          <div class="card-content">
            <div class="card-title">{{ project.name }}</div>
            <div class="card-type">{{ project.type }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input v-model="searchKeyword" placeholder="搜索项目名称..." style="width: 300px" clearable>
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>

        <!-- 添加项目种类筛选 -->
        <el-select v-model="categoryFilter" placeholder="项目种类" style="width: 150px" clearable>
          <el-option label="全部种类" value="all" />
          <el-option label="模型评测" value="model-eval">
          </el-option>
          <el-option label="PROMPT调优" value="prompt-optimization">
          </el-option>
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-select v-model="sortBy" placeholder="排序方式" style="width: 150px">
          <el-option label="创建时间" value="createTime" />
          <el-option label="更新时间" value="updateTime" />
          <el-option label="项目名称" value="name" />
          <el-option label="评测次数" value="evaluationCount" />
        </el-select>
        <el-button @click="refreshProjects">
          <el-icon>
            <Refresh />
          </el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 项目表格 -->
    <div class="projects-table-container">
      <el-skeleton v-if="loadingProjects" animated :count="1"
        style="--el-skeleton-color:#f3f5f8; --el-skeleton-to-color:#eceff3;">
        <template #template>
          <div style="margin-bottom:18px;">
            <el-skeleton-item variant="rect" style="height:38px;margin-bottom:12px;border-radius:6px;" />
            <el-skeleton-item v-for="i in 5" :key="i" variant="rect"
              style="height:52px;margin-bottom:10px;border-radius:8px;" />
          </div>
        </template>
      </el-skeleton>

      <el-table v-else :data="filteredProjects" style="width: 100%" stripe>
        <el-table-column prop="name" label="项目名称" width="250">
          <template #default="scope">
            <div class="table-name-cell">
              <div class="name-info" style="margin-left: 20px;">
                <div class="name" @click="$router.push({ path: '/main/eval/detail', query: { taskId: scope.row.id } })">
                  {{ scope.row.name }}
                  <el-tag v-if="scope.row.isFavorite" type="warning" size="small" style="margin-left: 8px;">
                    <el-icon>
                      <Star />
                    </el-icon>
                    常用
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="项目简介" min-width="200">
          <template #default="scope">
            <div class="description-cell">
              {{ scope.row.description || '暂无描述' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="功能模块" width="400">
          <template #default="scope">
            <div class="function-buttons">

              <!-- 模型评测类项目显示的按钮 -->
              <template v-if="scope.row.category === 'model-eval'">
                <el-tooltip :content="isCompleted(scope.row.status) ? '评测报告' : '任务未完成，暂不可查看'" placement="top">
                  <el-button size="small" type="warning" @click="openReport(scope.row)"
                    :disabled="!isCompleted(scope.row.status)">
                    <el-icon>
                      <Document />
                    </el-icon>
                  </el-button>
                </el-tooltip>
              </template>


              <!-- 通用按钮 -->
              <el-tooltip content="项目设置" placement="top">
                <el-button size="small" type="info" @click="goToProjectSettings(scope.row)">
                  <el-icon>
                    <Setting />
                  </el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="任务状态" width="150">
          <template #default="scope">
            <el-tag :type="getCategoryTagType(scope.row.status)" size="small">
              {{ getCategoryLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <div class="table-actions">
              <el-button :type="scope.row.isFavorite ? 'warning' : 'default'" size="small"
                @click="toggleFavorite(scope.row.id, scope.row.isFavorite)">
                <el-icon>
                  <Star v-if="scope.row.isFavorite" />
                  <StarFilled v-else />
                </el-icon>
                {{ scope.row.isFavorite ? '取消常用' : '设为常用' }}
              </el-button>
              <el-button type="danger" size="small" @click="deleteProject(scope.row)">
                <el-icon>
                  <Delete />
                </el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredProjects.length === 0" class="empty-state">
      <div class="empty-icon">
        <el-icon>
          <FolderAdd />
        </el-icon>
      </div>
      <h3>暂无项目</h3>
      <p>您还没有创建任何项目，点击上方按钮开始创建您的第一个评测项目吧！</p>
      <el-button type="primary" @click="showCreateProjectDialog">
        <el-icon>
          <Plus />
        </el-icon>
        创建项目
      </el-button>
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
          <el-button type="primary" @click="startEvaluation">
            开始评测
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()

const PROJECTS_STORAGE_KEY = 'MODEL_EVAL_PROJECTS_V1'

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('all')
const categoryFilter = ref('all')
const sortBy = ref('updateTime')
const totalCount = ref(0)

// 对话框状态
const showModelTypeDialog = ref(false)
const showEvalModeDialog = ref(false)
const selectedModelType = ref('')
const selectedEvalMode = ref('')
const dialogVisible = ref(false)

function loadStoredProjects() {
  try { return JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || '[]') } catch { return [] }
}

function saveStoredProjects(list) {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(list))
}

const loadingProjects = ref(true)
const highlightId = ref(null)

const isCompleted = (status) => {
  // 兼容数值/字符串状态
  if (status === 2 || status === '2') return true
  const s = String(status || '').toLowerCase()
  return ['已完成', 'completed', 'done', 'success', 'finish', 'finished'].includes(s)
}
const openReport = (row) => {
  if (!isCompleted(row?.status)) {
    ElMessage.warning('该任务尚未完成，无法查看评测报告')
    return
  }
  router.push({ path: '/main/eval/detail', query: { taskId: row.id } })
}

const loadProjectsWithDelay = async (highlightTarget) => {
  loadingProjects.value = true
  try {
    const res = await request.get('/evalTask/selectTasks')
    console.log('评测任务列表响应:', res)
    const ok = res?.code === 200
    const list = ok && Array.isArray(res?.data) ? res.data : []
    projects.value = list.map(item => ({
      // 使用后端字段
      // evalTaskId: item.evalTaskId,
      // taskName: item.taskName,
      // modelId: item.modelId,

      // scenarioName: item.scenarioName,
      // standardId: item.standardId,
      // standardName: item.standardName,
      // taskStatus: item.taskStatus,
      // datasetId: item.datasetId,
      // datasetName: item.datasetName,
      // executorId: item.executorId,
      // startTime: item.startTime,
      // endTime: item.endTime,
      // createTime: item.createTime,
      // updateTime: item.updateTime,
      // 前端展示字段
      id: item.evalTaskId,
      name: item.taskName,
      modelId: item.modelId,
      modelName: item.modelName,
      type: item.standardName || '评测任务',
      category: 'model-eval',
      description: `评测场景：${item.scenarioName}，数据集：${item.datasetName}`,
      status: item.taskStatus,
      datasetCount: item.datasetId ? 1 : 0,
      modelCount: item.modelId ? 1 : 0,
      // memberCount: 1,
      completedEvaluations: item.taskStatus === 2 ? 1 : 0,
      totalEvaluations: 1,
      isFavorite: item.isFavorite,
      members: []
    }))
    highlightId.value = highlightTarget || null
  } catch (err) {
    ElMessage.error(err?.message || '加载评测任务失败')
    projects.value = []
  } finally {
    loadingProjects.value = false
  }
}



const startEvaluation = () => {

  showEvalModeDialog.value = false

  // 这里可以跳转到相应的评测配置页面
  if (selectedEvalMode.value === 'quick') {
    router.push({ path: '/main/eval/easy' })
  } else {
    router.push({ path: '/main/eval/custom' })
  }
}

const projects = ref([
  {
    id: 1,
    name: '中文情感分析评测项目',
    type: '情感分析评测',
    category: 'model-eval', // 添加项目种类
    description: '针对中文文本的情感分析能力评测，包含多个领域的数据集和多种模型的对比分析。',
    status: 'running',
    createTime: '2023-12-01 10:30:00',
    updateTime: '2023-12-15 14:20:00',
    datasetCount: 5,
    modelCount: 8,
    memberCount: 4,
    completedEvaluations: 15,
    totalEvaluations: 40,
    averageScore: 8.6,
    isFavorite: 0,
    members: [
      { id: 1, name: '张三', avatar: '' },
      { id: 2, name: '李四', avatar: '' },
      { id: 3, name: '王五', avatar: '' },
      { id: 4, name: '赵六', avatar: '' }
    ]
  },
])

// 添加新的方法
const getCategoryTagType = (category) => {
  const typeMap = {
    0: 'primary',
    1: 'info',
    2: 'success',
    3: 'danger'
  }
  return typeMap[category] || 'info'
}

const getCategoryLabel = (category) => {
  const labelMap = {
    0: '待执行',
    1: '执行中',
    2: '已完成',
    3: '失败'
  }
  return labelMap[category] || '未知'
}


// 计算属性
const favoriteProjects = computed(() => {
  return projects.value.filter(project => project.isFavorite)
})

const filteredProjects = computed(() => {
  let result = [...projects.value]

  // 搜索过滤
  if (searchKeyword.value) {
    result = result.filter(project =>
      project.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      project.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  // 项目种类过滤
  if (categoryFilter.value !== 'all') {
    result = result.filter(project => project.category === categoryFilter.value)
  }

  // 状态过滤
  if (statusFilter.value !== 'all') {
    result = result.filter(project => project.status === statusFilter.value)
  }

  // 先按常用项目排序，常用的在前面
  result.sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return b.isFavorite - a.isFavorite
    }

    // 在相同常用状态下，按照选择的排序方式排序
    if (sortBy.value === 'createTime' || sortBy.value === 'updateTime') {
      return new Date(b[sortBy.value]) - new Date(a[sortBy.value])
    } else if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name)
    } else if (sortBy.value === 'evaluationCount') {
      return b.totalEvaluations - a.totalEvaluations
    }
    return 0
  })

  totalCount.value = result.length
  return result
})


const showCreateProjectDialog = () => {
  router.push('/main/create-project')
}

const viewProject = (project) => {
    openReport(project)
}

const refreshProjects = () => {
  loading.value = true
  setTimeout(() => {
    // 可在此处重新从存储取数据模拟刷新
    projects.value = loadStoredProjects()
    loading.value = false
    loadingProjects.value = false
    ElMessage.success('刷新成功')
  }, 600)
}

const goToProjectSettings = (project) => {
  // router.push(`/project/${project.id}/settings`)
  router.push({ path: '/main/project-setting', query: { taskId: project.id } })

  // router.push(`/main/project-setting`,{query: {taskId:project.id}})
  ElMessage.success(`进入${project.name}的项目设置`)
}

onMounted(() => {
  const newId = route.query.newProject
  loadProjectsWithDelay(newId)
})

const toggleFavorite = async (id, isFavorite) => {
  try {
    const next = isFavorite ? 0 : 1
    const res = await request.get('/evalTask/updateFavorite', {
      params: { taskId: id, isFavorite: next }
    })
    if (res.code !== 200) {
      ElMessage.error(res?.msg || '操作失败')
      return
    }
    const target = projects.value.find(p => p.id === id)
    if (target) target.isFavorite = !!next
    ElMessage.success(next ? '已设为常用项目' : '已取消常用项目')
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  }
}

const deleteProject = (project) => {
  ElMessageBox.confirm(`确定要删除项目"${project.name}"吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await request.delete('/evalTask/deleteEvalTask', {
      params: { taskId: project.id }
    })
    if (res.code === 200) {
      projects.value = projects.value.filter(p => p.id !== project.id)
      saveStoredProjects(projects.value)
      ElMessage.success('项目删除成功')
    } else {
      ElMessage.error(res.message || '项目删除失败')
    }
  })
}
</script>

<style scoped>
.project-list-page {
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

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px 24px;
  border-radius: 5px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}


/* 表格单元格样式 */


.name-info .name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  cursor: pointer;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
}

.name-info .name:hover {
  color: #667eea;
}

.name-info .type {
  font-size: 12px;
  color: #6c757d;
}

.description-cell {
  color: #6c757d;
  font-size: 14px;
  line-height: 1.5;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;

}


.table-actions {
  gap: 8px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.empty-icon {
  font-size: 80px;
  color: #d9d9d9;
  margin-bottom: 24px;
}

.empty-state h3 {
  color: #2c3e50;
  font-size: 24px;
  margin: 0 0 12px 0;
  font-weight: 700;
}

.empty-state p {
  color: #6c757d;
  font-size: 16px;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 0;
}

:deep(.el-table .el-table__header-wrapper th) {
  background-color: #f8f9fa;
  color: #2c3e50;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
}

:deep(.el-table .el-table__body-wrapper tr:hover td) {
  background-color: #f0f9ff;
}

:deep(.el-table .el-table__row td) {
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .project-list-page {
    padding: 16px;
  }


  .toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .table-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

.favorite-section {
  margin-top: -20px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-header h3 .el-icon {
  color: #F7BA2A;
  font-size: 22px;
}

.section-subtitle {
  font-size: 14px;
  color: #6c757d;
  margin-left: 30px;
}

.favorite-projects {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.favorite-project-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  /* border: 1px solid #e9ecef; */
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

/* .favorite-project-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
} */

.favorite-project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}


.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-type {
  font-size: 13px;
  color: #6c757d;
  margin-bottom: 12px;
}

.card-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6c757d;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .favorite-projects {
    grid-template-columns: 1fr;
  }

  .favorite-project-card {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .section-subtitle {
    margin-left: 0;
  }

  .section-header h3 {
    font-size: 18px;
  }
}

.function-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.function-buttons .el-button {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 6px;
}


/* 响应式调整 */
@media (max-width: 768px) {
  .function-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .function-buttons .el-button {
    width: 100%;
    justify-content: center;
  }
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

.option-icon.code {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
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
</style>