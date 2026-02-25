<template>
  <div class="tpl-page">
    <div class="page-header">
      <h2>
        Prompt模板
      </h2>
      <p class="desc">
        管理和查看prompt模板，支持在服务调用时组合prompt输入推理，prompt模板使用方式详见
        <a href="javascript:void(0)" @click="openGuide">帮助手册</a>
      </p>
    </div>
    <!-- Tabs + 工具条 -->
    <el-tabs v-model="activeTab" class="page-tabs">
      <el-tab-pane label="自制模板" name="preset">
        <div class="toolbar">
          <div class="left">
            <el-button type="primary" plain @click="goToCreate">
              <el-icon>
                <Plus />
              </el-icon>
              创建模板
            </el-button>

            <el-input v-model="keyword" placeholder="输入模板名称、模板ID、内容要点" clearable class="search">
              <template #prefix><el-icon>
                  <Search />
                </el-icon></template>
            </el-input>
          </div>
          <div class="right">
            <el-select v-model="sortBy" placeholder="默认排序" class="sort" popper-class="tpl-popper">
              <el-option label="默认排序" value="default" />
              <el-option label="最热" value="hot" />
              <el-option label="最新" value="new" />
            </el-select>
          </div>
        </div>


        <template v-if="mineList.length">
          <el-row :gutter="16" class="cards-grid">
            <el-col v-for="item in mineList" :key="item.id" :xs="24" :md="6">
              <el-card class="tpl-card" shadow="hover" @click="openDetail(item)">
                <div class="tpl-title">{{ item.title }}</div>
                <div class="tpl-brief">{{ item.brief }}</div>
                <div class="card-footer">
                  <div class="time-info">
                    <div class="create-time">
                      <el-icon>
                        <Calendar />
                      </el-icon>
                      <span>创建于 {{ new Date(item.createdAt).toLocaleString() }}</span>
                      <div class="btns" style="margin-left:40px;display:flex;">
                        <el-button text type="primary" @click.stop="copyTemplate(item)">复制</el-button>
                        <el-button v-if="item.owner === 'me'" text type="danger"
                          @click.stop="deleteTemplate(item)">删除</el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </template>
        <el-empty v-else description="暂无自制模板" />

      </el-tab-pane>

    </el-tabs>


    <el-dialog v-model="detailVisible" :title="detailItem?.title || '模板详情'" width="720px">
      <template v-if="detailItem">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <!-- <el-tag size="small" type="danger" effect="light">{{ detailItem.category }}</el-tag> -->
          <!-- <el-tag v-if="detailItem.owner === 'me'" size="small" type="info" effect="plain">自制</el-tag> -->
        </div>
        <div style="display:flex;gap:16px;color:#8b99a9;font-size:12px;margin-bottom:12px;">
          <div v-if="detailItem.createdAt">创建时间：{{ new Date(detailItem.createdAt).toLocaleString() }}</div>
        </div>
        <el-divider content-position="left">简介</el-divider>
        <div style="white-space:pre-wrap;color:#4b5563;margin-bottom:12px;">{{ detailItem.brief || '（暂无简介）' }}</div>
        <el-divider content-position="left">Prompt 内容</el-divider>
        <el-input v-model="detailContent" type="textarea" :rows="10" readonly />
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="optimizeCurrent">优化</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Plus,
  Search,
  ArrowRight,
  MagicStick,
  CollectionTag,
  Document,
  Grid,
  Menu,
  Star,
  View
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import request from '@/utils/request.js'

const router = useRouter()

