<template>
    <div class="container">
        <div class="top_nav">
            <img src="../assets/imgs/logo2.png" alt="" class="logo">
            <div class="main-nav">
                <div class="nav-item" :class="{ active: activeTab === 'main' }" @click="switchTab('main')">
                    <el-icon>
                        <HomeFilled />
                    </el-icon>
                    <span>首页</span>
                </div>
                <div class="nav-item" :class="{ active: activeTab === 'dashboard' }" @click="switchTab('dashboard')">
                    <el-icon>
                        <DataAnalysis />
                    </el-icon>
                    <span>数据管理</span>
                </div>
                <!-- <div class="nav-item" :class="{ active: activeTab === 'prompt' }" @click="switchTab('prompt')">
                    <el-icon>
                        <Opportunity />
                    </el-icon>
                    <span>Prompt调优</span>
                </div> -->
                <div class="nav-item" :class="{ active: activeTab === 'evaluation' }" @click="switchTab('evaluation')">
                    <el-icon>
                        <Histogram />
                    </el-icon>
                    <span>模型管理</span>
                </div>
                <div class="nav-item" :class="{ active: activeTab === 'project' }" @click="switchTab('project')">
                    <el-icon>
                        <Menu />
                    </el-icon>
                    <span>项目管理</span>
                </div>
                <div class="nav-item" :class="{ active: activeTab === 'process' }" @click="switchTab('process')"
                    v-if="isAuditor">
                    <el-icon>
                        <Bell />
                    </el-icon>
                    <span>审核</span>
                </div>
                <div class="nav-item" :class="{ active: activeTab === 'team' }" @click="switchTab('team')">
                    <el-icon>
                        <UserFilled />
                    </el-icon>
                    <span>我的团队</span>
                </div>

            </div>
            <!-- 新增：右上角用户头像/用户名/菜单 -->
            <div class="user-area">
                <el-dropdown @command="onUserCommand">
                    <span class="el-dropdown-link user-trigger">
                        <el-avatar :size="36" :src="userAvatar" class="avatar">
                            {{ usernameFirst }}
                        </el-avatar>
                        <span class="username">{{ username }}</span>
                        <el-icon class="caret">
                            <ArrowDown />
                        </el-icon>
                    </span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item disabled>
                                <div class="user-brief">
                                    <el-avatar :size="28" :src="userAvatar" />
                                    <div class="brief-text">
                                        <div class="name">{{ username }}</div>
                                        <div class="role">{{ userRole }}</div>
                                    </div>
                                </div>
                            </el-dropdown-item>
                            <el-dropdown-item divided command="logout">
                                <el-icon style="margin-right:6px;">
                                    <SwitchButton />
                                </el-icon>
                                退出登录
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>
        <div class="main_wrapper">
            <div class="aside_nav" v-if="activeTab !== 'main'">
                <div class="aside-nav-content" style="margin-top: 5px;">
                    <div v-if="activeTab === 'dashboard'" class="nav-menu">
                        <div class="menu-item" :class="{ active: $route.path === '/main/standard-list' }"
                            @click="switchSubPage('standard-list')">
                            <el-icon size="18">
                                <Compass />
                            </el-icon>
                            <span style="margin-left: 5px;">指标管理</span>
                        </div>
                        <div class="menu-item" :class="{ active: $route.path === '/main/my-dataset' }"
                            @click="switchSubPage('my-dataset')">
                            <el-icon size="18">
                                <MessageBox />
                            </el-icon>
                            <span style="margin-left: 5px;">数据集管理</span>
                        </div>
                        <div class="menu-item" :class="{ active: $route.path === '/main/optimize-history' }"
                            @click="switchSubPage('optimize-history')">
                            <el-icon size="18">
                                <View />
                            </el-icon>
                            <span style="margin-left: 5px;">Prompt模板</span>
                        </div>
                    </div>

                    <div v-if="activeTab === 'prompt'" class="nav-menu">
                        <div class="menu-item" :class="{ active: $route.path === '/main/prompt-optimize' }"
                            @click="switchSubPage('prompt-optimize')">
                            <el-icon size="18">
                                <Operation />
                            </el-icon>
                            <span style="margin-left: 5px;">Prompt优化</span>
                        </div>
                        <!-- <div class="menu-item" :class="{ active: $route.path === '/home/prompt-create' }"
                            @click="switchSubPage('prompt-create')">
                            <span style="margin-left: 5px;">模板创建</span>
                        </div> -->
                        <!-- <div class="menu-item" :class="{ active: $route.path === '/home/optimize-history' }"
                            @click="switchSubPage('optimize-history')">
                            <el-icon size="18">
                                <View />
                            </el-icon>
                            <span style="margin-left: 5px;">Prompt模板</span>
                        </div> -->
                        <!-- <div class="menu-item" :class="{ active: $route.path === '/home/res-viewable' }"
                            @click="switchSubPage('res-viewable')">
                            <el-icon size="18">
                                <View />
                            </el-icon>
                            <span style="margin-left: 5px;">指标可视化</span>
                        </div> -->
                    </div>

                    <div v-if="activeTab === 'evaluation'" class="nav-menu">
                        <div class="menu-item" :class="{ active: $route.path === '/main/my-model' }"
                            @click="switchSubPage('my-model')">
                            <el-icon size="18">
                                <SetUp />
                            </el-icon>
                            <span style="margin-left: 5px;">我的模型</span>
                        </div>
                        <div class="menu-item" :class="{ active: $route.path === '/main/my-model/create' }"
                            @click="switchSubPage('my-model/create')">
                            <el-icon size="18">
                                <Compass />
                            </el-icon>
                            <span style="margin-left: 5px;">模型接入</span>
                        </div>
                    </div>

                    <div v-if="activeTab === 'project'" class="nav-menu">
                        <div class="menu-item" :class="{ active: $route.path === '/main/prompt-project-list' }"
                            @click="switchSubPage('prompt-project-list')">
                            <el-icon size="18">
                                <Files />
                            </el-icon>
                            <span style="margin-left: 5px;">prompt调优</span>
                        </div>
                        <div class="menu-item" :class="{ active: $route.path === '/main/model-project-list' }"
                            @click="switchSubPage('model-project-list')">
                            <el-icon size="18">
                                <CirclePlus />
                            </el-icon>
                            <span style="margin-left: 5px;">模型评测</span>
                        </div>
                        <div class="menu-item" :class="{ active: $route.path === '/main/selection-result' }"
                            @click="switchSubPage('selection-result')">
                            <el-icon size="18">
                                <Monitor />
                            </el-icon>
                            <span style="margin-left: 5px;">智能选型</span>
                        </div>

                    </div>

                    <div v-if="activeTab === 'team'" class="nav-menu">
                        <div class="menu-item" :class="{ active: $route.path === '/main/team-resource' }"
                            @click="switchSubPage('team-resource')">
                            <el-icon size="18">
                                <Files />
                            </el-icon>
                            <span style="margin-left: 5px;">团队资源</span>
                        </div>
                        <div class="menu-item" :class="{ active: $route.path === '/main/team-member' }"
                            @click="switchSubPage('team-member')">
                            <el-icon size="18">
                                <User />
                            </el-icon>
                            <span style="margin-left: 5px;">成员/权限</span>
                        </div>
                        <div class="menu-item" :class="{ active: $route.path === '/main/team-setting' }"
                            @click="switchSubPage('team-setting')">
                            <el-icon size="18">
                                <PieChart />
                            </el-icon>
                            <span style="margin-left: 5px;">团队设置</span>
                        </div>
                    </div>

                    <div v-if="activeTab === 'process' && isAuditor" class="nav-menu">
                        <div class="menu-item" :class="{ active: $route.path === '/main/datasetprocess' }"
                            @click="switchSubPage('datasetprocess')">
                            <el-icon size="18">
                                <Files />
                            </el-icon>
                            <span style="margin-left: 5px;">数据集审核</span>
                        </div>
                        <div class="menu-item" :class="{ active: $route.path === '/main/standardprocess' }"
                            @click="switchSubPage('standardprocess')">
                            <el-icon size="18">
                                <Files />
                            </el-icon>
                            <span style="margin-left: 5px;">指标审核</span>
                        </div>
                    </div>


                </div>
            </div>


            <div class="main_content">
                <!-- <component :is="activePage" v-if="activePage"></component> -->
                <router-view></router-view>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isAuditor = computed(() => userRole.value === 'auditor')


