<template>
    <div class="team-member-page" v-loading="loading">
        <div class="page-header">
            <h2>团队成员与权限</h2>
            <div class="ops">
                <el-button type="primary"  size="large" @click="openAddDialog" class="btn-primary">新增成员</el-button>
                <!-- <el-button size="small" @click="reload">刷新</el-button> -->
            </div>
        </div>

        <el-row :gutter="16">
            <el-col :md="16" :xs="24">
                <el-card shadow="never" class="member-card">
                    <template #header>
                        <div class="card-hd">
                            <span>成员信息</span>
                            <el-input v-model="keyword" placeholder="搜索姓名 / 部门" size="small" clearable
                                style="width:220px" @clear="filterMembers" @input="filterMembers">
                                <template #prefix><el-icon>
                                        <Search />
                                    </el-icon></template>
                            </el-input>
                        </div>
                    </template>

                    <el-table :data="filteredMembers" border stripe size="small" height="430px" width="100%"
                        @selection-change="onSelectionChange">
                        <el-table-column type="selection" width="33px" />
                        <el-table-column label="头像" width="60">
                            <template #default="{ row }">
                                <el-avatar :size="36" :style="{ background: roleColor(row.role) }">
                                    {{ row.name?.[0]?.toUpperCase() }}
                                </el-avatar>
                            </template>
                        </el-table-column>
                        <el-table-column prop="name" label="姓名" />
                        <el-table-column label="角色">
                            <template #default="{ row }">
                                <el-tag :type="roleTagType(row.role)" effect="plain" size="small">
                                    <el-icon v-if="roleIcon(row.role)" style="margin-right:4px;">
                                        <component :is="roleIcon(row.role)" />
                                    </el-icon>
                                    {{ roleLabel(row.role) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="dept" label="部门" show-overflow-tooltip />
                        <el-table-column prop="joinTime" label="加入时间" />
                        <el-table-column label="操作" width="200" fixed="right">
                            <template #default="{ row }">
                                <!-- <el-divider direction="vertical" /> -->
                                <el-button text size="small" type="warning" :disabled="!isManager"
                                    @click="openEditMember(row)">
                                    编辑权限
                                </el-button>
                                <el-divider direction="vertical" />
                                <el-button text size="small" type="danger"
                                    :disabled="!isManager || row.role === 'manager'" @click="removeMember(row)">
                                    移除成员
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>

                    <div class="table-footer">
                        <div class="left">
                            <el-button size="small" :disabled="!isManager || !selection.length" @click="batchRemove">
                                批量移除
                            </el-button>
                        </div>
                        <el-pagination v-if="filteredMembers.length > pageSize" v-model:current-page="page"
                            v-model:page-size="pageSize" :total="filteredMembers.length"
                            layout="total, prev, pager, next" small background />
                    </div>
                </el-card>
            </el-col>

            <el-col :md="8" :xs="24">
                <el-card shadow="never" class="role-desc-card">
                    <template #header>
                        <div class="card-hd"><span>角色与职责说明</span></div>
                    </template>
                    <div class="role-desc-list">
                        <div v-for="r in roleList" :key="r.key" class="role-item">
                            <div class="icon-wrap" :style="{ background: r.color }">
                                <el-icon>
                                    <component :is="r.icon" />
                                </el-icon>
                            </div>
                            <div class="meta">
                                <div class="title">
                                    {{ r.label }}
                                    <el-tag size="small" :type="roleTagType(r.key)" effect="plain"
                                        style="margin-left:6px;">
                                        {{ r.key }}
                                    </el-tag>
                                </div>
                                <div class="desc">{{ r.desc }}</div>
                                <div class="perms">
                                    <span v-for="p in rolePermissions[r.key]" :key="p" class="perm-chip">{{
                                        permissionLabel(p)
                                        }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-card>

            </el-col>
        </el-row>

        <!-- 编辑成员角色 -->
        <el-dialog v-model="editMemberVisible" title="编辑成员权限" width="460px" :close-on-click-modal="false">
            <el-form :model="editMemberForm" label-width="90px">
                <el-form-item label="姓名">
                    <el-input v-model="editMemberForm.name" disabled />
                </el-form-item>
                <el-form-item label="当前角色">
                    <el-select v-model="editMemberForm.role" style="width:240px">
                        <el-option v-for="r in roleList" :key="r.key" :label="r.label" :value="r.key"
                            :disabled="r.key === 'manager' && currentUserId !== editMemberForm.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="部门">
                    <el-select v-model="editMemberForm.dept" placeholder="请选择部门" style="width:240px">
                        <el-option v-for="d in departmentOptions" :key="d" :label="d" :value="d" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="editMemberVisible = false">取消</el-button>
                <el-button type="primary" @click="saveMemberEdit">保存</el-button>
            </template>
        </el-dialog>


        <!-- 新增成员 -->

        <el-dialog v-model="addVisible" title="新增成员" width="420px">
            <el-form :model="addForm" label-width="80px">
                <el-form-item label="姓名">
                    <el-input v-model="addForm.name" placeholder="请输入姓名" />
                </el-form-item>
                <el-form-item label="角色">
                    <el-select v-model="addForm.role" style="width:220px">
                        <el-option v-for="r in roleList" :key="r.key" :label="r.label" :value="r.key" />
                    </el-select>
                </el-form-item>
                <el-form-item label="部门">
                    <!-- 修复：原来误写成 editMemberForm.dept -->
                    <el-select v-model="addForm.dept" placeholder="请选择部门" style="width:220px">
                        <el-option v-for="d in departmentOptions" :key="d" :label="d" :value="d" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="addVisible = false">取消</el-button>
                <el-button type="primary" @click="submitAdd">添加</el-button>
            </template>
        </el-dialog>


    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Setting, Finished, Tickets, Search } from '@element-plus/icons-vue'

/* ============ 权限与角色定义 ============ */
const STORAGE_MEMBERS = 'TEAM_MEMBERS_V1'
const STORAGE_ROLE_PERMS = 'TEAM_ROLE_PERMS_V1'

const taskDialogVisible = ref(false)
const taskViewMember = ref(null)
const tasksForMember = ref([])

const departmentOptions = ['研发部', '质控部', '测试部']
const departmentTasks = {
    '研发部': [
        { id: 101, title: '接口适配与错误码统一', status: 'running', progress: 55, updatedAt: '2025-02-10 10:22' },
        { id: 102, title: 'Prompt 优化引擎重构', status: 'running', progress: 35, updatedAt: '2025-02-09 18:40' },
        { id: 103, title: 'E2E 性能压测（第一轮）', status: 'todo', progress: 0, updatedAt: '2025-02-07 16:03' }
    ],
    '质控部': [
        { id: 201, title: '指标集审核流程规范 V2', status: 'done', progress: 100, updatedAt: '2025-02-06 11:18' },
        { id: 202, title: '新增数据集质量评分脚本', status: 'running', progress: 70, updatedAt: '2025-02-10 09:30' },
        { id: 203, title: '审核积压清理（>30条）', status: 'running', progress: 45, updatedAt: '2025-02-10 08:55' }
    ],
    '测试部': [
        { id: 301, title: '回归用例集补充', status: 'running', progress: 60, updatedAt: '2025-02-09 17:05' },
        { id: 302, title: 'Prompt 优化模块冒烟测试', status: 'todo', progress: 0, updatedAt: '2025-02-10 12:00' },
        { id: 303, title: '前端交互边界条件验证', status: 'todo', progress: 0, updatedAt: '2025-02-08 15:22' }
    ]
}

const roleList = [
    {
        key: 'manager',
        label: '项目经理',
        desc: '统筹与交付；成员与权限配置',
        color: '#3056d3',
        icon: Setting
    },
    {
        key: 'auditor',
        label: '审核人员',
        desc: '审核指标与数据集',
        color: '#d48806',
        icon: Tickets
    },
    {
        key: 'developer',
        label: '开发人员',
        desc: '实现与交付业务逻辑',
        color: '#20897c',
        icon: Finished
    }
]

// 功能模块池（权限点）
const permissionPool = [
    { key: 'member_manage', label: '成员管理', desc: '新增 / 移除 / 调整角色' },
    { key: 'role_assign', label: '角色分配', desc: '配置角色权限矩阵' },
    { key: 'project_module', label: 'PROMPT调优', desc: '执行prompt优化' },
    { key: 'dataset_review', label: '数据集审核', desc: '审批上传的数据集' },
    { key: 'metric_review', label: '指标审核', desc: '审批上传的评测指标' },
    { key: 'evaluation_run', label: '模型评测', desc: '执行/查看评测任务' }
]

// 初始默认角色权限
const defaultRolePermissions = {
    manager: permissionPool.map(p => p.key),
    auditor: ['dataset_review', 'metric_review'],
    developer: ['project_module', 'evaluation_run']
}

const rolePermissions = ref(loadRolePermissions())

function loadRolePermissions() {
    try {
        const raw = localStorage.getItem(STORAGE_ROLE_PERMS)
        if (raw) return JSON.parse(raw)
    } catch { }
    return { ...defaultRolePermissions }
}

function permissionLabel(key) {
    return permissionPool.find(p => p.key === key)?.label || key
}

/* ============ 成员数据（Mock） ============ */
const members = ref(loadMembers())

function loadMembers() {
  try {
    const raw = localStorage.getItem(STORAGE_MEMBERS)
    if (raw) return JSON.parse(raw)
  } catch {}
  return [
    { id: 1, name: '张三', role: 'manager',  dept: '研发部', joinTime: '2024-12-01 10:00' },
    { id: 2, name: '李四', role: 'developer', dept: '研发部', joinTime: '2025-01-02 09:30' },
    { id: 3, name: '王五', role: 'auditor',   dept: '质控部', joinTime: '2025-01-05 14:12' },
    { id: 4, name: '赵六', role: 'developer',  dept: '测试部', joinTime: '2025-02-10 11:22' }
  ]
}

function persistMembers() {
    localStorage.setItem(STORAGE_MEMBERS, JSON.stringify(members.value))
}

function persistRolePerms() {
    localStorage.setItem(STORAGE_ROLE_PERMS, JSON.stringify(rolePermissions.value))
}

/* 当前登录用户（可替换为 userStore 信息） */
const currentUserId = 1
const currentUser = computed(() => members.value.find(m => m.id === currentUserId))
// const isManager = computed(() => currentUser.value?.role === 'manager')
const isManager = ref('manager')// 测试用

/* ============ 表格逻辑 ============ */
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const pageSize = ref(50) // 展示全部无需分页可调大
const selection = ref([])

const filteredMembers = computed(() => {
    if (!keyword.value.trim()) return members.value
    const kw = keyword.value.trim().toLowerCase()
    return members.value.filter(m =>
        m.name.toLowerCase().includes(kw) ||
        (m.dept || '').toLowerCase().includes(kw)
    )
})

function onSelectionChange(rows) {
    selection.value = rows
}

function filterMembers() {
    page.value = 1
}

function roleLabel(r) {
    return roleList.find(x => x.key === r)?.label || r
}
function roleIcon(r) {
    return roleList.find(x => x.key === r)?.icon || UserFilled
}
function roleTagType(r) {
    if (r === 'manager') return 'primary'
    if (r === 'auditor') return 'warning'
    if (r === 'developer') return 'success'
    return 'info'
}
function roleColor(r) {
    return roleList.find(x => x.key === r)?.color || '#666'
}

/* ============ 操作 ============ */
function openEditMember(row) {
  editMemberForm.value.id = row.id
  editMemberForm.value.name = row.name
  editMemberForm.value.role = row.role
  editMemberForm.value.dept = departmentOptions.includes(row.dept) ? row.dept : ''
  editMemberVisible.value = true
}

function saveMemberEdit() {
  const f = editMemberForm.value
  if (!f.dept) {
    ElMessage.warning('请选择部门')
    return
  }
  const idx = members.value.findIndex(m => m.id === f.id)
  if (idx > -1) {
    members.value[idx].role = f.role
    members.value[idx].dept = f.dept
    persistMembers()
    ElMessage.success('已保存成员变更')
  }
  editMemberVisible.value = false
}

function removeMember(row) {
    ElMessageBox.confirm(`确认移除成员「${row.name}」？`, '提示', { type: 'warning' })
        .then(() => {
            const idx = members.value.findIndex(m => m.id === row.id)
            if (idx > -1) {
                members.value.splice(idx, 1)
                persistMembers()
                ElMessage.success('已移除')
            }
        })
}

function batchRemove() {
    if (!selection.value.length) return
    ElMessageBox.confirm(`确认批量移除 ${selection.value.length} 名成员？`, '批量移除', { type: 'warning' })
        .then(() => {
            const ids = selection.value.map(r => r.id)
            members.value = members.value.filter(m => !ids.includes(m.id))
            selection.value = []
            persistMembers()
            ElMessage.success('已批量移除')
        })
}

function reload() {
    loading.value = true
    setTimeout(() => loading.value = false, 300)
}

/* ============ 编辑成员对话框 ============ */
const editMemberVisible = ref(false)
const editMemberForm = ref({
    id: null,
    name: '',
    role: '',
    dept: ''
})

/* ============ 新增成员 ============ */
const addVisible = ref(false)
const addForm = ref({
    name: '',
    role: 'developer',
    dept: ''
})
function openAddDialog() {
    if (!isManager.value) {
        ElMessage.warning('仅项目经理可添加成员')
        return
    }
    addForm.value = { name: '', role: 'developer', dept: '' }
    addVisible.value = true
}
function submitAdd() {
    if (!addForm.value.name.trim()) {
        ElMessage.warning('请输入姓名')
        return
    }
    if (!addForm.value.dept) {
        ElMessage.warning('请选择部门')
        return
    }
    const now = new Date()
    members.value.unshift({
        id: Date.now(),
        name: addForm.value.name.trim(),
        role: addForm.value.role,
        dept: addForm.value.dept,
        joinTime: now.toLocaleString('zh-CN')
    })
    persistMembers()
    ElMessage.success('新增成员成功')
    addVisible.value = false
}

/* ============ 角色权限矩阵 ============ */
const rolePermVisible = ref(false)
const rolePermDraft = ref({})

function openRolePermissionDialog() {
    if (!isManager.value) {
        ElMessage.warning('仅项目经理可配置权限')
        return
    }
    // 深拷贝
    rolePermDraft.value = {}
    for (const r of roleList) {
        rolePermDraft.value[r.key] = [...(rolePermissions.value[r.key] || [])]
    }
    rolePermVisible.value = true
}

function toggleRolePerm(roleKey, permKey) {
    const arr = rolePermDraft.value[roleKey] || []
    const idx = arr.indexOf(permKey)
    if (idx > -1) arr.splice(idx, 1)
    else arr.push(permKey)
    rolePermDraft.value[roleKey] = arr
}

function saveRolePerms() {
    rolePermissions.value = JSON.parse(JSON.stringify(rolePermDraft.value))
    persistRolePerms()
    ElMessage.success('角色权限已保存')
    rolePermVisible.value = false
}

/* ============ 权限判断辅助（可在其它页面调用） ============ */
function canAccess(moduleKey) {
    const role = currentUser.value?.role
    return rolePermissions.value[role]?.includes(moduleKey)
}
</script>

<style scoped>
.team-member-page {
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

.card-hd {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
}

.member-card,
.role-desc-card,
.legend-card {
    border: 1px solid #e6ecf3;
    border-radius: 12px;
}

.role-desc-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 10px;
}

.role-item {
    display: flex;
    gap: 12px;
    padding: 8px 8px 10px;
    border: 1px solid #eef2f6;
    border-radius: 10px;
    background: linear-gradient(180deg, #fff, #f9fbfd);
}

.icon-wrap {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 20px;
    flex-shrink: 0;
}

.role-item .meta .title {
    font-size: 14px;
    font-weight: 600;
    color: #27323f;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
}

.role-item .meta .desc {
    font-size: 12px;
    color: #596775;
    line-height: 1.4;
    margin-bottom: 6px;
}

.perms {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.perm-chip {
    font-size: 11px;
    background: #eef3ff;
    color: #3556b3;
    padding: 2px 6px;
    border-radius: 10px;
    line-height: 1.2;
}

.perm-manage-hint {
    text-align: center;
    margin-top: 4px;
}

.legend-card {
    margin-top: 16px;
}

.legend-ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
    color: #4a5866;
}

.legend-ul li b {
    color: #1f2733;
    font-weight: 600;
}

.table-footer {
    margin-top: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.role-perm-matrix {
    max-height: 420px;
    overflow: auto;
    border: 1px solid #e6ecf3;
    border-radius: 8px;
}

.perm-matrix {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}

.perm-matrix thead th {
    background: #f2f6fb;
    padding: 8px;
    text-align: center;
    font-weight: 600;
    border-bottom: 1px solid #e1e7ef;
}

.perm-matrix tbody td {
    border-bottom: 1px solid #f0f3f7;
    padding: 6px 8px;
    vertical-align: top;
}

.perm-matrix tbody tr:last-child td {
    border-bottom: none;
}

.mod-name {
    width: 220px;
}

.mod-name b {
    display: block;
    margin-bottom: 2px;
    font-size: 13px;
    color: #243042;
}

.mod-desc {
    font-size: 11px;
    line-height: 1.4;
    color: #5e6d7b;
}

.chk-cell {
    text-align: center;
    min-width: 80px;
}

@media (max-width: 950px) {
    .role-perm-matrix {
        font-size: 11px;
    }

    .perm-matrix thead th,
    .perm-matrix tbody td {
        padding: 6px 6px;
    }
}

@media (max-width: 760px) {
    .team-member-page {
        padding: 12px 14px 34px;
    }

    .member-card,
    .role-desc-card,
    .legend-card {
        border-radius: 10px;
    }

    .perm-matrix thead {
        position: sticky;
        top: 0;
        z-index: 2;
    }
}

.task-meta-line {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 8px;
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
</style>