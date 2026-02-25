<template>
    <div class="team-setting-page" v-loading="loading">
        <div class="header">
            <h2>项目模块状态面板</h2>
        </div>

        <!-- 基本信息 -->
        <el-card shadow="never" class="block-card">
            <template #header>
                <div class="card-hd">
                    <span>团队信息配置</span>
                    <el-tag type="info" size="small">ID: {{ form.id }}</el-tag>
                </div>
            </template>
            <el-form :model="form" label-width="100px" :disabled="!isManager" class="team-form" ref="teamFormRef">
                <el-form-item label="团队名称">
                    <el-input v-model="form.name" maxlength="40" show-word-limit placeholder="请输入团队名称" />
                </el-form-item>
                <el-form-item label="简介">
                    <el-input v-model="form.description" type="textarea" :rows="3" maxlength="300" show-word-limit
                        placeholder="请输入团队简介" />
                </el-form-item>
                <el-form-item label="成立时间">
                    <el-date-picker v-model="form.foundedAt" type="date" value-format="YYYY-MM-DD" placeholder="选择日期"
                        style="width: 220px" />
                </el-form-item>
                <el-form-item label="团队公告">
                    <el-input v-model="form.announcement" type="textarea" :rows="4" maxlength="500" show-word-limit
                        placeholder="公告内容（支持换行）" />
                </el-form-item>
                <el-form-item v-if="isManager">
                    <el-button type="primary" :loading="saving" @click="saveTeamInfo">保存信息</el-button>
                    <el-button @click="reset">重置</el-button>
                </el-form-item>
                <el-form label-width="100px" class="handover-form">
                    <el-form-item label="选择成员">
                        <el-select v-model="handoverTarget" filterable placeholder="选择新的项目经理" style="width:260px">
                            <el-option v-for="m in memberOptions" :key="m.id" :label="`${m.name}（${roleLabel(m.role)}）`"
                                :value="m.id" :disabled="m.id === currentUserId" />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="warning" :disabled="!handoverTarget" :loading="handoverLoading"
                            @click="confirmHandover">确认移交</el-button>
                    </el-form-item>
                    <el-alert title="此操作会将当前账号降级为开发人员或保持原角色。" type="warning" show-icon :closable="false" />
                </el-form>
            </el-form>
            <el-alert v-if="!isManager" title="只有项目经理可以修改团队信息" type="info" show-icon :closable="false"
                class="readonly-tip" />
        </el-card>

        <!-- 解散团队 -->
        <el-card shadow="never" class="block-card danger-card" v-if="isManager">
            <template #header>
                <div class="card-hd danger">
                    <span>解散团队</span>
                </div>
            </template>
            <p class="danger-text">
                警告：解散后与团队相关的数据（成员、配置）将被清除。
            </p>
            <el-button type="danger" plain :loading="dissolving" @click="dissolveTeam">
                解散团队
            </el-button>
        </el-card>

    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

/* 本地存储键 */
const TEAM_INFO_KEY = 'TEAM_INFO_V1'
const TEAM_SECURITY_KEY = 'TEAM_SECURITY_V1'
const TEAM_MEMBERS_KEY = 'TEAM_MEMBERS_V1'

/* 模拟当前登录用户 */
const currentUserId = 1

const loading = ref(false)
const saving = ref(false)
const savingSec = ref(false)
const handoverLoading = ref(false)
const dissolving = ref(false)

/* ========== 加载成员（用于移交、身份展示） ========== */
function loadMembers() {
    try {
        const raw = localStorage.getItem(TEAM_MEMBERS_KEY)
        if (raw) return JSON.parse(raw)
    } catch { }
    // 默认成员
    return [
        { id: 1, name: '张三', role: 'manager' },
        { id: 2, name: '李四', role: 'developer' },
        { id: 3, name: '王五', role: 'auditor' }
    ]
}
const members = ref(loadMembers())
const currentUser = computed(() => members.value.find(m => m.id === currentUserId))
const myRole = computed(() => currentUser.value?.role || 'developer')
// const isManager = computed(() => myRole.value === 'manager')
const isManager = ref(true) // 方便测试
const memberOptions = computed(() => members.value)

/* 角色显示 */
function roleLabel(r) {
    if (r === 'manager') return '项目经理'
    if (r === 'auditor') return '审核人员'
    if (r === 'developer') return '开发人员'
    return r
}
function roleTagType(r) {
    if (r === 'manager') return 'success'
    if (r === 'auditor') return 'warning'
    return 'info'
}

/* ========== 团队信息加载/保存 ========== */
function defaultTeam() {
    return {
        id: 'TEAM-' + new Date().getFullYear() + '-001',
        name: 'AI 评测团队',
        description: '负责模型评测、数据集与指标体系建设。',
        foundedAt: new Date().toISOString().slice(0, 10),
        announcement: '欢迎加入团队，共同建设评测体系！',
        ownerId: currentUserId
    }
}
function loadTeamInfo() {
    try {
        const raw = localStorage.getItem(TEAM_INFO_KEY)
        if (raw) return JSON.parse(raw)
    } catch { }
    const d = defaultTeam()
    localStorage.setItem(TEAM_INFO_KEY, JSON.stringify(d))
    return d
}
const form = reactive(loadTeamInfo())
const backup = ref(JSON.stringify(form))