async function deleteTemplate(item) {
  if (!item || item.owner !== 'me') return
  try {
    await ElMessageBox.confirm('确认删除该模板？删除后不可恢复', '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  const templateId = item.templateId || item.id
  if (!templateId) {
    ElMessage.error('缺少模板ID')
    return
  }
  try {
    const res = await request({
      url: '/prompt/deleteTemplate',
      method: 'delete',
      params: { templateId }
    })
    if (res?.code !== 200) {
      ElMessage.error(res?.msg || '删除失败')
      return
    }
    templates.value = templates.value.filter(t => (t.templateId || t.id) !== templateId)
    ElMessage.success('删除成功')
  } catch (e) {
    ElMessage.error(e?.message || '删除接口异常')
  }
}

// 跳转功能
function goToCreate() {
  // 生成 1-100（含）之间的随机 ID
  // let newId = Math.floor(Math.random() * 100) + 1
  // const used = new Set(templates.value.map(t => t.id))
  // let guard = 0
  // while (used.has(newId) && guard < 10) {
  //   newId = Math.floor(Math.random() * 100) + 1
  //   guard++
  // }
  router.push({ path: '/main/prompt-create' })
}
function goToOptimize() {
  router.push({ path: '/main/prompt-optimize' })
}
// function goToEvaluate() {
//   router.push({ path: '/prompt/evaluate' })
// }

const STORAGE_KEY = 'prompt_templates_v1'

const activeTab = ref('preset')
const keyword = ref('')
const sortBy = ref('default')
const viewMode = ref('grid')
const selectedCate = ref('全部')

const page = ref(1)
const pageSize = ref(12)

const createVisible = ref(false)
const form = ref({ title: '', category: '', brief: '', content: '' })

const categories = [
  '全部',
  '图像生成',
  '数据分析',
  '营销文案',
  '生活助手',
  '教育培训',
  '代码编程',
  '职场效率',
  '医疗助手',
  '翻译助理',
  '创意写作',
  '文心一言'
]

// 数据源（本地存储）
const templates = ref([])

// 详情弹窗
const detailVisible = ref(false)
const detailItem = ref(null)
const detailContent = ref('')

function openDetail(item) {
  detailItem.value = item
  detailContent.value = item.content || item.brief || ''
  detailVisible.value = true
}

function seedIfEmpty() {
  if (templates.value.length) return
  const now = Date.now()
  templates.value = []
}

// function loadFromStorage() {
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY)
//     if (raw) templates.value = JSON.parse(raw)
//     seedIfEmpty()
//   } catch {
//     seedIfEmpty()
//   }
// }
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates.value))
}
const loadPromptTemplates = async () => {
  try {
    const res = await request.get('/prompt/selectAllTemplate')
    const ok = res?.code === 200
    const list = ok && Array.isArray(res?.data) ? res.data : []
    templates.value = list.map((t, i) => ({
      id: t.templateId ?? (Date.now() + i),
      owner: 'me', // 关键：让 mineList 有数据
      title: t.templateName || '未命名模板',
      brief: t.description || '（暂无简介）',
      content: t.promptContent || '',
      createdAt: t.createTime ? new Date(t.createTime).getTime() : Date.now()
    }))
  } catch (e) {
    templates.value = []
  }
}

onMounted(() => {
  loadPromptTemplates()
})
// onMounted(loadFromStorage)
watch(templates, saveToStorage, { deep: true })

// 过滤 + 排序
const filtered = computed(() => {
  let list = templates.value.slice()

  // Tab 过滤
  if (activeTab.value === 'mine') list = list.filter(t => t.owner === 'me')
  else if (activeTab.value === 'fav') list = list.filter(t => t.collected === true)
  else list = list.filter(t => t.owner === 'system' || t.owner === 'me')

  // 分类过滤
  if (selectedCate.value !== '全部') {
    list = list.filter(t => t.category === selectedCate.value)
  }

  // 关键词
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(t =>
      String(t.title).toLowerCase().includes(kw) ||
      String(t.brief || '').toLowerCase().includes(kw) ||
      String(t.id).includes(kw)
    )
  }

  // 排序
  if (sortBy.value === 'hot') {
    list.sort((a, b) => (b.views + b.fav * 50) - (a.views + a.fav * 50))
  } else if (sortBy.value === 'new') {
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }
  return list
})

const total = computed(() => filtered.value.length)
const pagedList = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch([keyword, selectedCate, sortBy, activeTab], () => { page.value = 1 })

// 供其他 Tab 使用的列表
const mineList = computed(() => templates.value.filter(t => t.owner === 'me'))
const favList = computed(() => templates.value.filter(t => t.collected))

// 交互：复制 / 收藏 / 创建
async function copyTemplate(item) {
  const text = item.brief
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    ElMessage.success('已复制到剪贴板')
  }
}

function toggleCollect(item) {
  item.collected = !item.collected
  ElMessage.success(item.collected ? '已加入收藏' : '已取消收藏')
}

function openCreate() {
  router.push('/main/optimize-create')
}

