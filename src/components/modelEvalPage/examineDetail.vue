<template>
  <div class="evaluation-detail-page ">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-info">
        <h2 class="page-title">
          {{ evaluationInfo.name }}
        </h2>
      </div>
      <div class="btn-group">
        <el-button size="large" class="btn-outline" @click="goBack">
          <el-icon style="margin-right: 5px;">
            <ArrowLeft />
          </el-icon>
          返回列表
        </el-button>
      </div>
    </div>

    <!-- 评测概览 -->
    <div class="overview-section">
      <div class="overview-card">
        <div class="card-header">
          <h3>评测概览</h3>
        </div>
        <div class="overview-content">
          <div class="overview-grid">
            <div class="overview-item">
              <div class="item-icon model">
                <el-icon>
                  <Cpu />
                </el-icon>
              </div>
              <div class="item-info">
                <div class="item-label">评测模型</div>
                <div class="item-value">{{ evaluationInfo.modelName }}</div>
                <!-- <div class="item-desc">{{ evaluationInfo.modelType }}</div> -->
              </div>
            </div>
            <div class="overview-item">
              <div class="item-icon dataset">
                <el-icon>
                  <Collection />
                </el-icon>
              </div>
              <div class="item-info">
                <div class="item-label">评测数据集</div>
                <div class="item-value">{{ evaluationInfo.datasetName }}</div>
                <!-- <div class="item-desc">{{ evaluationInfo.datasetSize }} 条数据</div> -->
              </div>
            </div>
            <div class="overview-item">
              <div class="item-icon metrics">
                <el-icon>
                  <TrendCharts />
                </el-icon>
              </div>
              <div class="item-info">
                <div class="item-label">评测指标</div>
                <div class="item-value">{{ evaluationInfo.metricsCount }} 项</div>
                <div class="item-desc">{{ evaluationInfo.evaluationMode }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细信息标签页 -->
    <div class="details-section">
      <el-tabs v-model="activeTab" class="evaluation-tabs">
        <div class="results-content">
          <!-- 详细结果表格 -->
          <div class="results-table">
            <div class="table-header">
              <h4>详细结果</h4>
              <div class="table-actions">
                <el-button @click="exportTableData">
                  <el-icon>
                    <Download />
                  </el-icon>
                  导出
                </el-button>
              </div>
            </div>
            <el-table :data="filteredTableData" style="width: 100%" border>
              <el-table-column prop="datasetName" label="数据集" w />
              <!-- 动态指标列：若某指标所有数据集均为 null，则不展示该列 -->
              <el-table-column v-for="col in visibleMetrics" :key="col.key" :prop="col.key" :label="col.label" sortable>
                <template #default="scope">
                  <div class="score-cell">
                    <span class="score-value">
                      {{ typeof scope.row[col.key] === 'number' ? scope.row[col.key].toFixed(3) : '-' }}
                    </span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="results-chart" style="margin-top: 20px; margin-left: 25px;">
          <div class="table-header">
            <h4>指标折线图</h4>
          </div>
          <div ref="lineChartRef" class="chart-container"></div>
        </div>
      </el-tabs>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { loadDataSets, loadStandards } from '@/utils/localData'
import request from '@/utils/request'

const EVAL_TASK_KEY = 'evaluationTasks'
function loadEvalTasks() {
  try { return JSON.parse(localStorage.getItem(EVAL_TASK_KEY) || '[]') } catch { return [] }
}

const router = useRouter()
const route = useRoute()
const activeTab = ref('results')
const selectedMode = ref('all')

const detailMetricColumns = [
  { key: 'bleu', label: 'BLEU' },
  { key: 'rouge', label: 'ROUGE' },
  { key: 'meteor', label: 'METEOR' },
  { key: 'accuracy', label: 'ACCURACY' },
  { key: 'f1_score', label: 'F1-SCORE' },
  { key: 'pass_k', label: 'PASS@K' },
  { key: 'token_f1', label: 'TOKEN-LEVEL F1' },
  { key: 'self_repetition', label: 'SELF-REPETITION' }
]
const xAxisLabels = computed(() => visibleMetrics.value.map(c => c.label))


// 仅展示至少有一个数据集非 null 的指标列
const visibleMetrics = computed(() => {
  const rows = evaluationResults.value?.detailedResults || []
  return detailMetricColumns.filter(c => rows.some(r => r[c.key] !== null && r[c.key] !== undefined))
})
console.log('visibleMetrics:', visibleMetrics)
// { changed code } 折线图实例
let lineChart = null
const lineChartRef = ref(null)

const buildLineSeries = (rows) => {
  return rows.map(row => {
    const values = visibleMetrics.value.map(col => {
      const v = row[col.key]
      // 图表展示为百分比；null 让折线中断
      return typeof v === 'number' ? +(v * 100).toFixed(2) : null
    })
    return {
      type: 'line',
      name: row.datasetName,
      data: values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      connectNulls: false,
      lineStyle: {
        opacity: 0.5 // 设置线条透明度 (0-1)
      }
    }
  })
}


// 单条折线：每个指标在所有数据集上的平均分（百分比）
const buildAvgSeries = (rows) => {
  const avgs = visibleMetrics.value.map(col => {
    const nums = rows.map(r => r[col.key]).filter(v => typeof v === 'number')
    if (!nums.length) return null // 无有效值则断点
    const avg01 = nums.reduce((a, b) => a + b, 0) / nums.length
    return +(avg01 * 100).toFixed(2) // 转百分比
  })
  return [{
    type: 'line',
    name: '平均值',
    data: avgs,
    smooth: true,
    symbol: 'circle',
    symbolSize: 5,
    connectNulls: false,
    lineStyle: {
      width: 4 ,
      opacity: 0.8
    }
  }]
}


// const renderLineChart = () => {
//   if (!lineChartRef.value) return
//   if (!lineChart) {
//     lineChart = echarts.init(lineChartRef.value)
//     window.addEventListener('resize', resizeLineChart)
//   }
//   const rows = filteredTableData.value || []
//   const option = {
//     tooltip: {
//       trigger: 'axis',
//       valueFormatter: (v) => `${v}%`
//     },
//     legend: {
//       type: 'scroll',
//       top: 0
//     },
//     grid: { left: 40, right: 20, top: 40, bottom: 30 },
//     xAxis: {
//       type: 'category',
//       boundaryGap: false,
//       data: xAxisLabels.value
//     },
//     yAxis: {
//       type: 'value',
//       min: 0,
//       max: 100,
//       axisLabel: { formatter: '{value}%' },
//       splitNumber: 5
//     },
//     series: buildLineSeries(rows)
//   }
//   lineChart.setOption(option, true)
// }
const renderLineChart = () => {
  if (!lineChartRef.value) return
  if (!lineChart) {
    lineChart = echarts.init(lineChartRef.value)
    window.addEventListener('resize', resizeLineChart)
  }
  const rows = filteredTableData.value || []

  // 图例显示：所有数据集名称 + 平均值
  const legendNames = [
    ...Array.from(new Set(rows.map(r => r.datasetName).filter(Boolean))),
    '平均值'
  ]

  const option = {
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => (v == null ? '-' : `${v}%`)
    },
    legend: {
      type: 'scroll',
      top: 0,
      data: legendNames
    },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisLabels.value
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%' },
      splitNumber: 5
    },
    // n 条数据集折线 + 1 条平均值折线
    series: [
      ...buildLineSeries(rows),
      ...buildAvgSeries(rows)
    ]
  }
  lineChart.setOption(option, true)
}
const resizeLineChart = () => {
  lineChart && lineChart.resize()
}


onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeLineChart)
  if (lineChart) {
    lineChart.dispose()
    lineChart = null
  }
})

// 数据变动时更新图表
// watch(filteredTableData, () => {
//   renderLineChart()
// }, { deep: true })

// 评测基本信息
const evaluationInfo = ref({
  id: '',
  name: '加载中...',
  modelName: '-',
  modelType: '-',
  datasetName: [],
  datasetSize: Math.floor(Math.random() * (2000 - 100 + 1)) + 100,
  metricsCount: 0,
  evaluationMode: '-'
})


const evaluationResults = ref({
  detailedResults: []
})

async function fetchTaskDetail() {
  try {
    const id = route.query.taskId ?? route.params.id
    if (!id) {
      ElMessage.error('缺少任务ID')
      return
    }
    const res = await request({
      url: '/evalTask/getTaskDetailScore',
      method: 'get',
      params: { taskId: id }
    })
    if (res?.code !== 200) {
      ElMessage.error(res?.msg || '获取评测详情失败')
      return
    }

    const list = Array.isArray(res?.data) ? res.data : []

    // 标准名映射
    const toKey = (name) => {
      const n = String(name || '').trim().toLowerCase()
      const norm = n.replace(/\s+/g, '').replace(/_/g, '-')
      const map = {
        'bleu': 'bleu',
        'rouge': 'rouge',
        'meteor': 'meteor',
        'mean-acc': 'accuracy',
        'accuracy': 'accuracy',
        'f1-score': 'f1_score',
        'f1score': 'f1_score',
        'pass@k': 'pass_k',
        'pass-k': 'pass_k',
        'token-levelf1': 'token_f1',
        'self-repetition': 'self_repetition',
        'selfrepetition': 'self_repetition'
      }
      return map[norm] || null
    }

    // 转为 0~1 的小数；无效时返回 null（用于隐藏整列）
    const toNum01OrNull = (v) => {
      if (v === null || v === undefined || v === '') return null
      const n = Number(v)
      if (!isFinite(n)) return null
      if (n > 1) return Math.min(n / 100, 1)
      if (n < 0) return 0
      return n
    }

    // 组装表格行（默认 null）
    const rows = list.map(item => {
      const row = {
        datasetName: item?.datasetName ?? '-',
        bleu: null,
        rouge: null,
        meteor: null,
        accuracy: null,
        f1_score: null,
        pass_k: null,
        token_f1: null,
        self_repetition: null
      }
      const scores = Array.isArray(item?.standardScores) ? item.standardScores : []
      scores.forEach(s => {
        const key = toKey(s?.standardName)
        if (!key) return
        row[key] = toNum01OrNull(s?.score)
      })
      return row
    })

    // 基本信息
    const dsNames = list.map(i => i.datasetName).filter(Boolean)
    evaluationInfo.value = {
      id,
      name: `评测任务 ${id}`,
      modelName: res.data?.[0]?.modelName || '-',
      modelType: '-',
      datasetName: dsNames,
      datasetSize: 0,
      metricsCount: 4, // 由 visibleMetrics 动态决定，不再固定
      evaluationMode: '-'
    }

    // 设置结果
    evaluationResults.value.detailedResults = rows

    await nextTick()
    renderLineChart()
  } catch (e) {
    console.error('fetchTaskDetail error:', e)
    ElMessage.error(e?.message || '请求失败')
  }
}
// async function fetchTaskDetail() {
//   try {
//     const id = route.query.taskId ?? route.params.id
//     if (!id) {
//       ElMessage.error('缺少任务ID')
//       return
//     }
//     const res = await request({
//       url: '/evalTask/getTaskDetailScore',
//       method: 'get',
//       params: { taskId: id }
//     })
//     // console.log('评测详情响应:', res.data[0].modelName)
//     if (res?.code !== 200) {
//       ElMessage.error(res?.msg || '获取评测详情失败')
//       return
//     }

