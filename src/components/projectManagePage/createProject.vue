<template>
  <div class="create-project-page">
    <!-- 页面头部 -->
    <div class="page-header ">
        <h2 >
          创建项目
        </h2>
        <p class="desc">填写项目信息，开始您的模型评测之旅</p>

    </div>


    <!-- 创建步骤 -->
    <div class="steps-container1">
      <el-steps :active="currentStep" align-center>
        <el-step title="基本信息" description="设置项目基础信息" />
        <!-- <el-step title="配置设置" description="配置评测参数" /> -->
        <el-step title="成员邀请" description="邀请团队成员" />
        <el-step title="完成创建" description="确认并创建项目" />
      </el-steps>
    </div>

    <!-- 表单内容 -->
    <div class="form-container">
      <!-- 步骤1: 基本信息 -->
      <div v-show="currentStep === 0" class="step-content">
        <div class="form-card">
          <div class="card-header">
            <h3>项目基本信息</h3>
            <p>请填写项目的基本信息</p>
          </div>

          <el-form ref="basicFormRef" :model="projectForm.basic" :rules="basicRules" label-width="120px" size="large">
            <el-form-item label="项目名称" prop="name">
              <el-input v-model="projectForm.basic.name" placeholder="请输入项目名称" clearable>
                <template #prefix>
                  <el-icon>
                    <Folder />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="项目类型" prop="type">
              <el-select v-model="projectForm.basic.type" placeholder="请选择项目类型" style="width: 100%">
                <el-option v-for="type in projectTypes" :key="type.value" :label="type.label" :value="type.value">
                  <div class="option-item">
                    <div class="option-content">
                      <div class="option-title">{{ type.label }}</div>
                      <div class="option-desc">{{ type.description }}</div>
                    </div>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="项目描述" prop="description">
              <el-input v-model="projectForm.basic.description" type="textarea" :rows="4"
                placeholder="请详细描述项目的目标和用途(选填)" show-word-limit maxlength="500" />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 步骤2: 配置设置 -->
      <!-- <div v-show="currentStep === 1" class="step-content">
        <div class="form-card">
          <div class="card-header">
            <h3>评测配置</h3>
            <p>设置项目的评测参数和模式</p>
          </div>
          
          <el-form 
            ref="configFormRef" 
            :model="projectForm.config" 
            label-width="140px"
            size="large"
          >
            <el-form-item label="评测模式">
              <el-checkbox-group v-model="projectForm.config.evaluationModes">
                <el-checkbox value="string">
                  <div class="mode-option">
                    <div class="mode-title">String 模式</div>
                    <div class="mode-desc">基于字符串匹配的评测</div>
                  </div>
                </el-checkbox>
                <el-checkbox value="json">
                  <div class="mode-option">
                    <div class="mode-title">JSON 模式</div>
                    <div class="mode-desc">基于结构化数据的评测</div>
                  </div>
                </el-checkbox>
                <el-checkbox value="semantic">
                  <div class="mode-option">
                    <div class="mode-title">语义模式</div>
                    <div class="mode-desc">基于语义相似度的评测</div>
                  </div>
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="并发任务数">
              <el-slider 
                v-model="projectForm.config.maxConcurrentTasks" 
                :min="1" 
                :max="10"
                show-input
                style="width: 300px"
              />
              <div class="form-tip">
                同时运行的最大评测任务数量，建议根据服务器性能设置
              </div>
            </el-form-item>

            <el-form-item label="超时设置">
              <el-input-number 
                v-model="projectForm.config.taskTimeout" 
                :min="5" 
                :max="240"
                :step="5"
                style="width: 200px"
              />
              <span style="margin-left: 8px; color: #666;">分钟</span>
              <div class="form-tip">
                单个评测任务的最大执行时间
              </div>
            </el-form-item>

            <el-form-item label="结果保留期">
              <el-select v-model="projectForm.config.resultRetention" style="width: 200px">
                <el-option label="30天" value="30" />
                <el-option label="90天" value="90" />
                <el-option label="180天" value="180" />
                <el-option label="永久保留" value="-1" />
              </el-select>
              <div class="form-tip">
                评测结果在系统中的保留时间
              </div>
            </el-form-item>

            <el-form-item label="通知设置">
              <el-checkbox-group v-model="projectForm.config.notifications">
                <el-checkbox value="email">邮件通知</el-checkbox>
                <el-checkbox value="browser">浏览器通知</el-checkbox>
                <el-checkbox value="webhook">Webhook通知</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </div>
      </div> -->

      <!-- 步骤3: 成员邀请 -->
      <div v-show="currentStep === 1" class="step-content">
        <div class="form-card">
          <div class="card-header">
            <h3>邀请团队成员</h3>
            <p>添加项目成员并分配角色权限</p>
          </div>

          <div class="members-section">
            <div class="add-member-form">
              <el-form :model="memberForm" inline size="large">
                <el-form-item label="选择成员">
                  <el-select v-model="memberForm.userId" placeholder="搜索用户" filterable remote
                    :remote-method="searchUsers" style="width: 200px">
                    <el-option v-for="user in availableUsers" :key="user.id" :label="user.name" :value="user.id">
                      <div class="user-option">
                        <el-avatar :size="24" :src="user.avatar">
                          {{ user.name.charAt(0) }}
                        </el-avatar>
                        <span>{{ user.name }}</span>
                        <span class="user-email">{{ user.email }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="角色">
                  <el-select v-model="memberForm.role" style="width: 120px">
                    <el-option label="管理员" value="admin" />
                    <el-option label="成员" value="member" />
                    <el-option label="观察者" value="viewer" />
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="addMember">
                    <el-icon>
                      <Plus />
                    </el-icon>
                    添加
                  </el-button>
                </el-form-item>
              </el-form>
            </div>

            <div class="members-list">
              <div class="list-header">
                <h4>项目成员 ({{ projectForm.members.length }})</h4>
              </div>

              <div v-if="projectForm.members.length === 0" class="empty-members">
                <el-icon size="48" color="#d9d9d9">
                  <UserFilled />
                </el-icon>
                <p>暂未添加成员</p>
                <p class="empty-tip">您可以稍后在项目设置中添加成员</p>
              </div>

              <div v-else class="members-grid">
                <div v-for="member in projectForm.members" :key="member.id" class="member-card">
                  <div class="member-info">
                    <el-avatar :size="40" :src="member.avatar">
                      {{ member.name.charAt(0) }}
                    </el-avatar>
                    <div class="member-details">
                      <div class="member-name">{{ member.name }}</div>
                      <div class="member-email">{{ member.email }}</div>
                    </div>
                  </div>
                  <div class="member-role">
                    <el-tag :type="getRoleTagType(member.role)">
                      {{ getRoleLabel(member.role) }}
                    </el-tag>
                  </div>
                  <div class="member-actions">
                    <el-button size="small" type="danger" text @click="removeMember(member.id)">
                      <el-icon>
                        <Delete />
                      </el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤4: 完成创建 -->
      <div v-show="currentStep === 2" class="step-content">
        <div class="form-card">
          <div class="card-header">
            <h3>确认项目信息</h3>
            <p>请确认以下信息无误后创建项目</p>
          </div>

          <div class="confirmation-content">
            <div class="info-section">
              <h4>基本信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>项目名称：</label>
                  <span>{{ projectForm.basic.name }}</span>
                </div>
                <div class="info-item">
                  <label>项目类型：</label>
                  <span>{{ getProjectTypeLabel(projectForm.basic.type) }}</span>
                </div>
                <div class="info-item">
                  <label>项目描述：</label>
                  <span>{{ projectForm.basic.description || '无' }}</span>
                </div>
              </div>
            </div>

            <!-- <div class="info-section">
              <h4>配置信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>评测模式：</label>
                  <span>{{ projectForm.config.evaluationModes.join(', ') || '无' }}</span>
                </div>
                <div class="info-item">
                  <label>并发任务数：</label>
                  <span>{{ projectForm.config.maxConcurrentTasks }}</span>
                </div>
                <div class="info-item">
                  <label>超时设置：</label>
                  <span>{{ projectForm.config.taskTimeout }}分钟</span>
                </div>
                <div class="info-item">
                  <label>结果保留期：</label>
                  <span>{{ projectForm.config.resultRetention === '-1' ? '永久保留' : projectForm.config.resultRetention + '天' }}</span>
                </div>
              </div>
            </div> -->

            <div class="info-section">
              <h4>团队成员</h4>
              <div class="members-summary">
                <span class="member-count">{{ projectForm.members.length }}名成员</span>
                <div class="member-avatars">
                  <el-avatar v-for="member in projectForm.members.slice(0, 5)" :key="member.id" :size="32"
                    :src="member.avatar" style="margin-right: 8px;">
                    {{ member.name.charAt(0) }}
                  </el-avatar>
                  <span v-if="projectForm.members.length > 5" class="more-members">
                    +{{ projectForm.members.length - 5 }}
                  </span>
                </div>
              </div>
            </div>

            <div class="create-actions">
              <el-checkbox v-model="agreeTerms">
                我已阅读并同意<a>《服务条款》</a>和<a href="#" @click.prevent>《隐私政策》</a>
              </el-checkbox>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <div class="buttons-left">
        <el-button v-if="currentStep > 0" @click="prevStep" size="large">
          <el-icon>
            <ArrowLeft />
          </el-icon>
          上一步
        </el-button>
      </div>
      <div class="buttons-right">
        <el-button v-if="currentStep < 2" type="primary" @click="nextStep" size="large">
          下一步
          <el-icon>
            <ArrowRight />
          </el-icon>
        </el-button>
        <el-button v-else type="primary" @click="createProject" :loading="creating" :disabled="!agreeTerms"
          size="large">
          创建项目
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 响应式数据
const currentStep = ref(0)
const creating = ref(false)
const agreeTerms = ref(false)

// 表单引用
const basicFormRef = ref()
const configFormRef = ref()

// 项目表单数据
const projectForm = reactive({
  basic: {
    name: '',
    type: '',
    description: '',
    tags: [],
    priority: 'medium'
  },
  config: {
    evaluationModes: ['string'],
    maxConcurrentTasks: 3,
    taskTimeout: 60,
    resultRetention: '90',
    notifications: ['email']
  },
  members: []
})

// 成员表单
const memberForm = reactive({
  userId: '',
  role: 'member'
})

// 标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref()

// 项目类型选项
const projectTypes = ref([
  {
    value: '模型评测',
    label: '模型评测',
    description: '评估模型的能力'
  },
  {
    value: 'PROMPT调优',
    label: 'PROMPT调优',
    description: '优化prompt以提升模型表现'
  },
])

// 可选用户列表
const availableUsers = ref([
  { id: 1, name: '张三', email: 'zhangsan@example.com', avatar: '' },
  { id: 2, name: '李四', email: 'lisi@example.com', avatar: '' },
  { id: 3, name: '王五', email: 'wangwu@example.com', avatar: '' },
  { id: 4, name: '赵六', email: 'zhaoliu@example.com', avatar: '' },
  { id: 5, name: '孙七', email: 'sunqi@example.com', avatar: '' }
])

// 表单验证规则
const basicRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '项目名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择项目类型', trigger: 'change' }
  ]
}

