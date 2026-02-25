<template>
    <div class="page-container">
        <!-- 页面头部 -->
        <div class="content-header">
            <div class="header-left">
                <h1 class="page-title">📚 帮助中心</h1>
                <p class="page-subtitle">获取使用夢ノ結唱平台的帮助和支持</p>
            </div>
            <div class="btn-group">
                <el-button size="large" class="btn-outline" @click="goBack">
                    <el-icon style="margin-right: 5px;">
                        <ArrowLeft />
                    </el-icon>
                    返回首页
                </el-button>
                <el-button type="primary" size="large" class="btn-primary">
                    <el-icon style="margin-right: 5px;">
                        <ChatDotRound />
                    </el-icon>
                    联系客服
                </el-button>
            </div>
        </div>

        <!-- 快速搜索 -->
        <div class="search-section">
            <div class="search-container">
                <h3>快速搜索帮助内容</h3>
                <div class="search-box">
                    <el-input v-model="searchQuery" placeholder="搜索帮助内容、常见问题..." size="large" clearable>
                        <template #prefix>
                            <el-icon>
                                <Search />
                            </el-icon>
                        </template>
                        <template #suffix>
                            <el-button type="primary" :icon="Search" text>搜索</el-button>
                        </template>
                    </el-input>
                </div>
                <div class="search-tags">
                    <span class="tag-label">热门搜索：</span>
                    <el-tag v-for="tag in hotSearchTags" :key="tag" class="search-tag" @click="searchQuery = tag">
                        {{ tag }}
                    </el-tag>
                </div>
            </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="main-content">
            <!-- 左侧：帮助分类 -->
            <div class="left-panel">
                <div class="help-categories">
                    <h3 class="section-title">功能模块</h3>
                    <div class="categories-grid">
                        <div v-for="category in categories" :key="category.id" class="category-card"
                            @click="selectCategory(category)" :class="{ active: selectedCategory?.id === category.id }">
                            <div class="category-icon" :class="category.iconClass">
                                <el-icon>
                                    <component :is="category.icon" />
                                </el-icon>
                            </div>
                            <div class="category-content">
                                <h4 class="category-title">{{ category.title }}</h4>
                                <p class="category-desc">{{ category.description }}</p>
                                <div class="category-stats">
                                    <el-icon>
                                        <Document />
                                    </el-icon>
                                    <span>{{ category.articleCount }} 篇文章</span>
                                </div>
                            </div>
                            <div class="category-arrow">
                                <el-icon>
                                    <ArrowRight />
                                </el-icon>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 快捷操作 -->
                <div class="quick-actions">
                    <h3 class="section-title">快捷操作</h3>
                    <div class="action-buttons">
                        <el-button type="primary" plain class="action-btn">
                            <el-icon>
                                <VideoPlay />
                            </el-icon>
                            观看教程视频
                        </el-button>
                        <el-button type="success" plain class="action-btn">
                            <el-icon>
                                <Download />
                            </el-icon>
                            下载用户手册
                        </el-button>
                        <el-button type="warning" plain class="action-btn">
                            <el-icon>
                                <Calendar />
                            </el-icon>
                            预约培训
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 右侧：内容详情 -->
            <div class="right-panel">
                <!-- 常见问题 -->
                <div class="faq-container">
                    <div class="faq-header">
                        <h3>
                            <el-icon>
                                <QuestionFilled />
                            </el-icon>
                            常见问题
                        </h3>
                        <div class="faq-controls">
                            <el-input v-model="faqSearch" placeholder="搜索问题..." style="width: 200px;" clearable>
                                <template #prefix>
                                    <el-icon>
                                        <Search />
                                    </el-icon>
                                </template>
                            </el-input>
                            <el-button class="btn-outline">查看全部</el-button>
                        </div>
                    </div>

                    <div class="faq-list">
                        <div v-for="(faq, index) in filteredFaqs" :key="index" class="faq-item"
                            :class="{ active: faq.active }">
                            <div class="faq-question" @click="toggleFaq(index)">
                                <div class="question-content">
                                    <div class="question-number">{{ String(index + 1).padStart(2, '0') }}</div>
                                    <span>{{ faq.question }}</span>
                                </div>
                                <div class="question-meta">
                                    <el-tag size="small" type="info">{{ faq.category }}</el-tag>
                                    <el-icon class="faq-chevron" :class="{ rotated: faq.active }">
                                        <ArrowDown />
                                    </el-icon>
                                </div>
                            </div>
                            <div class="faq-answer" v-show="faq.active">
                                <p>{{ faq.answer }}</p>
                                <div class="faq-actions">
                                    <div class="action-left">
                                        <el-button type="success" link size="small" @click="markHelpful(index)">
                                            <el-icon>
                                                <Check />
                                            </el-icon>
                                            有帮助 ({{ faq.helpful || 0 }})
                                        </el-button>
                                        <el-button type="info" link size="small" @click="markNotHelpful(index)">
                                            <el-icon>
                                                <Close />
                                            </el-icon>
                                            没帮助
                                        </el-button>
                                    </div>
                                    <div class="action-right">
                                        <span class="last-updated">最后更新：{{ faq.lastUpdated }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 联系支持 -->
                <div class="contact-section">
                    <div class="contact-header">
                        <h3>
                            <el-icon>
                                <Headset />
                            </el-icon>
                            联系支持
                        </h3>
                        <p>多种方式获取专业技术支持，我们的专家团队随时为您服务</p>
                    </div>

                    <div class="contact-grid">
                        <div v-for="contact in contactMethods" :key="contact.id" class="contact-card"
                            @click="selectContact(contact)">
                            <div class="contact-icon" :class="contact.iconClass">
                                <el-icon>
                                    <component :is="contact.icon" />
                                </el-icon>
                            </div>
                            <div class="contact-content">
                                <h4 class="contact-title">{{ contact.title }}</h4>
                                <p class="contact-desc">{{ contact.description }}</p>
                                <div class="contact-meta">
                                    <div class="response-time">
                                        <el-icon>
                                            <Clock />
                                        </el-icon>
                                        <span>{{ contact.responseTime }}</span>
                                    </div>
                                    <div class="availability" :class="contact.status">
                                        <span class="status-dot"></span>
                                        <span>{{ contact.statusText }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="contact-action">
                                <el-button type="primary" link>
                                    {{ contact.linkText }}
                                    <el-icon>
                                        <ArrowRight />
                                    </el-icon>
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 页脚信息 -->
        <div class="footer-info">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>产品</h4>
                    <div class="footer-links">
                        <a href="#" class="footer-link">功能特性</a>
                        <a href="#" class="footer-link">定价方案</a>
                        <a href="#" class="footer-link">API文档</a>
                        <a href="#" class="footer-link">更新日志</a>
                    </div>
                </div>
                <div class="footer-section">
                    <h4>支持</h4>
                    <div class="footer-links">
                        <a href="#" class="footer-link">帮助中心</a>
                        <a href="#" class="footer-link">社区论坛</a>
                        <a href="#" class="footer-link">状态页面</a>
                        <a href="#" class="footer-link">联系我们</a>
                    </div>
                </div>
                <div class="footer-section">
                    <h4>公司</h4>
                    <div class="footer-links">
                        <a href="#" class="footer-link">关于我们</a>
                        <a href="#" class="footer-link">隐私政策</a>
                        <a href="#" class="footer-link">使用条款</a>
                        <a href="#" class="footer-link">安全</a>
                    </div>
                </div>
                <div class="footer-section">
                    <h4>资源</h4>
                    <div class="footer-links">
                        <a href="#" class="footer-link">博客</a>
                        <a href="#" class="footer-link">白皮书</a>
                        <a href="#" class="footer-link">案例研究</a>
                        <a href="#" class="footer-link">学习资源</a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p class="footer-text">OpenCompass 大模型评测平台 © 2025. 保留所有权利。</p>
                <div class="footer-social">
                    <el-icon>
                        <Platform />
                    </el-icon>
                    <el-icon>
                        <Share />
                    </el-icon>
                    <el-icon>
                        <Message />
                    </el-icon>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
    ArrowLeft,
    ChatDotRound,
    Search,
    QuestionFilled,
    ArrowDown,
    Check,
    Close,
    Headset,
    ArrowRight,
    Document,
    MagicStick,
    TrendCharts,
    Operation,
    Message,
    Files,
    Calendar,
    VideoPlay,
    Download,
    Clock,
    Platform,
    Share
} from '@element-plus/icons-vue'

const router = useRouter()
const searchQuery = ref('')
const faqSearch = ref('')
const selectedCategory = ref(null)

const hotSearchTags = ref(['模型评测', 'Prompt调优', '项目管理', 'API使用', '数据导入'])

const categories = ref([
    {
        id: 1,
        icon: 'Document',
        iconClass: 'icon-blue',
        title: '使用指南',
        description: '了解如何开始使用OpenCompass平台，创建评测任务和管理项目',
        articleCount: 15
    },
    {
        id: 2,
        icon: 'MagicStick',
        iconClass: 'icon-purple',
        title: 'Prompt调优',
        description: '学习如何优化模型提示词，提升模型输出质量和评测效果',
        articleCount: 12
    },
    {
        id: 3,
        icon: 'TrendCharts',
        iconClass: 'icon-green',
        title: '模型评测',
        description: '掌握模型评测的最佳实践，了解各项指标的含义和评测方法',
        articleCount: 20
    },
    {
        id: 4,
        icon: 'Operation',
        iconClass: 'icon-orange',
        title: '项目管理',
        description: '了解如何高效管理评测项目，协作团队成员和分享评测结果',
        articleCount: 8
    }
])

const faqs = ref([
    {
        question: '如何创建我的第一个评测任务？',
        answer: '创建评测任务非常简单：登录OpenCompass后，点击"新建评测"按钮，选择评测类型和模型，配置评测参数，然后提交任务。系统会自动分配资源并开始评测。您可以在"我的评测"页面查看任务进度和结果。',
        category: '基础使用',
        active: false,
        helpful: 24,
        lastUpdated: '2025-08-20'
    },
    {
        question: '评测任务通常需要多长时间完成？',
        answer: '评测任务的完成时间取决于模型大小、评测数据集规模、评测指标复杂度以及系统当前负载。小型评测通常需要几分钟到几小时，大型综合评测可能需要数天时间。您可以在任务详情页查看预计完成时间。',
        category: '评测流程',
        active: false,
        helpful: 18,
        lastUpdated: '2025-08-18'
    },
    {
        question: '如何理解评测报告中的各项指标？',
        answer: 'OpenCompass提供多种评测指标，包括准确度、流畅度、相关性、一致性和安全性等。每个指标都有详细说明和计算方式。您可以在报告页面查看指标详情，或参考我们的指标解释文档。',
        category: '结果分析',
        active: false,
        helpful: 32,
        lastUpdated: '2025-08-25'
    },
    {
        question: '如何与其他团队成员协作？',
        answer: 'OpenCompass支持团队协作功能。您可以在项目设置中添加团队成员，分配不同角色和权限。团队成员可以共同查看评测结果、添加注释和分享见解。还支持实时协作编辑和评论功能。',
        category: '团队协作',
        active: false,
        helpful: 15,
        lastUpdated: '2025-08-22'
    },
    {
        question: '系统支持哪些模型格式？',
        answer: 'OpenCompass支持多种主流模型格式，包括Hugging Face Transformers、PyTorch、TensorFlow、ONNX、OpenAI API等。如需特殊格式支持，请联系技术支持团队获取定制化解决方案。',
        category: '技术支持',
        active: false,
        helpful: 21,
        lastUpdated: '2025-08-19'
    },
    {
        question: '如何批量导入评测数据？',
        answer: '您可以通过多种方式批量导入数据：1) 使用Excel/CSV文件上传；2) 通过API接口批量导入；3) 连接数据库直接同步。系统支持数据格式验证和错误提示，确保导入质量。',
        category: '数据管理',
        active: false,
        helpful: 27,
        lastUpdated: '2025-08-21'
    }
])

const contactMethods = ref([
    {
        id: 1,
        icon: 'Message',
        iconClass: 'icon-blue',
        title: '电子邮件支持',
        description: '发送详细问题描述，我们的技术专家会提供详细的解决方案',
        responseTime: '24小时内回复',
        linkText: '发送邮件',
        status: 'online',
        statusText: '服务中'
    },
    {
        id: 2,
        icon: 'ChatDotRound',
        iconClass: 'icon-green',
        title: '在线客服',
        description: '实时在线咨询，专业客服团队为您快速解决问题',
        responseTime: '工作时间即时回复',
        linkText: '开始对话',
        status: 'online',
        statusText: '在线'
    },
    {
        id: 3,
        icon: 'Files',
        iconClass: 'icon-purple',
        title: '文档中心',
        description: '详细的使用文档、API参考和开发者指南',
        responseTime: '7x24小时可用',
        linkText: '查看文档',
        status: 'available',
        statusText: '可用'
    },
    {
        id: 4,
        icon: 'Calendar',
        iconClass: 'icon-orange',
        title: '预约演示',
        description: '一对一专家演示和技术指导，深度了解平台功能',
        responseTime: '1-3个工作日安排',
        linkText: '预约时间',
        status: 'scheduling',
        statusText: '可预约'
    }
])

const filteredFaqs = computed(() => {
    if (!faqSearch.value) return faqs.value
    return faqs.value.filter(faq =>
        faq.question.toLowerCase().includes(faqSearch.value.toLowerCase()) ||
        faq.answer.toLowerCase().includes(faqSearch.value.toLowerCase())
    )
})

const toggleFaq = (index) => {
    faqs.value[index].active = !faqs.value[index].active
}

const selectCategory = (category) => {
    selectedCategory.value = category
    console.log('选择分类:', category.title)
}

const selectContact = (contact) => {
    console.log('选择联系方式:', contact.title)
}

const markHelpful = (index) => {
    faqs.value[index].helpful = (faqs.value[index].helpful || 0) + 1
}

const markNotHelpful = (index) => {
    console.log('标记为无帮助:', index)
}

const goBack = () => {
    router.push('/home')
}
</script>

<style scoped>
.page-container {
    position: absolute;
    left: 0;
    top: 0;
    padding: 30px;
    background-color: #f8f9fa;
    min-height: calc(100vh - 60px);
    width: 100% ;
    margin: 0 auto;
}

.content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding: 0 10px;
}

