<template>
    <div class="page-container">
        <div class="header">
            <span> </span>
        </div>

        <div class="content">
            <div class="breadcrumb">
                <span class="breadcrumb-item" :class="{ completed: currentStep1 }">选择模型</span>
                <el-icon>
                    <ArrowRight />
                </el-icon>
                <span class="breadcrumb-item" :class="{ completed: currentStep2 }">选择评测集</span>
            </div>

            <div class="form-section" v-if="currentStep1">
                <h3>模型类型</h3>
                <div class="radio-group">
                    <el-radio-group v-model="modeltype">
                        <el-radio value="talk" size="large">对话模型</el-radio>
                        <el-radio value="basic" size="large">基座模型</el-radio>
                    </el-radio-group>
                </div>
            </div>

            <div class="form-section" v-if="currentStep1">
                <h3>选择模型</h3>
                <div class="tree-select">
                    <el-tree-select v-model="value" :data="data" :render-after-expand="false"
                        style="width: 100%; max-width: 400px;" />
                </div>
            </div>

            <div class="form-section" v-if="currentStep2">
                <h3>评测集</h3>
                <div class="tree-select">
                    <el-tree-select v-model="value" :data="data" :render-after-expand="false" multiple multiple-limit="3"	
                        style="width: 100%; max-width: 400px;" />
                </div>
            </div>
        </div>

        <div class="footer">
            <el-button type="primary" size="large" class="btn-primary" @click="goNext" v-if="currentStep1">下一步</el-button>
            <el-button type="primary" size="large" class="btn-primary" @click="goBack" v-if="currentStep2">上一步</el-button>
            <el-button type="primary" size="large" class="btn-primary" @click="goEval" v-if="currentStep2">开始测评</el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const modeltype = ref('talk')
const value = ref()
const currentStep1 = ref(true)
const currentStep2 = ref(false)

const data = [
    {
        value: '1',
        label: 'Level one 1',
        children: [
            {
                value: '1-1',
                label: 'Level two 1-1',
                children: [
                    {
                        value: '1-1-1',
                        label: 'Level three 1-1-1',
                    },
                ],
            },
        ],
    },
    {
        value: '2',
        label: 'Level one 2',
        children: [
            {
                value: '2-1',
                label: 'Level two 2-1',
                children: [
                    {
                        value: '2-1-1',
                        label: 'Level three 2-1-1',
                    },
                ],
            },
            {
                value: '2-2',
                label: 'Level two 2-2',
                children: [
                    {
                        value: '2-2-1',
                        label: 'Level three 2-2-1',
                    },
                ],
            },
        ],
    },
    {
        value: '3',
        label: 'Level one 3',
        children: [
            {
                value: '3-1',
                label: 'Level two 3-1',
                children: [
                    {
                        value: '3-1-1',
                        label: 'Level three 3-1-1',
                    },
                ],
            },
            {
                value: '3-2',
                label: 'Level two 3-2',
                children: [
                    {
                        value: '3-2-1',
                        label: 'Level three 3-2-1',
                    },
                ],
            },
        ],
    },
]

const goNext = () => {
    currentStep1.value = false
    currentStep2.value = true
}
const goBack=()=>{
    currentStep1.value = true
    currentStep2.value = false
}
const goEval=()=>{
    // 跳转到评测页面
    router.push('/main/examine-model')
    ElMessage.success('评测开始！')
}
</script>

<style scoped>
.page-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
}

.content {
    margin-bottom: 40px;
}

.breadcrumb {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 40px;
    font-size: 16px;
}

.breadcrumb-item {
    color: #8b949e;
    transition: color 0.2s ease;
    font-weight: 500;
}

.breadcrumb-item.completed {
    color: #1a87e0;
    font-weight: 600;
}

.form-section {
    margin-bottom: 32px;
}

.form-section h3 {
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
    margin: 0px 0px 16px 160px;
}

.radio-group {
    padding-left: 160px;
}

.tree-select {
    padding-left: 160px;
}

.footer {
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
}

.btn-primary {
    padding: 12px 32px;
    border-radius: 8px;
    font-weight: 500;
}
</style>