// 方法
const goBack = () => {
  router.back()
}

const nextStep = async () => {
  if (currentStep.value === 0) {
    // 验证基本信息
    if (!basicFormRef.value) return
    const valid = await basicFormRef.value.validate()
    if (!valid) return
  }

  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 成员管理
const searchUsers = (query) => {
  // 模拟用户搜索
  console.log('搜索用户:', query)
}

const addMember = () => {
  const selectedUser = availableUsers.value.find(user => user.id === memberForm.userId)
  if (!selectedUser) {
    ElMessage.error('请选择用户')
    return
  }

  // 检查是否已添加
  if (projectForm.members.find(member => member.id === selectedUser.id)) {
    ElMessage.warning('该用户已经是项目成员')
    return
  }

  projectForm.members.push({
    ...selectedUser,
    role: memberForm.role
  })

  // 重置表单
  memberForm.userId = ''
  memberForm.role = 'member'

  ElMessage.success('成员添加成功')
}

const removeMember = (memberId) => {
  const index = projectForm.members.findIndex(member => member.id === memberId)
  if (index > -1) {
    projectForm.members.splice(index, 1)
    ElMessage.success('成员移除成功')
  }
}

const getRoleTagType = (role) => {
  const typeMap = {
    'admin': 'warning',
    'member': 'primary',
    'viewer': 'info'
  }
  return typeMap[role] || 'info'
}

const getRoleLabel = (role) => {
  const labelMap = {
    'admin': '管理员',
    'member': '成员',
    'viewer': '观察者'
  }
  return labelMap[role] || '未知'
}

const getProjectTypeLabel = (type) => {
  const typeItem = projectTypes.value.find(item => item.value === type)
  return typeItem ? typeItem.label : type
}

const getPriorityLabel = (priority) => {
  const labelMap = {
    'low': '低优先级',
    'medium': '中等优先级',
    'high': '高优先级'
  }
  return labelMap[priority] || '未知'
}

const createProject = async () => {
  creating.value = true

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))

    ElMessage.success('项目创建成功')
    router.push('/main/project-list')
  } catch (error) {
    ElMessage.error('项目创建失败')
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.create-project-page {
  max-width: 1900px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
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

.page-header .desc {
  color: #6b7785;
  font-size: 14px;
  margin: 0;
}

.btn-group {
  margin-top: 8px;
  display: flex;
  gap: 12px;
}

/* 步骤容器 */
.steps-container {
  /* background: white; */
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  /* box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); */
}

.steps-container1 {
  background: rgb(253, 252, 252);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

/* 表单容器 */
.form-container {
  margin-bottom: 24px;
}

.step-content {
  min-height: 400px;
}

.form-card {
  background: rgb(253, 252, 252);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.card-header {
  margin-bottom: 32px;
  text-align: center;
}

.card-header h3 {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.card-header p {
  font-size: 14px;
  color: #6c757d;
  margin: 0;
}

/* 表单样式 */
.form-tip {
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.priority-option {
  display: flex;
  align-items: center;
  gap: 6px;
}

.priority-icon {
  font-size: 16px;
}

/* 项目类型选项 */
.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.option-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.option-content {
  flex: 1;
}

.option-title {
  font-weight: 600;
  color: #2c3e50;
}

.option-desc {
  font-size: 12px;
  color: #6c757d;
}

/* 评测模式选项 */
.mode-option {
  margin-left: 8px;
}

.mode-title {
  font-weight: 600;
  color: #2c3e50;
}

.mode-desc {
  font-size: 12px;
  color: #6c757d;
}

/* 成员管理 */
.members-section {
  margin-top: 24px;
}

.add-member-form {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-email {
  font-size: 12px;
  color: #6c757d;
}

.members-list {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.list-header {
  background: #f8f9fa;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.list-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.empty-members {
  text-align: center;
  padding: 40px 20px;
}

.empty-members p {
  color: #6c757d;
  margin: 8px 0;
}

.empty-tip {
  font-size: 12px;
}

.members-grid {
  padding: 20px;
  display: grid;
  gap: 16px;
}

.member-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.member-details {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: 600;
  color: #2c3e50;
}

.member-email {
  font-size: 12px;
  color: #6c757d;
}

.member-role {
  margin: 0 16px;
}

/* 确认信息 */
.confirmation-content {
  max-width: 800px;
  margin: 0 auto;
}

.info-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e9ecef;
}

.info-section:last-child {
  border-bottom: none;
}

.info-section h4 {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 16px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.info-item label {
  font-weight: 600;
  color: #495057;
  min-width: 100px;
}

.info-item span {
  color: #2c3e50;
  flex: 1;
}

.members-summary {
  display: flex;
  align-items: center;
  gap: 16px;
}

.member-count {
  font-weight: 600;
  color: #495057;
}

.member-avatars {
  display: flex;
  align-items: center;
}

.more-members {
  color: #6c757d;
  font-size: 12px;
}

.create-actions {
  text-align: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e9ecef;
}

.create-actions a {
  color: #667eea;
  /* text-decoration: none; */
}


/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* background: white; */
  padding: 20px 32px;
  border-radius: 16px;
  /* box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); */
}

.buttons-left,
.buttons-right {
  display: flex;
  gap: 12px;
}

/* 步骤样式 */
:deep(.el-steps) {
  margin: 20px 0;
}

:deep(.el-step__title) {
  font-weight: 600;
  font-size: 16px;
}

:deep(.el-step__description) {
  font-size: 12px;
  color: #6c757d;
}

/* 表单样式 */
:deep(.el-form-item__label) {
  font-weight: 600;
  color: #495057;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .create-project-page {
    padding: 16px;
  }

  .form-card {
    padding: 20px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 16px;
  }

  .buttons-left,
  .buttons-right {
    width: 100%;
    justify-content: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .member-card {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .members-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>