.header-left {
    flex: 1;
}

.page-title {
    font-size: 32px;
    font-weight: 700;
    color: #2c3e50;
    margin: 0 0 8px 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.page-subtitle {
    color: #6c757d;
    margin: 0;
    font-size: 16px;
}

.btn-group {
    display: flex;
    gap: 12px;
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

.search-section {
    background: white;
    border-radius: 16px;
    padding: 40px;
    margin-bottom: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
}

.search-container h3 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 20px;
    font-weight: 600;
}

.search-box {
    max-width: 600px;
    margin-bottom: 16px;
}

.search-tags {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.tag-label {
    color: #6c757d;
    font-size: 14px;
    font-weight: 500;
}

.search-tag {
    cursor: pointer;
    transition: all 0.2s ease;
}

.search-tag:hover {
    background-color: #4361ee;
    color: white;
}

.main-content {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 30px;
    align-items: start;
}

.left-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.right-panel {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.section-title {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
}

.help-categories {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
}

.categories-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.category-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    background: #fafbfc;
}

.category-card:hover {
    background: white;
    border-color: #4361ee;
    transform: translateX(4px);
    box-shadow: 0 8px 25px rgba(67, 97, 238, 0.1);
}

.category-card.active {
    background: white;
    border-color: #4361ee;
    box-shadow: 0 8px 25px rgba(67, 97, 238, 0.15);
}

.category-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;
    flex-shrink: 0;
}

.icon-blue {
    background: linear-gradient(135deg, #4361ee, #4895ef);
}

.icon-purple {
    background: linear-gradient(135deg, #8b5cf6, #a78bfa);
}

.icon-green {
    background: linear-gradient(135deg, #10b981, #34d399);
}

.icon-orange {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.category-content {
    flex: 1;
}

.category-title {
    margin: 0 0 6px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
}

.category-desc {
    margin: 0 0 8px 0;
    color: #6c757d;
    font-size: 13px;
    line-height: 1.4;
}

.category-stats {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #8b5cf6;
    font-size: 12px;
    font-weight: 500;
}

.category-arrow {
    color: #8b949e;
    transition: all 0.2s ease;
}

.category-card:hover .category-arrow {
    color: #4361ee;
    transform: translateX(2px);
}

.quick-actions {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
}

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.action-btn {
    justify-content: flex-start;
    height: 44px;
    border-radius: 10px;
}

.faq-container {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
}

.faq-header {
    padding: 24px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fafafa;
}

.faq-header h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
}

.faq-controls {
    display: flex;
    gap: 12px;
    align-items: center;
}

.faq-list {
    padding: 0;
}

.faq-item {
    border-bottom: 1px solid #f0f0f0;
}

.faq-item:last-child {
    border-bottom: none;
}

.faq-question {
    padding: 24px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s ease;
}

.faq-question:hover {
    background-color: #f8f9fa;
}

.question-content {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
}

.question-number {
    background: #4361ee;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
}

.question-content span {
    color: #2c3e50;
    font-weight: 500;
    font-size: 15px;
}

.question-meta {
    display: flex;
    align-items: center;
    gap: 12px;
}

.faq-chevron {
    color: #8b949e;
    transition: transform 0.2s ease;
}

.faq-chevron.rotated {
    transform: rotate(180deg);
}

.faq-answer {
    padding: 0 24px 24px 72px;
    color: #6c757d;
    line-height: 1.6;
    border-top: 1px solid #f0f0f0;
    background-color: #fafbfc;
}

.faq-answer p {
    margin: 16px 0;
}

.faq-actions {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #e9ecef;
}

.action-left {
    display: flex;
    gap: 16px;
}

.last-updated {
    color: #8b949e;
    font-size: 12px;
}

.contact-section {
    background: white;
    border-radius: 16px;
    padding: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
}

.contact-header {
    margin-bottom: 24px;
}

.contact-header h3 {
    margin: 0 0 8px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
}

.contact-header p {
    margin: 0;
    color: #6c757d;
    font-size: 14px;
}

.contact-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}

.contact-card {
    border: 1px solid #f0f0f0;
    border-radius: 12px;
    padding: 24px;
    transition: all 0.3s ease;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    cursor: pointer;
}

.contact-card:hover {
    border-color: #4361ee;
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(67, 97, 238, 0.1);
}

.contact-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;
    flex-shrink: 0;
}

.contact-content {
    flex: 1;
}

.contact-title {
    margin: 0 0 8px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
}

.contact-desc {
    margin: 0 0 12px 0;
    color: #6c757d;
    font-size: 14px;
    line-height: 1.4;
}

.contact-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.response-time {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #8b949e;
    font-size: 12px;
}

.availability {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.availability.online .status-dot {
    background: #10b981;
}

.availability.available .status-dot {
    background: #3b82f6;
}

.availability.scheduling .status-dot {
    background: #f59e0b;
}

.contact-action {
    align-self: flex-start;
}

.footer-info {
    background: white;
    border-radius: 16px;
    padding: 40px;
    margin-top: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 40px;
    margin-bottom: 32px;
}

.footer-section h4 {
    margin: 0 0 16px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
}

.footer-links {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.footer-link {
    color: #6c757d;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s ease;
}

.footer-link:hover {
    color: #4361ee;
}

.footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 24px;
    border-top: 1px solid #f0f0f0;
}

.footer-text {
    margin: 0;
    color: #8b949e;
    font-size: 14px;
}

.footer-social {
    display: flex;
    gap: 12px;
    color: #8b949e;
}

.footer-social .el-icon {
    cursor: pointer;
    transition: color 0.2s ease;
}

.footer-social .el-icon:hover {
    color: #4361ee;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .main-content {
        grid-template-columns: 320px 1fr;
        gap: 24px;
    }

    .contact-grid {
        grid-template-columns: 1fr;
    }

    .footer-content {
        grid-template-columns: repeat(2, 1fr);
        gap: 32px;
    }
}

@media (max-width: 768px) {
    .main-content {
        grid-template-columns: 1fr;
    }

    .left-panel {
        order: 2;
    }

    .right-panel {
        order: 1;
    }
}
</style>