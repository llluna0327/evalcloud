<template>
  <div class="dashboard-wrapper">
    <section class="hero">
      <div class="hero-icon">
        <el-icon>
          <Brush />
        </el-icon>
      </div>
      <h1 class="hero-title">评调云EvalCloud平台</h1>
      <p class="hero-sub">
        一站式模型评测中枢，覆盖多个全链路指标，助力企业快速定位模型短板，量化优化方向
      </p>
    </section>

    <!-- 功能卡片 -->
    <section class="feature-grid">
      <!-- 模型管理 -->
      <div class="feature-card">
        <div class="icon-wrap primary">
          <el-icon>
            <Setting />
          </el-icon>
        </div>
        <h3 class="card-title">智能选型</h3>
        <p class="card-desc">智能生成“最佳模型+最优Prompt”组合</p>
        <div class="card-actions">
          <el-button type="primary" plain @click="go('/main/selection-result')">前往管理</el-button>
          <el-button type="primary" plain @click="go('/main/intelligence-select')">进入任务</el-button>
        </div>
      </div>

      <!-- 开始对话 -->
      <div class="feature-card">
        <div class="icon-wrap cyan">
          <el-icon>
            <ChatDotRound />
          </el-icon>
        </div>
        <h3 class="card-title">开始调优</h3>
        <p class="card-desc">快速与选定模型交互，验证对话质量</p>
        <div class="card-actions">
          <el-button type="primary" plain @click="go('/main/prompt-optimize')">进入对话</el-button>
          <el-button type="primary" plain @click="go('/main/optimize-history')">查看模板</el-button>
        </div>
      </div>

      <!-- 测试集管理 -->
      <div class="feature-card">
        <div class="icon-wrap violet">
          <el-icon>
            <Operation />
          </el-icon>
        </div>
        <h3 class="card-title">数据集管理</h3>
        <p class="card-desc">上传 / 预览 / 版本 管理</p>
        <div class="card-actions">
          <el-button type="primary" plain @click="go('/main/my-dataset')">查看数据集</el-button>
          <!-- <el-button  text @click="go('/main/dataset-audit')">审核</el-button> -->
        </div>
      </div>

      <!-- 模型效果评估 -->
      <div class="feature-card">
        <div class="icon-wrap green">
          <el-icon>
            <TrendCharts />
          </el-icon>
        </div>
        <h3 class="card-title">模型效果评估</h3>
        <p class="card-desc">基于自定义指标的准确性与质量评估。</p>
        <div class="card-actions">
          <!-- <el-button type="primary" plain @click="go('/main/eval/custom')">效果评估</el-button> -->
          <el-button type="primary" plain @click="go('/main/model-project-list')">查看历史</el-button>
        </div>
      </div>

      <!-- 性能评估 -->
      <div class="feature-card">
        <div class="icon-wrap orange">
          <el-icon>
            <Timer />
          </el-icon>
        </div>
        <h3 class="card-title">指标管理</h3>
        <p class="card-desc">上传 / 调参 / 版本 管理 </p>
        <div class="card-actions">
          <el-button type="primary" plain @click="go('/main/standard-create')">创建指标</el-button>
          <el-button type="primary" plain @click="go('/main/standard-list')">查看指标</el-button>
        </div>
      </div>

      <!-- RAG 评估 -->
      <div class="feature-card">
        <div class="icon-wrap teal">
          <el-icon>
            <Search />
          </el-icon>
        </div>
        <h3 class="card-title">我的团队</h3>
        <p class="card-desc">管理团队资源与权限</p>
        <div class="card-actions">
          <el-button type="primary" plain @click="go('/main/team-resource')">团队资源</el-button>
        </div>
      </div>

      <!-- 即将到来 -->
      <!-- <div class="feature-card upcoming dashed">
        <div class="icon-wrap gray">
          <el-icon>
            <Clock />
          </el-icon>
        </div>
        <h3 class="card-title">即将到来</h3>
        <p class="card-desc">安全 / 可信 / 监控告警模块。</p>
        <div class="tags-inline">
          <el-tag type="danger" effect="plain">安全评估</el-tag>
          <el-tag type="info" effect="plain">开发中</el-tag>
        </div>
      </div> -->
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Setting, ChatDotRound, Operation, TrendCharts,
  Timer, Search, Clock, Brush
} from '@element-plus/icons-vue'

