<template>
    <div class="project-list-page">
        <div class="page-header">
            <h2>选型管理</h2>
            <el-button type="primary" size="large" class="btn-primary" @click="createTask()" :loading="loading">
                新建选型
            </el-button>
        </div>

        <div v-if="favoriteSelections.length > 0" class="favorite-section">
            <div class="section-header">
                <h3>
                    <el-icon>
                        <Star />
                    </el-icon>
                    常用项目
                </h3>
            </div>
            <div class="favorite-projects">
                <div v-for="project in favoriteSelections" :key="project.id" class="favorite-project-card"
                    @click="openDetail(project)">
                    <div class="card-content">
                        <div class="card-title">{{ project.name }}</div>
                        <div class="card-type">{{ project.type }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="toolbar">
            <div class="toolbar-left">
                <el-input v-model="searchKeyword" placeholder="搜索项目名称..." class="search-box" clearable>
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
            </div>
            <div class="toolbar-right">
                <el-select v-model="sortBy" placeholder="排序方式" style="width: 160px">
                    <el-option label="创建时间" value="createTime" />
                    <el-option label="更新时间" value="updateTime" />
                    <el-option label="项目名称" value="name" />
                </el-select>
                <el-button @click="refreshList">
                    <el-icon>
                        <Refresh />
                    </el-icon>
                    刷新
                </el-button>
            </div>
        </div>

        <div class="projects-table-container">
            <el-table :data="filteredSelections" style="width: 100%" stripe v-loading="loading">
                <el-table-column prop="name" label="项目名称">
                    <template #default="scope">
                        <div class="table-name-cell">
                            <div class="name-info">
                                <div class="name" style="margin-left: 15px;">
                                    {{ scope.row.name }}
                                    <el-tag v-if="scope.row.isFavorite" type="warning" size="small"
                                        style="margin-left: 8px;">
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

                <el-table-column label="所选数据集" width="250">
                    <template #default="scope">
                        <div class="dataset-cell" :title="scope.row.datasetName || '-'">
                            {{ scope.row.datasetName || '-' }}
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="结果展示">
                    <template #default="scope">
                        <div class="result-brief truncate"
                            :title="`${scope.row.lastPrompt || '-'} · ${scope.row.modelName || '-'}`">
                            <span class="prompt">{{ scope.row.lastPrompt || '-' }}</span>
                            <span class="divider"> · </span>
                            <span class="model">{{ scope.row.modelName || '-' }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="操作" fixed="right">
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
                            <el-button type="primary" size="small" @click="openDetail(scope.row)">
                                <el-icon>
                                    <View />
                                </el-icon>
                                查看
                            </el-button>
                            <el-button type="danger" size="small" @click="deleteSelection(scope.row)">
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

        <el-empty v-if="!loading && !filteredSelections.length" description="暂无选型项目" />

        <el-dialog v-model="detailVisible" title="Prompt & 模型详情" width="640px">
            <div class="detail-block">
                <div class="detail-label">最终 Prompt</div>
                <pre class="code">{{ detailItem?.lastPrompt || '-' }}</pre>
            </div>
            <div class="detail-block">
                <div class="detail-label">所用模型</div>
                <el-tag type="success" effect="plain">{{ detailItem?.modelName || '-' }}</el-tag>
            </div>
            <div class="detail-block">
                <div class="detail-label">所选数据集</div>
                <el-tag effect="plain">{{ detailItem?.datasetName || '-' }}</el-tag>
            </div>
            <template #footer>
                <el-button @click="detailVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Star, StarFilled, Delete, View } from '@element-plus/icons-vue'
import request from '@/utils/request'
import router from '@/router'
const LOCAL_KEY = 'selectionProjectsCache'


const loading = ref(false)
const searchKeyword = ref('')
const sortBy = ref('updateTime')

const selections = ref([])
const detailVisible = ref(false)
const detailItem = ref(null)


// function loadLocalCached() {
//     const cacheRaw = localStorage.getItem(LOCAL_KEY)
//     const list = Array.isArray(JSON.parse(cacheRaw || '[]')) ? JSON.parse(cacheRaw || '[]') : []
//     return list.map(item => ({
//         id: item.id,
//         name: item.name,
//         lastPrompt: item.lastPrompt,
//         modelName: item.modelName,
//         datasetName: item.datasetName,
//         scenarioName: item.scenarioName,
//         isFavorite: !!item.isFavorite,
//         createTime: item.createTime,
//         updateTime: item.updateTime,
//         type: item.type || '选型项目',
//         raw: item,
//         source: 'local'
//     }))
// }
const favoriteSelections = computed(() => selections.value.filter(i => i.isFavorite))
const mockEnabled = true
// const mockSelections = [
//   {
//     id: 'mock-1',
//     name: '金融风险分析',
//     lastPrompt : `# 任务指令：生成交易反欺诈风险评分规则

// ## 1. 角色
// 你是一名资深的风险策略分析师，在金融科技领域拥有超过5年的经验，专注于支付欺诈识别与防控策略的设计。

// ## 2. 背景与目标
// - **核心目标：** 构建一个可操作的风险评分卡，用于实时评估交易欺诈风险。
// - **风险类型：** 交易欺诈（盗刷、账户盗用）。
// - **数据基础：** 规则需基于以下两类数据生成：
//     - **账户画像：** 账户年龄、历史交易次数、账户等级、注册证件类型、历史欺诈标记。
//     - **交易行为：** 交易金额、交易时间（小时）、交易国家/地区、收款方历史关联情况、登录设备与常用设备是否一致、IP地址与常用地是否一致。

// ## 3. 任务要求

// ### 3.1 输出格式与规范
// - **格式：** 必须使用Markdown表格呈现。
// - **表格列定义：**
//     - \`风险特征\`：所考察的风险维度（如：交易金额异常、设备异常）。
//     - \`判断条件\`：具体的、可编程的逻辑判断条件（使用if-then风格的描述）。
//     - \`风险分值\`：触发此规则所应累加的分数。分数范围建议为-10（低风险）至+10（高风险）。对于应直接阻断交易的**硬规则**，请标注为\`[硬规则] +100\`。
//     - \`规则理由\`：简要解释此规则背后的业务逻辑和风险考量。

// ### 3.2 内容与逻辑要求
// - **规则数量：** 生成10条左右具有代表性且逻辑互异的规则。
// - **规则深度：** 鼓励使用**特征组合**来定义规则（例如，结合"交易金额"、"账户年龄"和"交易地点"），而非仅使用单一特征。
// - **范例参考：**
//     | 风险特征 | 判断条件 | 风险分值 | 规则理由 |
//     | :--- | :--- | :--- | :--- |
//     | 交易时间异常 & 账户年龄 | \`交易时间在凌晨2-5点之间\` 且 \`账户年龄 < 7天\` | +15 | 新账户在用户活跃度极低的睡眠时间段发起交易，行为模式异常，欺诈概率显著提升。 |

// ### 3.3 禁止与避免事项
// - **禁止：** 规则条件不得超出"第2条-背景与目标"中定义的输入数据维度。
// - **避免：** 避免创建过于绝对或显然不合理的规则（例如："所有交易都有风险"）。`,
//     modelName: 'gpt-4o-mini',
//     datasetName: '金融交易数据集',
//     isFavorite: true,
//     createTime: new Date().toISOString(),
//     updateTime: new Date().toISOString(),
//     type: '选型项目',
//     raw: { datasetList: ['金融交易数据集'], model: 'gpt-4o-mini' }
//   },
//   {
//     id: 'mock-2',
//     name: '客服意图识别',
//     lastPrompt : `# 任务指令：优化意图分类体系并生成测试集

// ## 1. 角色
// 你是一名资深的NLU（自然语言理解）工程师，擅长设计对话系统和意图分类框架。

// ## 2. 任务概述
// 请首先为一个指定的业务领域优化其意图分类体系，随后基于优化后的体系，生成一个包含10条语句的测试集，用于评估意图识别模型的性能。

// ## 3. 第一部分：优化意图分类体系

// ### 3.1 领域与范围
// - **业务领域：** 银行与金融服务智能客服。
// - **范围说明：** 体系需覆盖零售银行客户常见的查询、办理和咨询业务。

// ### 3.2 体系设计规范
// - **结构：** 采用**两级分类**层级（一级意图 -> 二级意图）。
// - **核心原则：** 必须遵循**MECE原则**（Mutually Exclusive, Collectively Exhaustive），确保类别之间界限清晰、无重叠，并能共同覆盖绝大多数用户需求。
// - **设计目标：** 体系应具备**可扩展性**（便于未来新增意图）和**实用性**（便于模型训练与标注）。
// - **范例参考：**
//     - \`一级意图： 信用卡业务\`
//         - \`二级意图： 申请办卡\`
//         - \`二级意图： 查询账单\`
//         - \`二级意图： 报告盗刷\`

// ### 3.3 输出要求
// - **格式：** 请使用Markdown的无序列表格式输出优化后的完整体系。

// ## 4. 第二部分：生成测试集

// ### 4.1 测试集构成
// 请生成**10条**符合真实用户习惯的提问。它们必须包含以下三种测试类型：

// 1.  **覆盖性测试 (4条):**
//     - **目的：** 验证模型对核心意图的基本识别能力。
//     - **要求：** 提问应清晰、直接，对应单一明确的目标意图。

// 2.  **边界案例测试 (3条):**
//     - **目的：** 测试模型区分相似意图和处理复杂查询的能力。
//     - **要求：** 提问可同时涉及多个意图、使用模糊表述、或处于两个意图的边界。

// 3.  **对抗性测试 (3条):**
//     - **目的：** 测试模型的鲁棒性和容错能力。
//     - **要求：** 提问应包含错别字、口语化/网络用语、语法错误或关键信息缺失。

// ### 4.2 输出要求
// - **格式：** 必须使用Markdown表格输出。
// - **表格列定义：**
//     - **测试提问 (Test Utterance)：** 用户的原始提问文本。
//     - **目标一级意图 (Target Level-1 Intent)：** 该提问最应被分到的一级意图类别。
//     - **测试类型 (Test Type):** 注明是 \`覆盖\`、\`边界\` 还是 \`对抗\`。`,
//     modelName: 'qwen-plus',
//     datasetName: '客服对话语料',
//     isFavorite: false,
//     createTime: new Date().toISOString(),
//     updateTime: new Date().toISOString(),
//     type: '选型项目',
//     raw: { datasetList: ['客服对话语料'], model: 'qwen-plus' }
//   },
//   {
//     id: 'mock-3',
//     name: '商品标题生成',
//     lastPrompt: '##任务指令：根据商品属性生成高转化短标题，需≤20字。',
//     modelName: 'glm-4-flash',
//     datasetName: '电商商品属性表',
//     isFavorite: false,
//     createTime: new Date().toISOString(),
//     updateTime: new Date().toISOString(),
//     type: '选型项目',
//     raw: { datasetList: ['电商商品属性表'], model: 'glm-4-flash' }
//   }
// ]

// const loadSelections = async () => {
//     loading.value = true
//     try {
//         const res = await request.get('/prompt/selectAllTask')
//         if (res?.code !== 200) {
//             ElMessage.error(res?.msg || '获取列表失败')
//             selections.value = []
//             return
//         }
//         const list = Array.isArray(res.data) ? res.data : []
//         selections.value = list.map(item => ({
//             id: item.promptTaskId,
//             name: item.projectName || item.originalPrompt || `选型项目-${item.promptTaskId}`,
//             lastPrompt: item.resultPrompt || item.finalPrompt || item.originalPrompt || '',
//             modelName: item.modelName || item.model || '-',
//             datasetName: item.datasetName || item.datasetList?.join?.(', ') || '-',
//             isFavorite: !!item.isFavorite,
//             createTime: item.createTime || new Date().toISOString(),
//             updateTime: item.updateTime || new Date().toISOString(),
//             type: '选型项目', // 新增：用于卡片展示与调优页一致
//             raw: item
//         }))
//     } catch (e) {
//         selections.value = []
//         ElMessage.error(e?.message || '获取列表失败')
//     } finally {
//         loading.value = false
//     }
// }

const loadSelections = async () => {
    loading.value = true
    try {
        const res = await request.get('/adviceTask/selectAll')
        console.log('Fetched selection projects:', res)
        let backendList = []
        if (res?.code === 200 && Array.isArray(res.data)) {
            backendList = res.data.map(item => ({
                id: item.evalAdviceId,
                name: item.evalAdviceName,
                lastPrompt: item.resultPrompt,
                modelName: item.favorableModelName,
                scenarioName: item.scenarioName,
                datasetName: item.datasetName,
                isFavorite: item.isFavorite,
                createTime: item.createTime || new Date().toISOString(),
                updateTime: item.updateTime || new Date().toISOString(),
                type: '选型项目',
                raw: item,
                source: 'backend'
            }))
            // console.log("查看返回响应:", backendList)
        } else {
            if (res) ElMessage.error(res?.msg || '获取列表失败')
        }
        // const localList = loadLocalCached()
        const merged = [...backendList]
        const existingIds = new Set(merged.map(i => i.id))
        // localList.forEach(l => {
        //     if (!existingIds.has(l.id)) merged.push(l)
        // })
        selections.value = merged
    } catch (e) {
        // selections.value = loadLocalCached()
        ElMessage.error(e?.message || '获取列表失败')
    } finally {
        // 注入模拟数据（保留原逻辑）
        if (mockEnabled) {
            const existingIds = new Set(selections.value.map(i => i.id))
            //   const append = mockSelections.filter(m => !existingIds.has(m.id))
            selections.value = [...selections.value]
        }
        loading.value = false
    }
}
// 删除时区分本地与后端
const deleteSelection = (row) => {
    const isLocal = row.source === 'local' || String(row.id).startsWith('local-')
    ElMessageBox.confirm(`确定要删除项目 "${row.name}" 吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        try {
            loading.value = true
            if (isLocal) {
                // 本地删除
                const cacheRaw = localStorage.getItem(LOCAL_KEY)
                const cache = Array.isArray(JSON.parse(cacheRaw || '[]')) ? JSON.parse(cacheRaw || '[]') : []
                const idxCache = cache.findIndex(c => c.id === row.id)
                if (idxCache > -1) cache.splice(idxCache, 1)
                localStorage.setItem(LOCAL_KEY, JSON.stringify(cache))
                const idx = selections.value.findIndex(p => p.id === row.id)
                if (idx > -1) selections.value.splice(idx, 1)
                ElMessage.success('已删除本地项目')
            } else {
                // 后端删除
                const res = await request.delete('/adviceTask/deleteById', { params: { evalAdviceId: row.id } })
                if (res?.code !== 200) {
                    ElMessage.error(res?.msg || '删除失败')
                    return
                }
                const idx = selections.value.findIndex(p => p.id === row.id)
                if (idx > -1) selections.value.splice(idx, 1)
                ElMessage.success('删除成功')
            }
        } catch (err) {
            ElMessage.error(err?.message || '删除失败，请稍后重试')
        } finally {
            loading.value = false
        }
    }).catch(() => { })
}

const filteredSelections = computed(() => {
    let list = [...selections.value]
    if (searchKeyword.value) {
        const kw = searchKeyword.value.toLowerCase()
        list = list.filter(p =>
            (p.name || '').toLowerCase().includes(kw) ||
            (p.lastPrompt || '').toLowerCase().includes(kw) ||
            (p.modelName || '').toLowerCase().includes(kw)
        )
    }
    list.sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return b.isFavorite - a.isFavorite
        if (sortBy.value === 'name') return (a.name || '').localeCompare(b.name || '')
        if (sortBy.value === 'createTime' || sortBy.value === 'updateTime') {
            return new Date(b[sortBy.value]) - new Date(a[sortBy.value])
        }
        return 0
    })
    return list
})


const refreshList = () => loadSelections()


const toggleFavorite = async (id, isFavorite) => {
    try {
        const next = isFavorite ? 0 : 1
        const res = await request({
            url: '/adviceTask/updateFavorite',
            method: 'put',
            params: { evalAdviceId: id, isFavorite: next }
        })
        if (res.code !== 200) {
            ElMessage.error(res?.msg || '操作失败')
            return
        }
        const target = selections.value.find(p => p.id === id)
        if (target) target.isFavorite = !!next
        ElMessage.success(next ? '已设为常用项目' : '已取消常用项目')
    } catch (e) {
        ElMessage.error(e?.message || '操作失败')
    }
}

// const deleteSelection = (row) => {
//     ElMessageBox.confirm(`确定要删除项目 "${row.name}" 吗？`, '确认删除', {
//         confirmButtonText: '确定',
//         cancelButtonText: '取消',
//         type: 'warning'
//     }).then(async () => {
//         try {
//             loading.value = true
//             const res = await request.delete('/prompt/deleteTask', {
//                 params: { promptTaskId: row.id }
//             })
//             if (res?.code !== 200) {
//                 ElMessage.error(res?.msg || '删除失败')
//                 return
//             }
//             const idx = selections.value.findIndex(p => p.id === row.id)
//             if (idx > -1) selections.value.splice(idx, 1)
//             ElMessage.success('删除成功')
//         } catch (err) {
//             ElMessage.error(err?.message || '删除失败，请稍后重试')
//         } finally {
//             loading.value = false
//         }
//     }).catch(() => { })
// }

const openDetail = (row) => {
    detailItem.value = row
    detailVisible.value = true
}

onMounted(loadSelections)

const createTask = () => {
    router.push('/main/intelligence-select')
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

.summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.summary-card {
    border-radius: 16px;
    padding: 20px;
    color: #fff;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.summary-card .card-title {
    font-size: 14px;
    opacity: 0.85;
    margin-bottom: 6px;
}

.summary-card .card-value {
    font-size: 28px;
    font-weight: 700;
}

.summary-card.primary {
    background: linear-gradient(135deg, #4361ee, #4895ef);
}

.summary-card.success {
    background: linear-gradient(135deg, #2dce89, #2ebf76);
}

.summary-card.info {
    background: linear-gradient(135deg, #5c6ac4, #6c63ff);
}

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

.search-box {
    width: 300px;
}

.table-actions {
    gap: 8px;
    display: flex;
}

.name-info .name {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
}

.name-info .time {
    font-size: 12px;
    color: #8d99ae;
}

.dataset-cell {
    max-width: 200px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: #4a4a4a;
}

.result-brief {
    color: #6c757d;
    font-size: 14px;
    line-height: 1.5;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.result-brief.truncate {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.result-brief .prompt {
    color: #2c3e50;
}

.result-brief .divider {
    color: #b1b6bd;
    padding: 0 6px;
}

.result-brief .model {
    color: #409eff;
}

.detail-block {
    margin-bottom: 16px;
}

.detail-label {
    font-weight: 600;
    margin-bottom: 6px;
    color: #2c3e50;
}

.code {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
    padding: 10px;
    background: #f8f9fa;
    border: 1px solid #eef2f7;
    border-radius: 6px;
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

.favorite-projects {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
}

.favorite-project-card {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
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
</style>