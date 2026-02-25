<template>
  <div class="project-list-page">

    <div class="page-header ">
      <h2>
        PROMPT调优项目总览
      </h2>
      <el-button type="primary" size="large" class="btn-primary" @click="router.push('/main/prompt-optimize')">
        新建调优任务
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
      <el-table :data="filteredProjects" style="width: 100%" stripe>
        <el-table-column prop="name" label="项目名称" width="250">
          <template #default="scope">
            <div class="table-name-cell">
              <div class="name-info" style="margin-left: 20px;">
                <div class="name" @click="viewProject(scope.row)">
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

        <el-table-column prop="description" label="项目简介">
          <template #default="scope">
            <div class="description-cell" style="max-height: 200px;">
              {{ scope.row.description || '暂无描述' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="功能模块" width="400">
          <template #default="scope">
            <div class="function-buttons">

              <!-- 模型评测类项目显示的按钮 -->
              <template v-if="scope.row.category === 'model-eval'">
                <el-tooltip content="模型评测" placement="top">
                  <el-button size="small" type="primary" @click="goToModelEval(scope.row)">
                    <el-icon>
                      <TrendCharts />
                    </el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="评测报告" placement="top">
                  <el-button size="small" type="warning" @click="goToEvalReport(scope.row)">
                    <el-icon>
                      <Document />
                    </el-icon>
                  </el-button>
                </el-tooltip>
              </template>

              <!-- PROMPT调优类项目显示的按钮 -->
              <template v-else-if="scope.row.category === 'prompt-optimization'">
                <el-tooltip content="PROMPT调优" placement="top">
                  <el-button size="small" type="success" @click="goToPromptOptimization(scope.row)">
                    <el-icon>
                      <Edit />
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

        <el-table-column label="项目种类" width="150">
          <template #default="scope">
            <el-tag :type="getCategoryTagType(scope.row.category)" size="small">
              {{ getCategoryLabel(scope.row.category) }}
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
    <!-- <div v-if="filteredProjects.length === 0" class="empty-state">
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
    </div> -->

    <!-- 创建项目对话框 -->
    <!-- <el-dialog v-model="createProjectDialogVisible" title="创建新项目" width="600px" @close="resetCreateForm">
      <el-form ref="createProjectFormRef" :model="createProjectForm" :rules="createProjectRules" label-width="120px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="createProjectForm.name" placeholder="请输入项目名称" />
        </el-form-item>

        <el-form-item label="项目类型" prop="type">
          <el-select v-model="createProjectForm.type" placeholder="请选择项目类型" style="width: 100%">
            <el-option label="文本分类评测" value="文本分类评测" />
            <el-option label="情感分析评测" value="情感分析评测" />
            <el-option label="阅读理解评测" value="阅读理解评测" />
            <el-option label="对话生成评测" value="对话生成评测" />
            <el-option label="文本摘要评测" value="文本摘要评测" />
            <el-option label="机器翻译评测" value="机器翻译评测" />
            <el-option label="综合能力评测" value="综合能力评测" />
          </el-select>
        </el-form-item>

        <el-form-item label="项目描述" prop="description">
          <el-input v-model="createProjectForm.description" type="textarea" :rows="3" placeholder="请输入项目描述（可选）" />
        </el-form-item>

        <el-form-item label="项目成员" prop="members">
          <el-select v-model="createProjectForm.members" multiple placeholder="选择项目成员" style="width: 100%">
            <el-option v-for="user in availableUsers" :key="user.id" :label="user.name" :value="user.id" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createProjectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreateProject" :loading="submitLoading">
            创建项目
          </el-button>
        </div>
      </template>
    </el-dialog> -->

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const PROJECTS_STORAGE_KEY = 'PROMPT_OPT_PROJECTS'
const PREFILL_KEY = 'PROMPT_OPTIMIZE_PREFILL'


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

// const nextToEvalMode = () => {
//   if (!selectedModelType.value) {
//     ElMessage.warning('请选择模型类型')
//     return
//   }
//   if (selectedModelType.value === 'multimodal') {
//     router.push('/main/eval/custom')
//   }
//   showModelTypeDialog.value = false
//   showEvalModeDialog.value = true
// }


// const backToModelType = () => {
//   showEvalModeDialog.value = false
//   showModelTypeDialog.value = true
// }

// const startEvaluation = () => {
//   if (!selectedEvalMode.value) {
//     ElMessage.warning('请选择评测模式')
//     return
//   }

//   showEvalModeDialog.value = false

//   // 这里可以跳转到相应的评测配置页面
//   console.log('模型类型:', selectedModelType.value)
//   console.log('评测模式:', selectedEvalMode.value)
//   if (selectedEvalMode.value === 'quick') {
//     router.push({ path: '/main/eval/easy' })
//   } else {
//     router.push({ path: '/main/eval/custom' })
//   }
// }


// 创建项目对话框
const createProjectDialogVisible = ref(false)
const createProjectFormRef = ref()
const submitLoading = ref(false)
const createProjectForm = ref({
  name: '',
  type: '',
  description: '',
  members: []
})

// 表单验证规则
// const createProjectRules = {
//   name: [
//     { required: true, message: '请输入项目名称', trigger: 'blur' },
//     { min: 2, max: 50, message: '项目名称长度在 2 到 50 个字符', trigger: 'blur' }
//   ],
//   type: [
//     { required: true, message: '请选择项目类型', trigger: 'change' }
//   ],
//   category: [
//     { required: true, message: '请选择项目种类', trigger: 'change' }
//   ]
// }

// 可选用户列表
const availableUsers = ref([
  { id: 1, name: '张三', avatar: '' },
  { id: 2, name: '李四', avatar: '' },
])

const projects = ref([
  // {
  //   id: 3,
  //   name: '对话生成PROMPT优化',
  //   type: '对话生成优化',
  //   category: 'prompt-optimization', // PROMPT调优类
  //   description: '优化对话生成模型的PROMPT模板，提升对话质量和连贯性。',
  //   status: 'running',
  //   createTime: '2023-11-20 14:00:00',
  //   updateTime: '2023-12-12 11:30:00',
  //   datasetCount: 4,
  //   modelCount: 5,
  //   memberCount: 2,
  //   completedEvaluations: 8,
  //   totalEvaluations: 20,
  //   averageScore: 8.1,
  //   isFavorite: true,
  //   members: [
  //     { id: 2, name: '李四', avatar: '' },
  //     { id: 3, name: '王五', avatar: '' }
  //   ]
  // }
])

// 添加新的方法
const getCategoryTagType = (category) => {
  const typeMap = {
    'model-eval': 'primary',
    'prompt-optimization': 'success'
  }
  return typeMap[category] || 'info'
}

const getCategoryLabel = (category) => {
  const labelMap = {
    'model-eval': '模型评测',
    'prompt-optimization': 'PROMPT'
  }
  return labelMap[category] || '未知'
}


const goToEvalReport = (project) => {
  // router.push(`/project/${project.id}/eval-report`)
  router.push(`/main/eval/detail`)
  ElMessage.success(`进入${project.name}的评测报告`)
}

// const goToTemplateManage = (project) => {
//   router.push(`/project/${project.id}/template-manage`)
//   ElMessage.success(`进入${project.name}的模板管理`)
// }


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


const toggleFavorite = async (id, isFavorite) => {
  try {
    const next = isFavorite ? 0 : 1
    const res = await request.get('/prompt/updateFavorite', {
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

// const submitCreateProject = async () => {
//   if (!createProjectFormRef.value) return

//   await createProjectFormRef.value.validate((valid) => {
//     if (valid) {
//       submitLoading.value = true

//       // 模拟API调用
//       setTimeout(() => {
//         const selectedMembers = availableUsers.value.filter(user =>
//           createProjectForm.value.members.includes(user.id)
//         )

//         const newProject = {
//           id: Date.now(),
//           name: createProjectForm.value.name,
//           type: createProjectForm.value.type,
//           category: createProjectForm.value.category, // 添加项目种类
//           description: createProjectForm.value.description,
//           status: 'running',
//           createTime: new Date().toLocaleString('zh-CN'),
//           updateTime: new Date().toLocaleString('zh-CN'),
//           datasetCount: 0,
//           modelCount: 0,
//           memberCount: selectedMembers.length,
//           completedEvaluations: 0,
//           totalEvaluations: 0,
//           averageScore: null,
//           isFavorite: false,
//           members: selectedMembers
//         }

//         projects.value.unshift(newProject)
//         createProjectDialogVisible.value = false
//         submitLoading.value = false
//         ElMessage.success('项目创建成功')
//         resetCreateForm()
//       }, 1000)
//     }
//   })
// }

const viewProject = (project) => {
  router.push(`/main/prompt-optimize?promptTaskId=${project.id}`)
}

const deleteProject = (project) => {
  ElMessageBox.confirm(`确定要删除项目 "${project.name}" 吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const promptTaskId = project.id
    console.log('删除项目ID：', promptTaskId)
    try {
      loading.value = true
      const res = await request.delete('/prompt/deleteTask', {
        params: { promptTaskId: promptTaskId }
      })
      if (res.code !== 200) {
        ElMessage.error(res?.msg || res?.message || '删除失败')
        return
      }
      const index = projects.value.findIndex(p => p.id === project.id)
      if (index > -1) {
        projects.value.splice(index, 1)
      }
      ElMessage.success('删除成功')
    } catch (err) {
      ElMessage.error(err?.message || '删除失败，请稍后重试')
    } finally {
      loading.value = false
    }
  }).catch(() => { })
}
// 修改：本地项目跳转不携带后端ID，避免请求历史接口报错
const goToPromptOptimization = (project) => {
  const prefill = project.resultPrompt || project.originalPrompt || project.description || ''
  if (prefill) {
    localStorage.setItem(PREFILL_KEY, JSON.stringify({ content: prefill }))
  }
  if (project.source === 'local') {
    router.push({ path: '/main/prompt-optimize' }) // 本地项目不带 promptTaskId
  } else {
    const promptTaskId = project.promptTaskId ?? project.id
    router.push({ path: '/main/prompt-optimize', query: { promptTaskId } })
  }
  ElMessage.success(`进入${project.name}的PROMPT调优`)
}
const refreshProjects = async () => {
  loading.value = true
  try {
    await loadProjects()
    loadLocalProjects()
    ElMessage.success('刷新成功')
  } catch {
    ElMessage.error('刷新失败')
  } finally {
    loading.value = false
  }
}

const goToModelEval = (project) => {
  showEvalModeDialog.value = true
  // router.push(`/project/${project.id}/model-eval`)
  // ElMessage.success(`进入${project.name}的模型评测`)
}


const goToProjectSettings = (project) => {
  // router.push(`/project/${project.id}/settings`)
  router.push(`/main/project-setting`)
  ElMessage.success(`进入${project.name}的项目设置`)
}

onMounted(async () => {
   loadProjects()
  // loadLocalProjects() // 合并本地新保存的 Prompt 调优项目
})
const loadProjects = async () => {
  loading.value = true
  try {
    const res = await request.get('/prompt/selectAllTask')
    console.log('获取项目列表响应：', res)
    if (res.code === 200) {
      const list = Array.isArray(res.data) ? res.data : []
      projects.value = list.map(item => ({
        // 前端展示所需字段
        id: item.promptTaskId,
        name: item.originalPrompt,
        type: 'PROMPT调优项目',
        category: 'prompt-optimization',
        description: item.resultPrompt,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        isFavorite: item.isFavorite,
      }))
      totalCount.value = projects.value.length
    }
  } catch (err) {
    ElMessage.error(err?.message || '获取项目列表失败')
  } finally {
    loading.value = false
  }
}
const loadLocalProjects = () => {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY)
    if (!raw) return
    const locals = JSON.parse(raw) || []
    const existIds = new Set(projects.value.map(p => p.id))
    locals.forEach(p => {
      if (!existIds.has(p.id)) {
        projects.value.unshift(p)
      }
    })
  } catch (e) {
    console.error('加载本地保存的项目失败：', e)
  }
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