const router = useRouter()

function go(path) {
  router.push(path)
}

const stats = ref([
  { key: 'models', label: '已登记模型', value: 18 },
  { key: 'datasets', label: '测试集', value: 42 },
  { key: 'evaluations', label: '评测任务', value: 125 },
  { key: 'standards', label: '指标集', value: 16 }
])

onMounted(() => {
  // 可在此异步拉取统计
})
</script>

<style scoped>
.dashboard-wrapper {
  max-width: 100%;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
  min-height: 100%;
}

.hero {
  text-align: center;
  position: relative;
}

.hero-icon {
  width: 68px;
  height: 68px;
  margin: 0 auto 8px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4f79ff, #8aa9ff);
  color: #fff;
  font-size: 30px;
  box-shadow: 0 6px 18px -4px rgba(60, 90, 170, .35);
}

.hero-title {
  font-size: 38px;
  margin: 0 0 14px;
  letter-spacing: 1px;
  font-weight: 700;
}

.hero-sub {
  margin: 0 auto;
  max-width: 720px;
  line-height: 1.6;
  font-size: 15px;
  opacity: .82;
}

.feature-grid {
  margin-left: 5%;
  margin-right: 5%;
  margin-top: 42px;
  display: grid;
  gap: 32px 32px;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  align-items: stretch;
}

.feature-card {
  position: relative;
  background: linear-gradient(180deg, #ffffff, #f5f8fb);
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 22px 20px 20px;
  display: flex;
  flex-direction: column;
  transition: all .28s cubic-bezier(.4, 0, .2, 1);
  overflow: hidden;
}

.feature-card:before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 85% 20%, rgba(120, 160, 255, .18), transparent 60%),
    radial-gradient(circle at 15% 90%, rgba(120, 200, 255, .14), transparent 55%);
  opacity: 0;
  transition: opacity .4s;
  pointer-events: none;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px -8px rgba(40, 60, 130, .25);
}

.feature-card:hover:before {
  opacity: 1;
}

.feature-card.upcoming {
  background: linear-gradient(180deg, #fafafa, #f1f4f6);
}

.feature-card.dashed {
  border: 1.5px dashed #b8c5d6;
}

.icon-wrap {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin-bottom: 12px;
  color: #fff;
  box-shadow: 0 4px 14px -3px rgba(0, 0, 0, .25);
}

.icon-wrap.primary {
  background: linear-gradient(135deg, #3d6bff, #6d90ff);
}

.icon-wrap.cyan {
  background: linear-gradient(135deg, #009adf, #4cbef5);
}

.icon-wrap.violet {
  background: linear-gradient(135deg, #6a55ff, #9c87ff);
}

.icon-wrap.green {
  background: linear-gradient(135deg, #1b9d63, #49c48a);
}

.icon-wrap.orange {
  background: linear-gradient(135deg, #f8842c, #ffb347);
}

.icon-wrap.teal {
  background: linear-gradient(135deg, #118c95, #32b7c2);
}

.icon-wrap.gray {
  background: linear-gradient(135deg, #6d7785, #9aa5b5);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 6px;
  letter-spacing: .5px;
}

.card-desc {
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
  color: #5c6675;
  margin: 0 0 14px;
}

.card-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tags-inline {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 18px;
  border: 1px solid #e5eaf0;
  border-radius: 18px;
  padding: 18px 26px;
  background: linear-gradient(180deg, #ffffff, #f6f9fb);
}

.stat-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.stat-item:not(:last-child):after {
  content: '';
  position: absolute;
  right: -9px;
  top: 12%;
  bottom: 12%;
  width: 1px;
  background: linear-gradient(#e2e8f0, #edf2f7);
}

.num {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #2d5cff, #6c8dff);
  -webkit-background-clip: text;
  color: transparent;
}

.label {
  font-size: 12px;
  letter-spacing: .5px;
  color: #627088;
}

@media (max-width: 860px) {
  .dashboard-wrapper {
    padding: 42px 20px 56px;
  }

  .hero-title {
    font-size: 30px;
  }

  .feature-grid {
    gap: 22px;
  }

  .feature-card {
    padding: 20px 18px 18px;
  }
}
</style>