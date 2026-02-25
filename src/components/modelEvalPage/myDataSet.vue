<template>
  <div class="my-model">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          我的数据集
        </h2>
        <!-- <p class="desc">管理和查看您创建的所有评测集</p> -->
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="createNewDataset" style="font-size: 14px;" size="large">
          新建数据集
        </el-button>
      </div>
    </div>

    <div class="content-section">


      <!-- 评测集卡片/列表 -->
      <div v-if="viewMode === 'card'" class="datasets-grid">
        <div v-for="dataset in filteredDatasets" :key="dataset.id" class="dataset-card" >
          <div class="card-header">
            <div class="dataset-info">
              <h3 class="dataset-name">{{ dataset.name }}</h3>
              <div class="dataset-meta">
                <el-tag :type="statusTagType(dataset.status)" size="small" effect="plain">
                  {{ statusLabel(dataset.status) }}
                </el-tag>
              </div>
            </div>
            <div class="card-actions">
              <el-dropdown @command="handleAction" trigger="click">
                <el-button type="text" size="normal">
                  <el-icon>
                    <MoreFilled />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="viewDataset(dataset)">
                      <el-icon>
                        <Edit />
                      </el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item @click="deleteDataset(dataset.evalDatasetId)" divided>
                      <el-icon>
                        <Delete />
                      </el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div class="card-content">
            <p class="dataset-description">{{ dataset.description || '暂无描述' }}</p>


            <div class="dataset-tags">
              <!-- 替换为显示应用场景，兼容历史 tags -->
              <el-tag v-for="tag in (dataset.scenes || dataset.tags || []).slice(0, 3)" :key="tag" size="small"
                type="primary" effect="plain">
                {{ tag }}
              </el-tag>
              <el-tag v-if="(dataset.scenes || dataset.tags || []).length > 3" size="small" type="info" effect="plain">
                +{{ (dataset.scenes || dataset.tags || []).length - 3 }}
              </el-tag>
            </div>
          </div>

          <div class="card-footer">
            <div class="time-info">
              <div class="create-time">
                <el-icon>
                  <Calendar />
                </el-icon>
                <span>创建于 {{ formatTime(dataset.createTime) }}</span>
              </div>
              <!-- <div class="update-time">
                <el-icon>
                  <Clock />
                </el-icon>
                <span>更新于 {{ formatTime(dataset.updateTime) }}</span>
              </div> -->
            </div>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="datasets-list">
        <el-table :data="filteredDatasets" style="width: 100%" @row-click="viewDataset">
          <el-table-column prop="name" label="评测集名称" min-width="200">
            <template #default="scope">
              <div class="table-name">
                <span class="name-text">{{ scope.row.name }}</span>
                <el-tag :type="getDirectionTagType(scope.row.direction)" size="small" effect="plain">
                  {{ getDirectionLabel(scope.row.direction) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <!-- 
          <el-table-column prop="visibility" label="可见性" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.visibility === 'public' ? 'success' : 'info'" size="small">
                <el-icon>
                  <Globe v-if="scope.row.visibility === 'public'" />
                  <Lock v-else />
                </el-icon>
                {{ scope.row.visibility === 'public' ? '公开' : '私有' }}
              </el-tag>
            </template>
          </el-table-column> -->

          <el-table-column prop="dataCount" label="数据量" width="100" sortable />
          <el-table-column prop="evaluationCount" label="评测次数" width="120" sortable />
          <el-table-column prop="createTime" label="创建时间" width="180" sortable>
            <template #default="scope">
              {{ formatTime(scope.row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" width="180" sortable>
            <template #default="scope">
              {{ formatTime(scope.row.updateTime) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button size="small" @click.stop="editDataset(scope.row)">
                编辑
              </el-button>
              <el-button size="small" type="danger" @click.stop="deleteDataset(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredDatasets.length === 0" class="empty-state">
        <div class="empty-icon">
          <el-icon>
            <DocumentAdd />
          </el-icon>
        </div>
        <h3>暂无评测集</h3>
        <p>您还没有创建任何评测集，点击上方按钮开始创建吧！</p>
        <el-button type="primary" @click="createNewDataset">
          <el-icon>
            <Plus />
          </el-icon>
          新建评测集
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { saveDataSets, getDataSets } from '@/utils/localData'

const router = useRouter()

// 响应式数据
const searchKeyword = ref('')
const visibilityFilter = ref('all')
const sortBy = ref('createTime')
const viewMode = ref('card')
const loading = ref(false)

// 模拟数据
const datasets = ref([])


function statusLabel(s) {
  return s === 2 ? '审核中'
    : s === 1 ? '通过'
      : s === 0 ? '退回'
        : s || '-'
}

function statusTagType(s) {
  return s === 2 ? 'warning'
    : s === 1 ? 'success'
      : s === 0 ? 'danger'
        : 'info'
}



// 计算属性
const filteredDatasets = computed(() => {
  let result = [...datasets.value]

  // 搜索过滤
  if (searchKeyword.value) {
    result = result.filter(dataset =>
      dataset.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  // 可见性过滤
  if (visibilityFilter.value !== 'all') {
    result = result.filter(dataset => dataset.visibility === visibilityFilter.value)
  }

  // 排序
  result.sort((a, b) => {
    if (sortBy.value === 'createTime' || sortBy.value === 'updateTime') {
      return new Date(b[sortBy.value]) - new Date(a[sortBy.value])
    } else if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name)
    }
    return 0
  })

  return result
})

// 方法
const formatTime = (timeStr) => {
  const date = new Date(timeStr)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour12: false })
}

const getDirectionTagType = (direction) => {
  const typeMap = {
    'text-classification': 'primary',
    'sentiment-analysis': 'success',
    'reading-comprehension': 'info',
    'dialogue-generation': 'warning',
    'text-summarization': 'danger',
    'machine-translation': 'primary',
    'text-generation': 'warning'
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
    'text-generation': '文本生成'
  }
  return labelMap[direction] || ''
}

const createNewDataset = () => {
  router.push('/main/dataset-submit')
}

const loadDatasets = async () => {
  try {
    loading.value = true
    const res = await request({
      url: '/file/dataSets/all',
      method: 'get'
    })
    console.log('获取数据集响应:', res)
    const ok = res && res.code === 200
    const list = ok && Array.isArray(res?.data) ? res.data : []
    datasets.value = list.map(item => ({
      evalDatasetId: item.evalDatasetId,
      name: item.datasetName,
      scenarioName: item.scenarioName || '',
      fileFormat: item.fileFormat || '',
      fileSize: item.fileSize || 0,
      sampleCount: item.sampleCount || 0,
      isValidated: item.isValidated === true,
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
      minioBucket: item.minioBucket || '',
      minioObjectPath: item.minioObjectPath || '',
      status: item.isValidated,
      description: item.remark,
    }))
  } catch (err) {
    ElMessage.error(err?.message || '获取数据集失败')
    datasets.value = []
  } finally {
    loading.value = false
  }
}

const viewDataset = (dataset) => {
  ElMessageBox.confirm(`是否进入数据集详情页面`, '确认进入', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    router.push(`/main/dataset-detail/${dataset.evalDatasetId}`)
  })
}

const editDataset = (dataset) => {
  // router.push(`/main/dataset-detail/${dataset.id}?tab=settings`)
  console.log("编辑操作")
}

const deleteDataset = (id) => {
    ElMessageBox.confirm('此操作将永久删除该数据集，是否继续？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async() => {
        const res= await request({
          url: `/file/dataSets/${id}`,
          method: 'delete'
        })
        if (res.code!==200) {
          ElMessage.error(res?.msg || '删除数据集失败')
          return
        }
        ElMessage.success('删除成功')
        loadDatasets()
    })
}

const handleAction = (command) => {
  const [action, id] = command.split('-')
  const dataset = datasets.value.find(d => d.id === parseInt(id))

  switch (action) {
    case 'edit':
      // editDataset(dataset)
      // router.push("/main/dataset-detail")
      router.push(`/main/dataset-detail/${dataset.id}`)
      break
    case 'duplicate':
      ElMessage.info('复制功能开发中...')
      break
    case 'delete':
      deleteDataset(dataset)
      break
  }
}

// 持久化到本地存储：dataSetsData
// onMounted(() => {
//   const stored = getDataSets()
//   if (Array.isArray(stored) && stored.length) {
//     // 仅当旧数据确实完全没有 status 字段时给一个默认值（建议 pending）
//     stored.forEach(d => {
//       if (d.status === undefined) d.status = 'pending'
//     })
//     datasets.value = stored
//   }
//   try { saveDataSets(datasets.value) } catch {}
// })
onMounted(() => {
  loadDatasets()
})
watch(datasets, (val) => {
  try { saveDataSets(val) } catch { }
}, { deep: true })
</script>

<style scoped>
.my-model {
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

.header-content {
  flex: 1;
}


.title-icon {
  font-size: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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

.header-icon {
  color: #3a7afe;
  margin-right: 8px;
}

.page-header .desc {
  color: #6b7785;
  font-size: 14px;
  margin: 0;
}


/* 内容区域 */
.content-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 卡片网格 */
.datasets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.dataset-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(233, 236, 239, 0.6);
}

.dataset-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.dataset-name {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.dataset-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-content {
  margin-bottom: 20px;
}

.dataset-description {
  color: #6c757d;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dataset-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6c757d;
  font-size: 13px;
}

.dataset-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 16px;
  border-top: 1px solid rgba(233, 236, 239, 0.6);
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.create-time,
.update-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6c757d;
  font-size: 12px;
}

/* 列表视图 */
.datasets-list {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.table-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.name-text {
  font-weight: 600;
  color: #2c3e50;
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
  .my-model {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }

  .filters-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .datasets-grid {
    grid-template-columns: 1fr;
  }

  .dataset-stats {
    flex-direction: column;
    gap: 8px;
  }

  .card-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>