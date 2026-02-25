<template>
  <div class="project-settings-page">
    <!-- 页面头部 -->
    <div class="page-header overview-card">
      <div class="header-left">
        <h2 class="page-title">
          项目设置
        </h2>
        <p class="desc">管理您的各类项目</p>
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

    <!-- 设置内容 -->
    <div class="settings-content">
      <el-tabs v-model="activeTab" type="card" class="settings-tabs">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <template #label>
            <div class="tab-label">
              <el-icon>
                <InfoFilled />
              </el-icon>
              基本信息
            </div>
          </template>
          <div class="tab-content">
            <el-form ref="basicFormRef" :model="basicForm" :rules="basicRules" label-width="120px"
              class="settings-form">
              <el-form-item label="项目名称" prop="name">
                <el-input v-model="detail.taskName" style="width: 400px" disabled />
              </el-form-item>

              <el-form-item label="项目类型" prop="type">
                <el-select v-model="basicForm.type" placeholder="请选择项目类型" style="width: 400px" disabled>
                  <el-option label="prompt调优" value="文本分类评测" />
                  <el-option label="模型评测" value="情感分析评测" />

                </el-select>
              </el-form-item>

              <el-form-item label="项目描述" prop="description">
                <el-input v-model="basicForm.description" type="textarea" :rows="4" placeholder="请输入项目描述"
                  style="width: 600px" />
              </el-form-item>

              <el-form-item label="项目状态" prop="status">
                <el-radio-group v-model="detail.status">
                  <el-radio :label="1">进行中</el-radio>
                  <el-radio :label="2">已完成</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-button @click="saveAllSettings" :loading="saveLoading" type="primary" style="margin-left: 50px;">
                更新
              </el-button>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 成员管理 -->
        <el-tab-pane label="成员管理" name="members">
          <template #label>
            <div class="tab-label">
              <el-icon>
                <User />
              </el-icon>
              成员管理
            </div>
          </template>
          <div class="tab-content">
            <div class="section-header">
              <h3>项目成员</h3>
              <el-button type="primary" @click="showAddMemberDialog">
                <el-icon>
                  <Plus />
                </el-icon>
                添加成员
              </el-button>
            </div>

            <el-table :data="projectMembers" style="width: 100%" class="members-table">
              <el-table-column label="成员" width="300">
                <template #default="scope">
                  <div class="member-info">
                    <el-avatar :size="40" :src="scope.row.avatar">
                      {{ scope.row.name.charAt(0) }}
                    </el-avatar>
                    <div class="member-details">
                      <div class="member-name">{{ scope.row.name }}</div>
                      <div class="member-email">{{ scope.row.email }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column prop="role" label="角色" width="150">
                <template #default="scope">
                  <el-tag :type="getRoleTagType(scope.row.role)">
                    {{ getRoleLabel(scope.row.role) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="joinTime" label="加入时间" width="180">
                <template #default="scope">
                  {{ formatTime(scope.row.joinTime) }}
                </template>
              </el-table-column>

              <el-table-column label="权限" width="200">
                <template #default="scope">
                  <div class="permissions">
                    <el-tag v-for="permission in scope.row.permissions" :key="permission" size="small"
                      style="margin-right: 4px;">
                      {{ getPermissionLabel(permission) }}
                    </el-tag>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="操作" width="180">
                <template #default="scope">
                  <el-button size="small" @click="editMember(scope.row)" :disabled="scope.row.role === 'owner'">
                    编辑
                  </el-button>
                  <el-button size="small" type="danger" @click="removeMember(scope.row)"
                    :disabled="scope.row.role === 'owner'">
                    移除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 权限配置 -->
        <!-- <el-tab-pane label="权限配置" name="permissions">
          <template #label>
            <div class="tab-label">
              <el-icon>
                <Lock />
              </el-icon>
              权限配置
            </div>
          </template>
          <div class="tab-content">
            <div class="permissions-section">
              <h3>角色权限</h3>
              <div class="role-permissions">
                <div v-for="role in rolePermissions" :key="role.key" class="role-card">
                  <div class="role-header">
                    <h4>{{ role.name }}</h4>
                    <el-tag :type="getRoleTagType(role.key)">{{ role.description }}</el-tag>
                  </div>
                  <div class="permissions-list">
                    <el-checkbox-group v-model="role.permissions">
                      <el-checkbox v-for="permission in allPermissions" :key="permission.key" :value="permission.key"
                        disabled>
                        {{ permission.name }}
                      </el-checkbox>
                    </el-checkbox-group>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane> -->

        <!-- 通知设置 -->
        <!-- <el-tab-pane label="通知设置" name="notifications">
          <template #label>
            <div class="tab-label">
              <el-icon>
                <Bell />
              </el-icon>
              通知设置
            </div>
          </template>
          <div class="tab-content">
            <el-form :model="notificationSettings" label-width="150px" class="settings-form">
              <div class="notification-section">
                <h3>邮件通知</h3>
                <el-form-item label="评测完成通知">
                  <el-switch v-model="notificationSettings.email.evaluationComplete" active-text="开启"
                    inactive-text="关闭" />
                  <span class="setting-desc">评测任务完成时发送邮件通知</span>
                </el-form-item>

                <el-form-item label="错误警告通知">
                  <el-switch v-model="notificationSettings.email.errorAlert" active-text="开启" inactive-text="关闭" />
                  <span class="setting-desc">出现错误时发送警告邮件</span>
                </el-form-item>

                <el-form-item label="每日报告">
                  <el-switch v-model="notificationSettings.email.dailyReport" active-text="开启" inactive-text="关闭" />
                  <span class="setting-desc">每日发送项目进度报告</span>
                </el-form-item>
              </div>

              <div class="notification-section">
                <h3>系统通知</h3>
                <el-form-item label="浏览器通知">
                  <el-switch v-model="notificationSettings.browser.enabled" active-text="开启" inactive-text="关闭" />
                  <span class="setting-desc">在浏览器中显示通知</span>
                </el-form-item>

                <el-form-item label="声音提醒">
                  <el-switch v-model="notificationSettings.browser.sound" active-text="开启" inactive-text="关闭" />
                  <span class="setting-desc">通知时播放提示音</span>
                </el-form-item>
              </div>
            </el-form>
          </div>
        </el-tab-pane> -->

        <!-- 高级设置 -->
        <el-tab-pane label="高级设置" name="advanced">
          <template #label>
            <div class="tab-label">
              <el-icon>
                <Tools />
              </el-icon>
              高级设置
            </div>
          </template>
          <div class="tab-content">
            <el-form :model="advancedSettings" label-width="150px" class="settings-form">
              <div class="advanced-section">
                <h3>数据保留设置</h3>
                <el-form-item label="日志保留时间">
                  <el-select v-model="advancedSettings.logRetentionDays" style="width: 200px">
                    <el-option label="7天" :value="7" />
                    <el-option label="30天" :value="30" />
                    <el-option label="90天" :value="90" />
                    <el-option label="永久保留" :value="-1" />
                  </el-select>
                  <span class="setting-desc">系统日志的保留时间</span>
                </el-form-item>

                <el-form-item label="评测结果保留">
                  <el-select v-model="advancedSettings.resultRetentionDays" style="width: 200px">
                    <el-option label="30天" :value="30" />
                    <el-option label="90天" :value="90" />
                    <el-option label="180天" :value="180" />
                    <el-option label="永久保留" :value="-1" />
                  </el-select>
                  <span class="setting-desc">评测结果的保留时间</span>
                </el-form-item>
              </div>

              <div class="advanced-section">
                <h3>性能设置</h3>
                <el-form-item label="并发任务数">
                  <el-input-number v-model="advancedSettings.maxConcurrentTasks" :min="1" :max="10"
                    style="width: 200px" />
                  <span class="setting-desc">同时运行的最大任务数量</span>
                </el-form-item>

                <el-form-item label="超时设置">
                  <el-input-number v-model="advancedSettings.taskTimeoutMinutes" :min="5" :max="240"
                    style="width: 200px" />
                  <span class="setting-desc">单个任务的超时时间（分钟）</span>
                </el-form-item>
              </div>

              <div class="advanced-section danger-zone">
                <h3>危险操作</h3>
                <div class="danger-actions">
                  <!-- <div class="danger-item">
                    <div class="danger-info">
                      <h4>清理项目数据</h4>
                      <p>清理所有临时文件和缓存数据，不会影响评测结果</p>
                    </div>
                    <el-button type="warning" @click="cleanProjectData">
                      清理数据
                    </el-button>
                  </div>

                  <div class="danger-item">
                    <div class="danger-info">
                      <h4>重置项目设置</h4>
                      <p>将所有设置恢复为默认值，不会删除数据</p>
                    </div>
                    <el-button type="warning" @click="resetProjectSettings">
                      重置设置
                    </el-button>
                  </div> -->

                  <div class="danger-item">
                    <div class="danger-info">
                      <h4>删除项目</h4>
                      <p>永久删除整个项目，包括所有数据和设置，此操作不可恢复</p>
                    </div>
                    <el-button type="danger" @click="deleteProject">
                      删除项目
                    </el-button>
                  </div>
                </div>
              </div>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 添加成员对话框 -->
    <el-dialog v-model="addMemberDialogVisible" title="添加项目成员" width="500px">
      <el-form :model="addMemberForm" label-width="80px">
        <el-form-item label="选择用户">
          <el-select v-model="addMemberForm.userId" placeholder="请选择用户" style="width: 100%" filterable>
            <el-option v-for="user in availableUsers" :key="user.id" :label="user.name" :value="user.id">
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-avatar :size="24" :src="user.avatar">
                  {{ user.name.charAt(0) }}
                </el-avatar>
                <span>{{ user.name }}</span>
                <span style="color: #999; font-size: 12px;">{{ user.email }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="角色">
          <el-select v-model="addMemberForm.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="成员" value="member" />
            <el-option label="观察者" value="viewer" />
          </el-select>
        </el-form-item>

        <el-form-item label="权限">
          <el-checkbox-group v-model="addMemberForm.permissions">
            <el-checkbox v-for="permission in allPermissions" :key="permission.key" :value="permission.key">
              {{ permission.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addMemberDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addMember">添加</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()

// 响应式数据
const activeTab = ref('basic')
const saveLoading = ref(false)
const taskId = ref(route.query.taskId ?? route.params?.id ?? '')
const loading = ref(false)
console.log("当前任务ID:", taskId.value)

const detail = ref({
  taskName: '',
  modelName: '',
  scenarioName: '',
  datasetName: '',
  standardName: '',
  createTime: '',
  updateTime: '',
  status: 1,
})


// 项目信息
const projectInfo = ref({
  id: route.params.id || 'PROJ_001',
  name: 'py算数代码',
  createTime: '2023-12-01 10:30:00',
  updateTime: '2023-12-15 14:20:00'
})

// 基本信息表单
const basicFormRef = ref()
const basicForm = ref({
  name: '',
  type: '情感分析评测',
  description: '',
  status: 'running',
  tags: ['情感分析', '中文NLP', '模型评测']
})

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


// 项目成员
const projectMembers = ref([
  {
    id: 1,
    name: '张三',
    email: 'zs@example.com',
    avatar: '',
    role: 'owner',
    joinTime: '2023-12-01 10:30:00',
    permissions: ['read', 'write', 'admin', 'delete']
  },
  {
    id: 2,
    name: '李四',
    email: 'lisi@example.com',
    avatar: '',
    role: 'admin',
    joinTime: '2023-12-02 09:15:00',
    permissions: ['read', 'write', 'admin']
  },
  {
    id: 3,
    name: '王五',
    email: 'wangwu@example.com',
    avatar: '',
    role: 'member',
    joinTime: '2023-12-03 14:20:00',
    permissions: ['read', 'write']
  }
])

// 添加成员对话框
const addMemberDialogVisible = ref(false)
const addMemberForm = ref({
  userId: '',
  role: 'member',
  permissions: ['read']
})

// 可选用户列表
const availableUsers = ref([
  { id: 4, name: '赵六', email: 'zhaoliu@example.com', avatar: '' },
  { id: 5, name: '孙七', email: 'sunqi@example.com', avatar: '' },
  { id: 6, name: '周八', email: 'zhouba@example.com', avatar: '' }
])

// 权限定义
const allPermissions = ref([
  { key: 'read', name: '查看', description: '查看项目信息和评测结果' },
  { key: 'write', name: '编辑', description: '创建和修改评测任务' },
  { key: 'admin', name: '管理', description: '管理项目设置和成员' },
  { key: 'delete', name: '删除', description: '删除项目和数据' }
])



// 高级设置
const advancedSettings = ref({
  logRetentionDays: 30,
  resultRetentionDays: 90,
  maxConcurrentTasks: 3,
  taskTimeoutMinutes: 60
})

// 方法
const goBack = () => {
  router.back()
}
const rawDetail = ref('')

const datasetNames = computed(() => {
  const d = detail.value
  if (Array.isArray(d.datasetList)) return d.datasetList.filter(Boolean)
  if (typeof d.datasetName === 'string' && d.datasetName) return d.datasetName.split(',').map(s => s.trim()).filter(Boolean)
  return []
})
const standardNames = computed(() => {
  const d = detail.value
  if (Array.isArray(d.standardList)) return d.standardList.filter(Boolean)
  if (typeof d.standardName === 'string' && d.standardName) return d.standardName.split(',').map(s => s.trim()).filter(Boolean)
  return []
})
const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('zh-CN', { hour12: false })
}

const getRoleTagType = (role) => {
  const typeMap = {
    'owner': 'danger',
    'admin': 'warning',
    'member': 'primary',
    'viewer': 'info'
  }
  return typeMap[role] || 'info'
}

const getRoleLabel = (role) => {
  const labelMap = {
    'owner': '所有者',
    'admin': '管理员',
    'member': '成员',
    'viewer': '观察者'
  }
  return labelMap[role] || '未知'
}

const getPermissionLabel = (permission) => {
  const labelMap = {
    'read': '查看',
    'write': '编辑',
    'admin': '管理',
    'delete': '删除'
  }
  return labelMap[permission] || permission
}


// 成员管理
const showAddMemberDialog = () => {
  addMemberDialogVisible.value = true
}

const addMember = () => {
  const selectedUser = availableUsers.value.find(user => user.id === addMemberForm.value.userId)
  if (!selectedUser) {
    ElMessage.error('请选择用户')
    return
  }

  const newMember = {
    ...selectedUser,
    role: addMemberForm.value.role,
    joinTime: new Date().toLocaleString('zh-CN'),
    permissions: [...addMemberForm.value.permissions]
  }

  projectMembers.value.push(newMember)
  addMemberDialogVisible.value = false
  addMemberForm.value = {
    userId: '',
    role: 'member',
    permissions: ['read']
  }
  ElMessage.success('成员添加成功')
}

const editMember = (member) => {
  ElMessage.info('编辑成员功能开发中...')
}

const removeMember = (member) => {
  ElMessageBox.confirm(`确定要移除成员"${member.name}"吗？`, '确认移除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = projectMembers.value.findIndex(m => m.id === member.id)
    if (index > -1) {
      projectMembers.value.splice(index, 1)
      ElMessage.success('成员移除成功')
    }
  })
}

// 高级操作
const cleanProjectData = () => {
  ElMessageBox.confirm('确定要清理项目数据吗？', '确认清理', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('项目数据清理完成')
  })
}

const resetProjectSettings = () => {
  ElMessageBox.confirm('确定要重置项目设置吗？', '确认重置', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('项目设置重置完成')
  })
}

const deleteProject = () => {
  ElMessageBox.prompt('请输入项目名称以确认删除', '删除项目', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    inputPattern: new RegExp(`^${basicForm.value.name}$`),
    inputErrorMessage: '项目名称不匹配',
    type: 'error'
  }).then(() => {
    ElMessage.success('项目删除成功')
    router.push('/projects')
  })
}

const saveAllSettings = () => {
  saveLoading.value = true
  setTimeout(() => {
    saveLoading.value = false
    ElMessage.success('设置保存成功')
  }, 1000)
}
const fetchDetail = async () => {
  if (!taskId.value) {
    ElMessage.error('缺少任务ID')
    return
  }
  loading.value = true
  try {
    const res = await request.get('/evalTask/selectTaskDetailById', { params: { taskId: taskId.value } })
    if (res?.code !== 200) {
      ElMessage.error(res?.msg || '获取任务详情失败')
      return
    }
    const data = res.data
    rawDetail.value = JSON.stringify(data, null, 2)

    // 尝试映射常见字段名
    detail.value = {
      taskName: data.taskName,
      modelName: data.modelName || data.model || '',
      scenarioName: data.scenarioName || data.scene || '',
      datasetName: data.datasetName || '',
      standardName: data.standardName || '',
      createTime: data.createTime || data.gmtCreate || '',
      updateTime: data.updateTime || data.gmtModified || '',
      status: data.taskStatus
    }
    // 回填 id（避免通过 params 进入时缺失）
    if (!taskId.value && (data.taskId || data.evalTaskId)) {
      taskId.value = data.taskId || data.evalTaskId
    }
    ElMessage.success('已加载任务详情')
  } catch (e) {
    ElMessage.error(e?.message || '请求失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)
</script>

<style scoped>
.project-settings-page {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f3ff 100%);
  min-height: calc(100vh - 60px);
}

.overview-card {
  background: white;
  border-radius: 16px;
  padding: 26px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.btn-group {
  margin-top: 8px;
  display: flex;
  gap: 12px;
}

.page-header .desc {

  color: #6b7785;
  font-size: 14px;
  margin-top: -16px;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 32px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back-btn {
  align-self: flex-start;
  color: #667eea;
  font-weight: 600;
}

.page-title {
  font-size: 32px;
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

.project-meta {
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

/* 设置内容 */
.settings-content {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-content {
  padding: 32px;
}

.settings-form {
  max-width: 800px;
}

.setting-desc {
  margin-left: 12px;
  color: #6c757d;
  font-size: 12px;
}

/* 成员管理 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.members-table {
  border-radius: 8px;
  overflow: hidden;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
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

.permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 权限配置 */
.permissions-section h3 {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 24px;
}

.role-permissions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.role-card {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  background: #f8f9fa;
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.role-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.permission-desc {
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}

/* 通知设置 */
.notification-section {
  margin-bottom: 32px;
}

.notification-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
}

/* 高级设置 */
.advanced-section {
  margin-bottom: 32px;
}

.advanced-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
}

.danger-zone {
  border: 1px solid #f56c6c;
  border-radius: 8px;
  padding: 20px;
  background: #fef0f0;
}

.danger-zone h3 {
  color: #f56c6c;
}

.danger-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #fadede;
  border-radius: 8px;
  background: white;
}

.danger-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 4px 0;
}

.danger-info p {
  font-size: 12px;
  color: #6c757d;
  margin: 0;
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 标签页样式 */
:deep(.settings-tabs .el-tabs__header) {
  margin: 0;
  background: #f8f9fa;
  padding: 0 32px;
}

:deep(.settings-tabs .el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.settings-tabs .el-tabs__item) {
  padding: 20px 24px;
  font-weight: 600;
}

:deep(.settings-tabs .el-tabs__item.is-active) {
  background: white;
  border-bottom-color: white;
}




/* 响应式设计 */
@media (max-width: 768px) {
  .project-settings-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }

  .tab-content {
    padding: 20px;
  }

  .role-permissions {
    grid-template-columns: 1fr;
  }

  .danger-item {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>