onMounted(() => {
    // 刷新后从本地恢复
    userStore.hydrate()
})

// 从 Pinia 获取用户名与头像
const username = computed(() => userStore.username)
const userAvatar = computed(() => userStore.avatar || '')
const usernameFirst = computed(() => (username.value?.[0] || 'U').toUpperCase())
const userRole = computed(() => userStore.role)

// 新增：读取用户名与头像（优先 Vuex，退化到 localStorage）
// const storedUser = computed(() => {
//   try {
//     return store?.state?.user || JSON.parse(localStorage.getItem('user') || 'null') || {}
//   } catch { return {} }
// })

// 新增：用户菜单命令
const onUserCommand = async (cmd) => {
    if (cmd === 'logout') {
        try {
            await ElMessageBox.confirm('确认要退出登录吗？', '提示', { type: 'warning' })
            try { store.commit('setToken', ''); store.commit('setUser', null) } catch { }
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('username')
            localStorage.removeItem('avatar')
            ElMessage.success('已退出登录')
            router.push('/login')
        } catch {
            /* 用户取消 */
        }
    }
}

// 状态管理
const activeTab = ref('dashboard') // 当前主标签页

// 计算属性
// const sidebarTitle = computed(() => {
//     const titles = {
//         dashboard: '🌏自定义集',
//         prompt: '♾️Prompt调优',
//         evaluation: '📊模型评测',
//         project: '📁项目管理'
//     }
//     return titles[activeTab.value] || ''
// })

