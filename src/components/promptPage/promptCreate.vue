<template>
  <div class="prompt-create-page">
    <div class="page-header">
      <h2>创建 Prompt 模板</h2>
      <p class="desc">
        创建并保存可复用的 Prompt 模板，支持变量占位、框架注入与推荐推理参数。
      </p>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="create-form">
      <!-- 基本信息 -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">基本信息</div>
        </template>

        <el-form-item label="模板名称" prop="title">
          <el-input v-model="form.title" maxlength="64" show-word-limit placeholder="请输入模板名称" />
        </el-form-item>


        <el-form-item label="模板简介" prop="desc">
          <el-input v-model="form.desc" maxlength="128" show-word-limit placeholder="请输入模板简介" />
        </el-form-item>

        <!-- <el-form-item label="模板标签">
          <el-select v-model="form.tags" multiple filterable allow-create default-first-option placeholder="输入后回车创建标签">
            <el-option v-for="t in builtinTags" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item> -->
<!-- 
        <el-form-item label="变量识别符">
          <el-select v-model="form.marker" class="short">
            <el-option label="双大括号 {{name}}" value="double_braces" />
            <el-option label="双中括号 [[name]]" value="double_brackets" />
            <el-option label="百分号 %name%" value="percent" />
          </el-select>
          <span class="hint">在 Prompt 中用所选占位格式标记变量，系统会自动识别。</span>
        </el-form-item>

        <el-form-item label="模板框架">
          <el-radio-group v-model="form.framework">
            <el-radio label="none">无</el-radio>
            <el-radio label="basic">Basic Prompt Framework</el-radio>
            <el-radio label="crispe">CRISPE Prompt Framework</el-radio>
            <el-radio label="fewshot">Few-shot Prompt</el-radio>
          </el-radio-group>
          <el-button class="ml8" @click="applyFramework"
            :disabled="!form.framework || form.framework === 'none'">注入示例结构</el-button>
        </el-form-item> -->

        <!-- Prompt 内容 -->
        <el-form-item label="Prompt" prop="content" class="no-bottom">
          <div class="input-wrap">
            <el-input v-model="form.content" type="textarea" :rows="12" :maxlength="11200" show-word-limit
              placeholder="建议包含：角色、任务、输入/输出格式、约束、评价维度与示例等；变量请使用上方选择的占位符。" />
            <span class="char-counter">{{ form.content.length }}/11200</span>
          </div>
        </el-form-item>

        <!-- <el-form-item label="变量预览">
          <div v-if="variables.length" class="vars">
            <el-tag v-for="v in variables" :key="v" type="info" effect="light" class="mr6">{{ v }}</el-tag>
          </div>
          <span v-else class="hint">未检测到变量占位符</span>
        </el-form-item> -->


        <!-- 推荐推理参数 -->


        <!-- <el-form-item label="启用推荐">
          <el-switch v-model="form.recommendParams" />
          <span class="hint ml8">开启后将随模板保存模型推理建议参数</span>
        </el-form-item>

        <div v-show="form.recommendParams" class="params-grid">
          <el-form-item label="temperature">
            <el-input-number v-model="form.params.temperature" :min="0" :max="1" :step="0.05" />
          </el-form-item>
          <el-form-item label="top_p">
            <el-input-number v-model="form.params.top_p" :min="0" :max="1" :step="0.05" />
          </el-form-item>
          <el-form-item label="max_tokens">
            <el-input-number v-model="form.params.max_tokens" :min="16" :max="8192" :step="16" />
          </el-form-item>
        </div> -->
      </el-card>



      <!-- 操作区 -->
      <div class="form-actions">
        <el-button @click="onCancel">返回</el-button>
        <el-button type="primary" @click="onSave">保存模板</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '@/utils/request.js'

const router = useRouter()
const STORAGE_KEY = 'prompt_templates_v1'
const PREFILL_KEY = 'PROMPT_TEMPLATE_PREFILL'


const formRef = ref()
const rules = {
  title: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  content: [{ required: true, message: '请输入 Prompt 内容', trigger: 'blur' }]
}

const form = ref({
  id: null,            // 新增：模板ID
  title: '',
  desc: '',
  tags: [],
  framework: 'none',
  marker: 'double_braces',
  content: '',
  recommendParams: false,
  params: { temperature: 0.7, top_p: 0.95, max_tokens: 1024 }
})



function onCancel() {
  router.back()
}

const onSave = async () => {
  try {
    await formRef.value.validate()
    // 生成 1-200 范围内 ID（若为空或非法）
    // let id = Number(form.value.id)
    // if (!Number.isInteger(id) || id < 1 || id > 200) {
    //   id = Math.floor(Math.random() * 200) + 1
    // }

    const payload = {
      templateName: form.value.title,
      description: form.value.desc,
      promptContent: form.value.content,
    }

    const res = await request.post('/prompt/createTemplate', payload)
    if (res?.code === 200) {
      ElMessage.success('模板已保存')
      router.push('/main/optimize-history')
    } else {
      ElMessage.error(res?.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error(e?.message || '保存出错')
  }
}

onMounted(() => {                               // 新增
  try {
    const cache = localStorage.getItem(PREFILL_KEY)
    if (cache) {
      const data = JSON.parse(cache)
      if (data?.content && !form.value.content) {
        form.value.content = data.content
        if (!form.value.title) form.value.title = '优化生成模板'
        ElMessage.success('已载入优化结果')
      }
      localStorage.removeItem(PREFILL_KEY)
    }
  } catch { }
})
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

/* 页面与表单 */
.prompt-create-page {
  max-width: 1900px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
}

.create-form {
  padding: 0 16px 20px;
}

.section-card {
  border-radius: 14px;
  border: 1px solid #e6eef7;
  margin-bottom: 14px;
}

.section-card :deep(.el-card__header) {
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.card-header {
  font-weight: 600;
  color: #2f3a4a;
}

/* 输入区域增强 */
.input-wrap {
  position: relative;
  width: 100%;
}

.input-wrap :deep(.el-textarea__inner) {
  font-size: 15px;
  line-height: 1.75;
  min-height: 260px;
  border-radius: 12px;
  border: 1.5px solid #dbe7f3;
  background: #fcfdff;
}

.char-counter {
  position: absolute;
  top: 6px;
  right: 10px;
  font-size: 12px;
  color: #8b99a9;
  background: rgba(255, 255, 255, 0.85);
  padding: 2px 8px;
  border: 1px solid #e4ecf6;
  border-radius: 999px;
}

.vars .el-tag {
  margin-right: 6px;
  margin-bottom: 6px;
}

.mr6 {
  margin-right: 6px;
}

.ml8 {
  margin-left: 8px;
}

.short {
  width: 220px;
}

.hint {
  color: #8b99a9;
  font-size: 12px;
  margin-left: 8px;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 6px 24px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 4px 0 8px;
}
</style>