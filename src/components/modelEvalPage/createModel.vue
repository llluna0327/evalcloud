<template>
    <div class="page-container">
        <h2 class="title">新建模型</h2>

        <el-form ref="formRef" :model="modelForm" :rules="modelRules" label-width="130px" class="base-form">
            <el-form-item label="模型名称" prop="modelName">
                <el-input v-model="modelForm.modelName" placeholder="例如: My-Chat-Model" maxlength="50"
                    show-word-limit />
            </el-form-item>

            <!-- <el-form-item label="模型类型">
                <el-radio-group v-model="modelForm.modelType">
                    <el-radio value="api">API模型</el-radio>
                    <el-radio value="local">本地模型</el-radio>
                </el-radio-group>
            </el-form-item> -->

            <el-form-item :label="modelForm.modelType === 'api' ? 'Base URL' : '权重路径'" prop="openai_api_base">
                <el-input v-if="modelForm.modelType === 'api'" v-model="modelForm.openai_api_base"
                    placeholder="https://your-endpoint.com/v1" clearable />
                <el-input v-else v-model="modelForm.openai_api_base" placeholder="/path/to/weights.bin" clearable />
            </el-form-item>

            <template v-if="modelForm.modelType === 'api'">
                <el-form-item label="API Key">
                    <el-input v-model="modelForm.apiKey" placeholder="可选（不会明文保存）" show-password />
                </el-form-item>

                <el-form-item label="模型标识" prop="apiModel">
                    <el-input v-model="modelForm.apiModel" placeholder="例如: gpt-4o-mini" />
                </el-form-item>

                <!-- <el-form-item label="System Prompt">
                    <el-input v-model="modelForm.system_prompt" type="textarea" :rows="2" maxlength="300"
                        show-word-limit placeholder="可选：系统指令" />
                </el-form-item> -->

                <el-form-item label="temperature" prop="temperature">
                    <el-slider v-model="modelForm.temperature" :min="0" :max="2" :step="0.1" style="width:260px;" />
                    <span class="inline-val">{{ modelForm.temperature }}</span>
                </el-form-item>

                <el-form-item label="max_tokens" prop="max_tokens">
                    <el-input-number v-model="modelForm.max_tokens" :min="1" :max="32768" :step="128" />
                </el-form-item>

                <el-form-item label="img_detail">
                    <el-select v-model="modelForm.img_detail" style="width:180px;">
                        <el-option label="low" value="low" />
                        <el-option label="high" value="high" />
                    </el-select>
                </el-form-item>
            </template>

            <el-form-item label="描述">
                <el-input v-model="modelForm.description" type="textarea" :rows="3" maxlength="500" show-word-limit
                    placeholder="可选：模型用途 / 特点" />
            </el-form-item>
        </el-form>

        <!-- 调用示例 -->
        <!-- <div class="code-block-wrapper">
            <div class="code-toolbar">
                <div class="left">
                    <strong>调用示例（Python）</strong>
                    <el-tag v-if="isCustomEditing" type="warning" size="small">手动模式</el-tag>
                </div>
                <div class="right">
                    <el-button size="small" @click="copyCode">复制代码</el-button>
                </div>
            </div>
            <pre v-if="!isCustomEditing" class="code-view" v-html="highlightedCode"></pre>
            <el-input v-else v-model="customCode" type="textarea" :rows="22" class="editable-code" spellcheck="false" />
            <div v-if="isCustomEditing" class="parse-hint">
                修改后点击“保存模型”时会尝试自动解析 openai_api_base / model / temperature / max_tokens
            </div>
        </div> -->

        <div class="footer-actions">
            <el-button @click="cancelCreate">取消</el-button>
            <el-button type="primary" @click="saveModel">保存模型</el-button>
        </div>
    </div>
</template>


<script setup>
import { ElMessage } from 'element-plus'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()

// 表单数据
const modelForm = ref({
  modelName: '',
  modelType: 'api',          // api | local
  openai_api_base: '',
  apiKey: '',
  apiModel: '',
  system_prompt: '',
  temperature: 0.7,
  max_tokens: 1024,
  img_detail: 'high',
  description: '',
  maxSeqLen:520,
  queryPerSecond:521,
  batchSize:522
})

const formRef = ref()

// 代码模式
const isCustomEditing = ref(false)
const customCode = ref('') // 手动模式内容