// 路由与标签页的映射关系
const routeToTabMap = {
    'management': 'main',
    'statistics': 'dashboard',
    'notice': 'dashboard',
    'my-dataset': 'dashboard',
    'config-setting': 'prompt',
    'prompt-setting': 'prompt',
    'optimize-history': 'dashboard',
    'res-viewable': 'prompt',
    'examine-model': 'evaluation',
    'my-model': 'evaluation',
    'eval-report': 'evaluation',
    'model-project-list': 'project',
    'create-project': 'project',
    'project-setting': 'project',
    'team-resource': 'team',
    'team-member': 'team',
    'team-setting': 'team',
    'datasetprocess': 'process',
    'standardprocess': 'process',
    'prompt-optimize': 'project',
    'eval/custom': 'project',
    'standard-create': 'dashboard',
    'standard-list': 'dashboard',
    'intelligence-select': 'project',
    'prompt-project-list': 'project',
    'selection-result': 'project',
    'eval/detail': 'project',
}

// 监听路由变化，更新激活的标签页，并对非 auditor 访问审核页进行拦截
watch(() => route.path, (newPath) => {
    const pathParts = newPath.split('/')
    const subRoute = pathParts[pathParts.length - 1]

    if (routeToTabMap[subRoute]) {
        activeTab.value = routeToTabMap[subRoute]
    }

    // 非 auditor 访问审核路由时重定向
    if ((subRoute === 'datasetprocess' || subRoute === 'standardprocess') && !isAuditor.value) {
        ElMessage.warning('仅审核员可访问审核页面')
        router.replace('/main/standard-list')
    }
}, { immediate: true })

const switchTab = (tab) => {
    // 非 auditor 禁止切换到审核页
    if (tab === 'process' && !isAuditor.value) {
        ElMessage.warning('仅审核员可访问审核页面')
        return
    }
    activeTab.value = tab
    const defaultSubPages = {
        main: 'management',
        dashboard: 'standard-list',
        evaluation: 'my-model',
        project: 'prompt-project-list',
        process: 'datasetprocess',
        team: 'team-resource',
    }
    router.push(`/main/${defaultSubPages[tab]}`)
}

// // 方法
// const switchTab = (tab) => {
//     activeTab.value = tab
//     // 切换主标签时，跳转到默认子页面
//     const defaultSubPages = {
//         main: 'management',
//         dashboard: 'standard-list',
//         evaluation: 'my-model',
//         project: 'prompt-project-list',
//         process: 'datasetprocess',
//         team: 'team-resource',
//     }
//     router.push(`/main/${defaultSubPages[tab]}`)
// }