function saveTeamInfo() {
    if (!form.name.trim()) return ElMessage.warning('团队名称不能为空')
    saving.value = true
    setTimeout(() => {
        try {
            localStorage.setItem(TEAM_INFO_KEY, JSON.stringify(form))
            backup.value = JSON.stringify(form)
            ElMessage.success('已保存')
        } catch {
            ElMessage.error('保存失败')
        } finally {
            saving.value = false
        }
    }, 300)
}

function reset() {
    Object.assign(form, JSON.parse(backup.value))
    ElMessage.info('已还原未保存内容')
}

/* ========== 公告自动保存（可选） ========== */
// 可使用 watch(form.announcement,...) 实现实时保存，这里保持手动保存逻辑。

/* ========== 安全策略 ========== */
function defaultSecurity() {
    return {
        allowExternalInvite: true,
        requireAudit: true,
        exportConfirm: true
    }
}
function loadSecurity() {
    try {
        const raw = localStorage.getItem(TEAM_SECURITY_KEY)
        if (raw) return JSON.parse(raw)
    } catch { }
    const d = defaultSecurity()
    localStorage.setItem(TEAM_SECURITY_KEY, JSON.stringify(d))
    return d
}
const security = reactive(loadSecurity())

function saveSecurity() {
    savingSec.value = true
    setTimeout(() => {
        try {
            localStorage.setItem(TEAM_SECURITY_KEY, JSON.stringify(security))
            ElMessage.success('安全策略已保存')
        } catch {
            ElMessage.error('保存失败')
        } finally {
            savingSec.value = false
        }
    }, 300)
}

/* ========== 项目经理移交 ========== */
const handoverTarget = ref(null)
function confirmHandover() {
    if (!handoverTarget.value) return
    if (handoverTarget.value === currentUserId) {
        return ElMessage.warning('请选择其他成员')
    }
    ElMessageBox.confirm(
        '确定将项目经理身份移交给该成员？移交后您将失去相关管理权限。',
        '确认移交',
        { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    ).then(() => {
        handoverLoading.value = true
        setTimeout(() => {
            try {
                // 旧负责人降级为开发者
                const old = members.value.find(m => m.id === form.ownerId)
                if (old) old.role = 'developer'
                // 新负责人升级
                const target = members.value.find(m => m.id === handoverTarget.value)
                if (target) target.role = 'manager'
                form.ownerId = handoverTarget.value
                localStorage.setItem(TEAM_MEMBERS_KEY, JSON.stringify(members.value))
                localStorage.setItem(TEAM_INFO_KEY, JSON.stringify(form))
                handoverTarget.value = null
                ElMessage.success('移交成功，请刷新查看权限变化')
            } catch {
                ElMessage.error('移交失败')
            } finally {
                handoverLoading.value = false
            }
        }, 400)
    }).catch(() => { })
}

/* ========== 解散团队 ========== */
function dissolveTeam() {
    ElMessageBox.confirm(
        '解散后团队数据将被清空（本地模拟）。确认继续？',
        '解散团队',
        { type: 'error', confirmButtonText: '解散', cancelButtonText: '取消' }
    ).then(() => {
        dissolving.value = true
        setTimeout(() => {
            try {
                localStorage.removeItem(TEAM_INFO_KEY)
                localStorage.removeItem(TEAM_SECURITY_KEY)
                localStorage.removeItem(TEAM_MEMBERS_KEY)
                ElMessage.success('团队已解散（本地数据已清空）')
                // 可跳转到首页或创建页
            } catch {
                ElMessage.error('解散失败')
            } finally {
                dissolving.value = false
            }
        }, 500)
    }).catch(() => { })
}
</script>

<style scoped>
.team-setting-page {
    max-width: 1900px;
    margin: 0 auto;
    padding: 24px;
    background: #fff;
    border-radius: 16px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding: 0 10px;
}

.header h2 {
    font-size: 26px;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 6px;
    letter-spacing: 0.2px;
}

.pg-hd {
    margin-bottom: 8px;
}

.block-card {
    margin-bottom: 18px;
    border: 1px solid #e6ecf3;
    border-radius: 14px;
}

.card-hd {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    font-size: 15px;
}

.card-hd.danger {
    color: #d4380d;
}

.team-form :deep(.el-form-item) {
    margin-bottom: 18px;
}

.readonly-tip {
    margin-top: 8px;
}

.identity-line {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 13px;
    padding: 4px 2px;
    flex-wrap: wrap;
}

.identity-line .uid {
    color: #606d7b;
}

.mgr-flag {
    color: #1677ff;
    font-weight: 500;
}

.sec-form small.hint {
    margin-left: 12px;
    color: #708290;
    font-size: 12px;
}

.handover-form :deep(.el-form-item) {
    margin-bottom: 16px;
}

.danger-card {
    border: 1px solid #ffd9d5;
    background: #fff6f5;
}

.danger-text {
    color: #a8071a;
    font-size: 13px;
    line-height: 1.5;
    margin: 0 0 14px;
}
</style>
```