function createTemplate() {
  const f = form.value
  if (!f.title || !f.category) {
    ElMessage.warning('请填写名称与分类')
    return
  }
  const id = Date.now()
  templates.value.unshift({
    id,
    owner: 'me',
    category: f.category,
    title: f.title,
    brief: f.brief || '（暂无简介）',
    content: f.content || f.brief || f.title,
    fav: 0,
    views: 0,
    collected: false,
    createdAt: Date.now()
  })
  createVisible.value = false
  activeTab.value = 'mine'
  ElMessage.success('创建成功')
}

function optimizeCurrent() {
  if (!detailItem.value) return
  const payload = {
    content: detailItem.value.content,
    title: detailItem.value.title || '',
    ts: Date.now()
  }
  try {
    localStorage.setItem('PROMPT_OPTIMIZE_PREFILL', JSON.stringify(payload))
  } catch { }
  // 生成 1-200 随机 ID，避免已存在重复
  const used = new Set(templates.value.map(t => t.id))
  let newId = Math.floor(Math.random() * 101) + 200
  let guard = 0
  while (used.has(newId) && guard < 200) {
    newId = Math.floor(Math.random() * 101) + 200
    guard++
  }
  detailVisible.value = false
  router.push({ path: '/main/prompt-optimize', query: { promptTaskId: newId } })
}


</script>

<style scoped>
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

.page-header .desc {
  color: #6b7785;
  font-size: 14px;
  margin: 0;
}

.page-header .desc a {
  color: #3a7afe;
  text-decoration: none;
}

.tpl-page {
  max-width: 1900px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
}

/* 顶部功能卡片 */
.feature-row {
  margin-bottom: 20px;
}

.feature-card {
  border-radius: 14px;
  border: 1px solid #eaf0f6;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  cursor: pointer;
}

.fc-body {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.icon-circle.primary {
  background: linear-gradient(135deg, #6aa5ff, #90c2ff);
}

.icon-circle.blue {
  background: linear-gradient(135deg, #5c8dff, #8fb3ff);
}

.icon-circle.purple {
  background: linear-gradient(135deg, #8a7bff, #b09dff);
}

.fc-text .title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2d3d;
}

.fc-text .desc {
  font-size: 13px;
  color: #6b7785;
  margin-top: 4px;
}

.feature-card .arrow {
  margin-left: auto;
  color: #9aa6b2;
}

/* Tabs */
.page-tabs :deep(.el-tabs__header) {
  margin-bottom: 10px;
}

/* 工具条 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0 6px;
}

.toolbar .left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.toolbar .search {
  max-width: 420px;
  flex: 1;
}

.toolbar .right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sort {
  width: 120px;
}

/* 分类标签行 */
.cate-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0 2px;
  border-bottom: 1px solid #eef3fb;
}

.cate-tag {
  padding: 6px 12px;
  border-radius: 18px;
  background: #f4f7fb;
  color: #5a6b7b;
  cursor: pointer;
}

/* 卡片列表 */
.cards-grid {
  margin-top: 14px;
}

.tpl-card {
  position: relative;
  border-radius: 14px;
  border: 1px solid #e6eef7;
  background: #fff;
  box-shadow: 0 8px 24px rgba(31, 89, 214, 0.06);
  margin-bottom: 16px;
  min-height: 210px;
  overflow: hidden;
  cursor: pointer;
  /* 新增：可点击态 */
}

.tpl-card.list {
  min-height: 140px;
}

.tpl-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.tpl-main {
  display: flex;
  gap: 12px;
}

.tpl-side {
  width: 80px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8px;
}

.tpl-content {
  flex: 1;
}

.tpl-header {
  margin-bottom: 8px;
}

.tpl-title {
  font-size: 16px;
  font-weight: 700;
  color: #2f3a4a;
  margin: 6px 0 8px;
}

.tpl-brief {
  font-size: 13px;
  color: #6b7785;
  line-height: 1.7;
  min-height: 64px;
}

.tpl-footer {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  color: #8b99a9;
  font-size: 12px;
}

.metric {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: default;
}

.metric.fav-btn {
  cursor: pointer;
}

.metric.owner {
  color: #3a7afe;
}

.pager-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .tpl-page {
    padding: 16px;
  }
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
</style>