const switchSubPage = (subPage) => {
    // 非 auditor 禁止进入审核子页
    if ((subPage === 'datasetprocess' || subPage === 'standardprocess') && !isAuditor.value) {
        ElMessage.warning('仅审核员可访问审核页面')
        return
    }
    router.push(`/main/${subPage}`)
}

// // 初始化默认路由
// if (route.path === '/main') {
//     router.push('/main/standard-list')
// }
</script>

<style scoped>
:root {
    --primary: #4361ee;
    --primary-light: #4895ef;
    --secondary: #3f37c9;
    --accent: #f72585;
    --success: #4cc9f0;
    --warning: #f9c74f;
    --danger: #f94144;
    --light: #f8f9fa;
    --dark: #212529;
    --gray-100: #f8f9fa;
    --gray-200: #e9ecef;
    --gray-300: #dee2e6;
    --gray-400: #ced4da;
    --gray-500: #adb5bd;
    --gray-600: #6c757d;
    --gray-700: #495057;
    --gray-800: #343a40;
    --gray-900: #212529;
    --sidebar-width: 260px;
    --header-height: 70px;
    --top-nav-height: 60px;
    --border-radius: 12px;
    --card-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.container {
    position: absolute;
    left: 0%;
    top: 0%;
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
}

.top_nav {
    color: rgb(255, 255, 255);
    height: 60px;
    background-color: rgb(67, 95, 238);
    display: flex;
    /* align-items: center; */
    padding: 10px 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main_wrapper {
    flex: 1;
    display: flex;
    overflow: hidden;
}


.logo {
    /* background: rgba(255, 255, 255, 0.2); */
    width: 50px;
    height: 38px;
    /* border-radius: 10px; */
    /* display: flex; */
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    color: white;
    margin-left: 30PX;
}

.main-nav {
    display: flex;
    height: 100%;
    margin-left: 40px;
}

.nav-item {
    display: flex;
    font-size: 18px;
    align-items: center;
    padding: 0 30px;
    height: 100%;
    cursor: pointer;
    position: relative;
    color: rgba(255, 255, 255, 0.85);
    font-weight: 500;
    transition: var(--transition);
    margin: 0 10px;
}

.nav-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    /* scale: 0.8; */
}

.nav-item.active {
    color: white;
    background: rgba(255, 255, 255, 0.1);
}


.nav-item i {
    margin-right: 10px;
    font-size: 1.1rem;
}

.aside_nav {
    color: #333;
    background-color: rgb(250, 250, 252);
    width: 250px;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
}

.aside-nav-header {
    padding: 20px;
    border-bottom: 1px solid #e9ecef;
    background-color: rgb(250, 250, 252);
}

.aside-nav-header h3 {
    margin: 0;
    color: #495057;
    font-size: 16px;
    font-weight: 600;
}

.aside-nav-content {
    flex: 1;
    padding: 10px 0;

}

.nav-menu {
    perspective: 1000px;
}

.menu-item {
    display: flex;
    align-items: center;
    padding: 14px 18px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: #6c757d;
    margin-bottom: 6px;
    font-weight: 800;
    margin-left: 10px;
    margin-right: 10px;
}


.menu-item:hover,
.menu-item.active {
    background: rgba(67, 97, 238, 0.08);
    color: #4361ee;
    transform: translateX(5px);
}

.menu-item:active {
    transform: scale(0.95);
}

.main_content {
    flex: 1;
    background: linear-gradient(135deg, #f5f7fa 0%, #e8f3ff 100%);
    overflow-y: auto;
}

/* 新增：右上角用户区样式 */
.user-area {
    margin-left: auto;
    display: flex;
    align-items: center;
}

.user-trigger {
    display: inline-flex;
    align-items: center;
    color: #fff;
    cursor: pointer;
    user-select: none;
}

.user-trigger .avatar {
    background: #2d6cdf;
    font-weight: 700;
}

.user-trigger .username {
    margin: 0 6px 0 8px;
    font-weight: 600;
}

.user-trigger .caret {
    opacity: 0.9;
}

.user-brief {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 160px;
}

.user-brief .name {
    font-weight: 700;
}

.user-brief .role {
    font-size: 12px;
    color: #8a8f98;
}
</style>