<template>
  <div class="my-model-page">
    <!-- 页面头部 -->
    <div class="page-header ">
      <h2>
        我的模型
      </h2>
    </div>


    <!-- 模型表格 -->
    <div class="table-container">
      <el-table :data="filteredModels" style="width: 100%" v-loading="loading"
        :default-sort="{ prop: 'createTime', order: 'descending' }">
        <el-table-column prop="modelName" label="模型名称" width="400" sortable>
          <template #default="scope">
            <div class="model-name-cell">
              <div class="model-icon">
                <el-icon>
                  <Cpu v-if="scope.row.modelType === 'api'" />
                  <Folder v-else />
                </el-icon>
              </div>
              <div class="model-info">
                <div class="name">{{ scope.row.modelName }}</div>
                <div class="description">{{ scope.row.description || '暂无描述' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="modelType" label="模型类型"  sortable>
          <template #default="scope">
            <el-tag :type="scope.row.modelType === 'api' ? 'success' : 'primary'" effect="plain">
              <el-icon>
                <Link v-if="scope.row.modelType === 'api'" />
                <Folder v-else />
              </el-icon>
              {{ scope.row.modelType === 'api' ? 'API模型' : '本地模型' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="apiOrWeight" label="API / 模型权重" >
          <template #default="scope">
            <div class="api-weight-cell">
              <span v-if="scope.row.modelType === 'api'" class="api-url">
                {{ scope.row.apiOrWeight }}
              </span>
              <span v-else class="weight-path">
                {{ scope.row.apiOrWeight }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间"  sortable>
          <template #default="scope">
            <div class="time-cell">
              <el-icon>
                <Calendar />
              </el-icon>
              <span>{{ formatTime(scope.row.createTime) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="updateTime" label="最近修改时间"  sortable>
          <template #default="scope">
            <div class="time-cell">
              <el-icon>
                <Clock />
              </el-icon>
              <span>{{ formatTime(scope.row.updateTime) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作"  fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button size="small" @click="editModel(scope.row)" :disabled="scope.row.status === 'error'">
                <el-icon>
                  <Edit />
                </el-icon>
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="deleteModel(scope.row)">
                <el-icon>
                  <Delete />
                </el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          layout=" sizes, prev, pager, next" :total="totalCount" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>

    <el-dialog v-model="editDialogVisible" title="编辑模型" width="520px" :close-on-click-modal="false">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="90px">
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="editForm.modelName" maxlength="50" show-word-limit placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="4" maxlength="500" show-word-limit
            placeholder="请输入模型描述(可选)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="saveEdit">保存</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'
import { getModels, saveModels, removeModel } from '@/utils/modelLocalData'
import request from '@/utils/request'


// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const typeFilter = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

const editDialogVisible = ref(false)
const editFormRef = ref()
const editForm = ref({
  id: null,
  modelName: '',
  description: ''
})
const editRules = {
  modelName: [
    { required: true, message: '请输入模型名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度 2~50', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '最多 500 字', trigger: 'blur' }
  ]
}
function nowString() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
// 覆盖原 editModel
const editModel = (model) => {
  editForm.value.id = model.id
  editForm.value.modelName = model.modelName
  editForm.value.description = model.description || ''
  editDialogVisible.value = true
}
const saveEdit = () => {
  editFormRef.value.validate(valid => {
    if (!valid) return
    const idx = models.value.findIndex(m => m.id === editForm.value.id)
    if (idx > -1) {
      models.value[idx].modelName = editForm.value.modelName
      models.value[idx].description = editForm.value.description
      models.value[idx].updateTime = nowString()
      saveModels(models.value)
      ElMessage.success('保存成功')
    }
    editDialogVisible.value = false
  })
}


const models = ref([])

// 新建模型对话框
const submitLoading = ref(false)


// 计算属性
const filteredModels = computed(() => {
  let result = [...models.value]

  totalCount.value = result.length

  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

// 方法
const formatTime = (timeStr) => {
  const date = new Date(timeStr)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour12: false })
}


const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 生命周期
// onMounted(() => {
//   const stored = getAllModels()
//   if (stored.length) {
//     models.value = stored
//   } else {
//     models.value = defaultModels
//     saveModels(models.value)
//   }
//   totalCount.value = models.value.length
// })
// 删除改为调用 removeModel
// const deleteModel = (model) => {
//   ElMessageBox.confirm(`确定要删除模型"${model.modelName}"吗？`, '确认删除', {
//     confirmButtonText: '确定',
//     cancelButtonText: '取消',
//     type: 'warning'
//   }).then(() => {
//     removeModel(model.id)
//     const idx = models.value.findIndex(m => m.id === model.id)
//     if (idx > -1) models.value.splice(idx, 1)
//     totalCount.value = models.value.length
//     ElMessage.success('删除成功')
//   })
// }

onMounted(async () => {
  await getAllModels()
})

const getAllModels = async () => {
  try {
    loading.value = true
    const res = await request({
      url: '/aiModel/selectModel',
      method: 'get'
    })
    if (res.code) {
      //to show modelNames in console
      console.log('Received models:', res.data)
      const list = Array.isArray(res?.data?.list) ? res.data.list
        : Array.isArray(res?.data) ? res.data
          : []
      models.value = list.map(it => ({
        id: it.modelInfoId,
        modelName: it.modelName ,
        modelType: it.modelType ?? (it.accessUrl ? 'api' : 'local'),
        apiOrWeight: it.accessUrl ?? it.apiOrWeight ?? '',
        description: it.description ?? '',
        createTime: it.createTime ?? it.gmtCreate ?? it.createdAt ?? nowString(),
        updateTime: it.updateTime ?? it.gmtModified ?? it.updatedAt ?? nowString(),
        status: it.status ?? 'active'
      }))

      totalCount.value = models.value.length
    }

  } catch (e) {
    ElMessage.error(e?.message || '请求失败')
    console.error('Failed to get all models:', e)
  } finally {
    loading.value = false
  }
}

const deleteModel = (model) => {
  ElMessageBox.confirm(`确定要删除模型"${model.modelName}"吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      loading.value = true
      const res = await request({
        url: '/aiModel/deleteModel',
        method: 'delete', // 如后端要求 DELETE，可改为 'delete'
        params: { modelInfoId: model.id } // 使用 params 传参
      })
      if (res.code) {
        const idx = models.value.findIndex(m => m.id === model.id)
        if (idx > -1) models.value.splice(idx, 1)
        totalCount.value = models.value.length
        ElMessage.success('删除成功')

      } else {
        ElMessage.error(res?.message || res?.msg || '删除失败')
      }
    } catch (e) {
      ElMessage.error(e?.message || '请求失败')
    } finally {
      loading.value = false
    }
  })
}

// 监听变化写回本地
watch(models, (val) => {
  saveModels(val)
}, { deep: true })
</script>

<style scoped>
.my-model-page {
  max-width: 1900px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
}

/* 页面头部 */
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

.title-icon {
  font-size: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  font-size: 14px;
  color: #6c757d;
  margin: 0;
}


/* 表格容器 */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.model-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.model-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.model-info .name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.model-info .description {
  font-size: 12px;
  color: #6c757d;
}

.api-weight-cell {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #495057;
  word-break: break-all;
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c757d;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* 分页 */
.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #e9ecef;
}

/* 对话框样式 */
.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

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
}

:deep(.el-table .el-table__body-wrapper tr:hover td) {
  background-color: #f0f9ff;
}

/* 按钮美化 */
:deep(.el-button--primary) {
  padding: 12px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4361ee, #4895ef);
  border: none;
  box-shadow: 0 8px 20px rgba(67, 97, 238, 0.15);
  transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .my-model-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }

  .toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }
}
</style>