// 校验
const modelRules = {
  modelName: [
    { required: true, message: '请输入模型名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度 2~50', trigger: 'blur' }
  ],
  openai_api_base: [
    {
      validator: (_r, v, cb) => {
        if (modelForm.value.modelType === 'local') return cb()
        if (!v) return cb(new Error('请输入 Base URL'))
        if (!/^https?:\/\//i.test(v)) return cb(new Error('必须以 http/https 开头'))
        cb()
      },
      trigger: 'blur'
    }
  ],
  apiModel: [
    {
      validator: (_r, v, cb) => {
        if (modelForm.value.modelType === 'local') return cb()
        if (!v) return cb(new Error('请输入模型标识'))
        cb()
      }, trigger: 'blur'
    }
  ],
  temperature: [
    { validator: (_r, v, cb) => (v >= 0 && v <= 2 ? cb() : cb(new Error('0~2'))), trigger: 'change' }
  ],
  max_tokens: [
    { validator: (_r, v, cb) => (v > 0 && v <= 32768 ? cb() : cb(new Error('1~32768'))), trigger: 'change' }
  ]
}

// 自动生成代码
const generatedCode = computed(() => {
  return `# OpenAI Compatible API 调用示例
openai_api_base = "${modelForm.value.openai_api_base || 'https://your-endpoint.com/v1'}"
api_key         = "${modelForm.value.apiKey || 'YOUR_API_KEY'}"
model           = "${modelForm.value.apiModel || 'your-model-name'}"

# 可选参数
system_prompt = ${JSON.stringify(modelForm.value.system_prompt || '')}
temperature   = ${modelForm.value.temperature}
max_tokens    = ${modelForm.value.max_tokens}
img_detail    = "${modelForm.value.img_detail}"

import requests, json

url = f"{openai_api_base}/chat/completions"
payload = {
  "model": model,
  "messages": [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": "你好，介绍一下你自己"}
  ],
  "temperature": temperature,
  "max_tokens": max_tokens
}
headers = {
  "Authorization": f"Bearer {api_key}",
  "Content-Type": "application/json"
}

resp = requests.post(url, headers=headers, data=json.dumps(payload), timeout=30)
print(resp.json())`
})


// 解析手动代码
const parseCustomCode = () => {
  const code = customCode.value
  const getVal = (re) => {
    const m = code.match(re)
    return m ? m[1].trim() : ''
  }
  const base = getVal(/openai_api_base\s*=\s*["']([^"']+)["']/)
  const model = getVal(/model\s*=\s*["']([^"']+)["']/)
  const temp = getVal(/temperature\s*=\s*([0-9.]+)/)
  const maxT = getVal(/max_tokens\s*=\s*([0-9]+)/)
  if (base) modelForm.value.openai_api_base = base
  if (model) modelForm.value.apiModel = model
  if (temp && !isNaN(+temp)) modelForm.value.temperature = +temp
  if (maxT && !isNaN(+maxT)) modelForm.value.max_tokens = +maxT
}


const toInt = (v) => {
  if (v === '' || v === null || v === undefined) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : undefined
}

// 保存（对接后端）
const saveModel = async () => {
  await formRef.value?.validate?.()
  if (isCustomEditing.value) {
    parseCustomCode()
  }

  const payload = {
    accessUrl: modelForm.value.openai_api_base || undefined,
    apiKey: modelForm.value.apiKey || undefined,
    modelName: (modelForm.value.modelName || '').trim() || undefined,
    isPrivate: toInt(modelForm.value.isPrivate ?? 1),
    maxOutLen: toInt(modelForm.value.maxOutLen ?? modelForm.value.max_tokens),
    maxSeqLen: toInt(modelForm.value.maxSeqLen),
    queryPerSecond: toInt(modelForm.value.queryPerSecond),
    batchSize: toInt(modelForm.value.batchSize)
  }

  try {
    const res = await request({
      url: '/aiModel/insertModel',
      method: 'post',
      params: payload   
    })
    ElMessage.success("模型正在接入系统中，请稍后...")
    if (res.code === 200) {
      ElMessage.success('模型创建成功')
      router.push('/main/my-model')
    } else {
      ElMessage.error(res?.message || res?.msg || '创建失败')
    }
  } catch (e) {
    ElMessage.error(e?.message || '请求失败')
  }
}

const cancelCreate = () => {
  router.push('/main/my-model')
}

// 自动模式下 watch 不变
watch(
  () => modelForm.value,
  () => {
    if (!isCustomEditing.value) {
      // 自动模式下什么都不做
    }
  },
  { deep: true }
)
</script>


<style scoped>
.page-container {
    padding: 24px 32px 60px;
    max-width: 1000px;
    margin: 0 auto;
}

.title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 18px;
}

.base-form {
    background: #fff;
    padding: 20px 24px 8px;
    border-radius: 12px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    margin-bottom: 28px;
}

.inline-val {
    display: inline-block;
    width: 40px;
    text-align: center;
    font-size: 13px;
    color: #555;
    margin-left: 8px;
}

.code-block-wrapper {
    position: relative;
    background: #1e1e1e;
    color: #eee;
    border-radius: 12px;
    padding: 14px 14px 18px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
    margin-bottom: 30px;
    font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
}

.code-toolbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    align-items: center;
    color: #dcdcdc;
    font-size: 14px;
}

.code-toolbar .left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.code-view {
    max-height: 520px;
    overflow: auto;
    white-space: pre;
    line-height: 1.45;
    font-size: 13px;
    padding: 6px 4px;
}

.editable-code :deep(textarea),
.editable-code {
    font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
}

.editable-code :deep(textarea) {
    background: #141414;
    color: #ddd;
    border: 1px solid #333;
    resize: vertical;
    line-height: 1.45;
    font-size: 13px;
    padding: 10px;
}

.parse-hint {
    margin-top: 6px;
    font-size: 12px;
    color: #ffa94d;
}

.footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
}

.keyword {
    color: #c792ea;
}

.string {
    color: #a5e075;
}

.comment {
    color: #5c6370;
    font-style: italic;
}
</style>