//     const list = Array.isArray(res?.data) ? res.data : []

//     // 指标名映射到表格字段
//     const toKey = (name) => {
//       const n = String(name || '').trim().toLowerCase()
//       const norm = n.replace(/\s+/g, '').replace(/_/g, '-')
//       const map = {
//         'bleu': 'bleu',
//         'rouge': 'rouge',
//         'meteor': 'meteor',
//         'mean-acc': 'accuracy',
//         'accuracy': 'accuracy',
//         'f1-score': 'f1_score',
//         'f1score': 'f1_score',
//         'pass@k': 'pass_k',
//         'pass-k': 'pass_k',
//         'token-levelf1': 'token_f1',
//         'self-repetition': 'self_repetition',
//         'selfrepetition': 'self_repetition'
//       }
//       return map[norm] || null
//     }

//     const toNum01 = (v) => {
//       const n = Number(v)
//       if (!isFinite(n)) return 0
//       if (n > 1) return Math.min(n / 100, 1)
//       if (n < 0) return 0
//       return n
//     }

//     // 组装表格行
//     const rows = list.map(item => {
//       const row = {
//         datasetName: item?.datasetName ?? '-',
//         bleu: 0,
//         rouge: 0,
//         meteor: 0,
//         accuracy: 0,
//         f1_score: 0,
//         pass_k: 0,
//         token_f1: 0,
//         self_repetition: 0
//       }
//       const scores = Array.isArray(item?.standardScores) ? item.standardScores : []
//       scores.forEach(s => {
//         const key = toKey(s?.standardName)
//         if (!key) return
//         row[key] = toNum01(s?.score)
//       })
//       return row
//     })

//     // 基本信息
//     const metricsSet = new Set()
//     list.forEach(i => (i.standardScores || []).forEach(s => {
//       const k = toKey(s?.standardName)
//       if (k) metricsSet.add(k)
//     }))
//     const dsNames = list.map(i => i.datasetName).filter(Boolean)

//     evaluationInfo.value = {
//       id,
//       name: `评测任务 ${id}`,
//       modelName: res.data[0].modelName,     // 后端未返回，保持占位
//       modelType: '-',
//       datasetName: dsNames,
//       datasetSize: 0,
//       metricsCount: metricsSet.size,
//       evaluationMode: '-'
//     }

//     evaluationResults.value.detailedResults = rows

//     await nextTick()
//     renderLineChart()
//   } catch (e) {
//     console.error('fetchTaskDetail error:', e)
//     ElMessage.error(e?.message || '请求失败')
//   }
// }

// async function fetchTaskDetail() {
//   try {
//     console.log('fetchTaskDetail 被调用')
//     const id = route.query.taskId ?? route.params.id
//     console.log('评测任务123:', id)
//     const res = await request({
//       url: '/evalTask/getTaskDetailScore',
//       method: 'get',
//       params: { taskId: id }
//     })
//     console.log('评测详情响应:', res)
//     if (!res.code) {
//       ElMessage.error('获取评测详情失败')
//       return
//     }
//     const data = res.data
//     const dsNames = list.map(i => i.datasetName).filter(Boolean)
//     evaluationInfo.value = {
//       id: data.evalTaskId,
//       //任务名称
//       name: '确实',
//       //模型名称
//       modelName: '缺失',
//       //模型类型
//       modelType: data.modelType,
//       //数据集名称
//       datasetName: dsNames,
//       //指标数量
//       metricsCount: data.standardScores.length,
//       // evaluationMode: data?.evaluationMode ?? data?.standardName ?? '-'
//     }

//     // 详细结果
//     //111
//     const rawRows = Array.isArray(data?.evalDetails)
//       ? data.evalDetails
//       : Array.isArray(data?.detailedResults)
//         ? data.detailedResults
//         : []

//     const toNum = (v) => {
//       const n = Number(v)
//       if (!isFinite(n)) return 0
//       // 兼容百分数/小数
//       return n > 1 ? Math.min(n / 100, 1) : Math.max(n, 0)
//     }

//     //222 做空值保护
//     evaluationResults.value.detailedResults = rawRows.map(r => {
//       const row = { datasetName: r?.datasetName ?? '-' }
//       Object.entries(r || {}).forEach(([k, v]) => {
//         if (['datasetName', 'dataset', 'datasetId', 'mode'].includes(k)) return
//         const nv = toNum(v)
//         if (nv !== null) row[k] = nv
//       })
//       return row
//     })

//     await nextTick()
//     renderLineChart()
//   } catch (e) {
//     ElMessage.error(e?.message || '请求失败')
//   }
// }




// 计算属性
const filteredTableData = computed(() => {
  if (selectedMode.value === 'all') {
    return evaluationResults.value.detailedResults
  }
  return evaluationResults.value.detailedResults.filter(
    item => item.mode === selectedMode.value
  )
})

const goBack = () => {
  router.back()
}

function num(v) {
  if (v == null || isNaN(v)) return ''
  return +Number(v).toFixed(3)
}

function formatDateStr(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

async function exportTableData() {
  const rows = filteredTableData.value || []
  if (!rows.length) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  try {
    // 动态加载，避免初始包体过大（需先安装：npm i xlsx）
    const XLSX = await import('xlsx')

    const headers = ['数据集', 'BLEU', 'ROUGE', 'METEOR', 'ACCURACY', 'F1-SCORE', 'PASS@K', 'TOKEN-LEVEL F1', 'SELF-REPETITION']
    const sheetData = [headers]

    rows.forEach(r => {
      sheetData.push([
        r.datasetName ?? '',
        num(r.bleu),
        num(r.rouge),
        num(r.meteor),
        num(r.accuracy),
        num(r.f1_score),
        num(r.pass_k),
        num(r.token_f1),
        num(r.self_repetition)
      ])
    })

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(sheetData)

    // 自动列宽
    const colWidths = sheetData[0].map((_, colIdx) => {
      const maxLen = sheetData.reduce((m, row) => {
        const cell = row[colIdx] == null ? '' : String(row[colIdx])
        return Math.max(m, cell.length)
      }, 6)
      return { wch: Math.min(Math.max(maxLen + 2, 8), 40) }
    })
    ws['!cols'] = colWidths

    // 添加百分比格式（除第一列外）
    for (let r = 1; r < sheetData.length; r++) {
      for (let c = 1; c < headers.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c })
        const raw = sheetData[r][c]
        if (typeof raw === 'number') {
          ws[cellRef] = { t: 'n', v: raw, z: '0.000' }
        }
      }
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '详细结果')

    const filename = `评测结果_${evaluationInfo.value.name || 'task'}_${formatDateStr(new Date())}.xlsx`
    XLSX.writeFile(wb, filename)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error('[exportTableData] 失败', e)
    // Fallback：导出 CSV
    try {
      const csv = toCSV(filteredTableData.value)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = '评测结果.csv'
      a.click()
      URL.revokeObjectURL(a.href)
      ElMessage.success('已使用 CSV 方式导出')
    } catch {
      ElMessage.error('导出失败，请检查是否已安装 xlsx')
    }
  }
}
// 当可见指标变化或数据变化时重绘图表
watch([visibleMetrics, () => evaluationResults.value.detailedResults], () => {
  nextTick().then(renderLineChart)
}, { deep: true })
onMounted(async () => {
  await fetchTaskDetail()
})
watch(
  () => route.query.taskId ?? route.params.taskId,
  async () => {
    await fetchTaskDetail()
  }
)
</script>

<style scoped>
.evaluation-detail-page {
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


.back-btn {
  align-self: flex-start;
  color: #667eea;
  font-weight: 600;
}

.page-title {
  font-size: 28px;
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

.evaluation-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  color: #6c757d;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 概览区域 */
.overview-section {
  margin-bottom: 24px;
}

.overview-card {
  background: rgb(250, 250, 250);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgb(250, 250, 250);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.overview-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.item-icon.model {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.item-icon.dataset {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.item-icon.metrics {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.item-icon.duration {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.item-info {
  flex: 1;
}

.item-label {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 4px;
}

.item-value {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.item-desc {
  font-size: 12px;
  color: #6c757d;
}

/* 详情区域 */
.details-section {
  background: white;
  /* border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); */
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 评测结果 */
.results-content {
  padding: 24px;
}

.metrics-overview {
  margin-bottom: 32px;
}

.metrics-overview h4 {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 16px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.metric-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-name {
  font-weight: 600;
  color: #2c3e50;
}

.metric-score {
  font-size: 18px;
  font-weight: 800;
  color: #667eea;
}

.metric-progress {
  margin-bottom: 12px;
}

.metric-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6c757d;
}

.results-table {
  margin-top: 15px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-header h4 {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.table-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.score-cell {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-value {
  font-weight: 600;
  color: #2c3e50;
  min-width: 50px;
}

.score-bar {
  height: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.score-cell.average .score-value {
  color: #667eea;
  font-weight: 800;
}

/* 信息卡片 */
.model-info-content,
.dataset-info-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
}

.info-card h4 {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 16px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-weight: 600;
  color: #6c757d;
  font-size: 14px;
}

.info-item span {
  color: #2c3e50;
  font-size: 16px;
}

.config-content {
  background: #2c3e50;
  color: #e8f3ff;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

.config-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #6c757d;
}

.chart-placeholder p {
  margin: 16px 0 0 0;
  font-size: 16px;
}

/* 日志区域 */
.logs-content {
  padding: 24px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.logs-header h4 {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.logs-actions {
  display: flex;
  gap: 12px;
}

.logs-container {
  max-height: 600px;
  overflow-y: auto;
  background: #2c3e50;
  border-radius: 8px;
  padding: 16px;
}

.log-item {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border-left: 4px solid #6c757d;
}

.log-item.info {
  border-left-color: #409EFF;
}

.log-item.warning {
  border-left-color: #E6A23C;
}

.log-item.error {
  border-left-color: #F56C6C;
}

.log-item.success {
  border-left-color: #67C23A;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-time {
  color: #e8f3ff;
  font-size: 12px;
  font-family: 'Courier New', monospace;
}

.log-message {
  color: #e8f3ff;
  font-size: 14px;
  margin-bottom: 8px;
}

.log-details {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 4px;
}

.log-details pre {
  margin: 0;
  color: #e8f3ff;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
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

/* 标签页样式 */
:deep(.evaluation-tabs .el-tabs__header) {
  margin: 0;
  background: #f8f9fa;
  padding: 0 24px;
}

:deep(.evaluation-tabs .el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.evaluation-tabs .el-tabs__item) {
  border: none;
  background: transparent;
  color: #6c757d;
}

:deep(.evaluation-tabs .el-tabs__item.is-active) {
  background: white;
  color: #667eea;
  border-radius: 8px 8px 0 0;
}

/* 按钮美化 */
:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {

  .page-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .table-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .evaluation-meta {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
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

.btn-group {
  display: flex;
  gap: 12px;
}
</style>