import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/main/management" },
    {
      path: "/main",
      meta: { title: "首页" },
      component: () => import("../views/Home.vue"),
      children: [
        {
          path: "management",
          meta: { title: "首页" },
          component: () => import("../components/others/mainPage.vue"),
        },
        {
          path: "datasetprocess",
          meta: { title: "审核进度" },
          component: () => import("../components/others/dataSetProcessPage.vue"),
        },
        {
          path:"standardprocess",
          meta: { title: "标准审核" },
          component: () => import("../components/others/standardProcessPage.vue"),
        },
        // 首页子路由
        {
          path: "statistics",
          meta: { title: "数据统计" },
          component: () => import("../components/mainPage/statistics.vue"),
        },
        {
          path: "notice",
          meta: { title: "通知公告" },
          component: () => import("../components/mainPage/notice.vue"),
        },
        {
          path: "about",
          meta: { title: "关于系统" },
          component: () => import("../components/mainPage/about.vue"),
        },
        // Prompt调优子路由
        {
          path: "prompt-optimize",
          meta: { title: "prompt优化" },
          component: () =>
            import("../components/promptPage/promptOptimize.vue"),
        },
        {
          path: "prompt-create",
          meta: { title: "Prompt创建" },
          component: () => import("../components/promptPage/promptCreate.vue"),
        },
        {
          path: "optimize-history",
          meta: { title: "prompt模板" },
          component: () =>
            import("../components/promptPage/optimizeHistory.vue"),
        },
        {
          path: "res-viewable",
          meta: { title: "结果查看" },
          component: () => import("../components/promptPage/resViewable.vue"),
        },
        // 模型评测子路由
        {
          path: "examine-model",
          meta: { title: "模型检测" },
          component: () =>
            import("../components/modelEvalPage/examineModel.vue"),
        },
        {
          path: "my-model",
          meta: { title: "我的模型" },
          component: () => import("../components/modelEvalPage/myModel.vue"),
        },
        {
          path: "my-dataset",
          meta: { title: "我的数据集" },
          component: () => import("../components/modelEvalPage/myDataSet.vue"),
        },
        // {
        //   path: "eval-report",
        //   meta: { title: "评测报告" },
        //   component: () => import("../components/modelEvalPage/evalReport.vue"),
        // },
        {
          path: "standard-list",
          meta: { title: "评测标准" },
          component: () =>
            import("../components/controlPage/standardList.vue"),
        },
        {
          path: "standard-create",
          meta: { title: "创建评测标准" },
          component: () =>
            import("../components/controlPage/standardCreate.vue"),
        },
        // 项目管理子路由
        {
          path: "prompt-project-list",
          meta: { title: "PROMPT项目列表" },
          component: () =>
            import("../components/projectManagePage/promptProjectList.vue"),
        },
        {
          path: "model-project-list",
          meta: { title: "模型评测项目列表" },
          component: () =>
            import("../components/projectManagePage/modelProjectList.vue"),
        },
        {
          path: "create-project",
          meta: { title: "创建项目" },
          component: () =>
            import("../components/projectManagePage/createProject.vue"),
        },
        {
          path: "project-setting",
          meta: { title: "项目设置" },
          component: () =>
            import("../components/projectManagePage/projectSetting.vue"),
        },
        {
          path: "team-work",
          meta: { title: "团队协作" },
          component: () =>
            import("../components/projectManagePage/teamWork.vue"),
        },
        {
          path: "eval",
          meta: { title: "创建评测任务" },
          children: [
            {
              path: "easy",
              meta: { title: "评测大语言模型" },
              component: () =>
                import("../components/modelEvalPage/evalLanguage.vue"),
            },
            {
              path: "custom",
              meta: { title: "自定义评测任务" },
              component: () =>
                import("../components/modelEvalPage/evalCustom.vue"),
            },
            {
              path: "detail",
              meta: { title: "评测任务详情" },
              component: () =>
                import("../components/modelEvalPage/examineDetail.vue"),
            },
          ],
        },
        {
          path: "dataset-submit",
          meta: { title: "数据集提交" },
          component: () =>
            import("../components/modelEvalPage/dataSetSubmit.vue"),
        },
        {
          path: "dataset-detail/:id",
          meta: { title: "数据集详情" },
          component: () =>
            import("../components/modelEvalPage/dataSetDetail.vue"),
        },
        {
          path:'dataset/:id',
          meta:{title:"数据集审核详情"},
          component:()=>import('@/components/modelEvalPage/dataSetDetailProcess.vue')
        },
        {
          path: "my-model/create",
          meta: { title: "创建模型" },
          component: () =>
            import("../components/modelEvalPage/createModel.vue"),
        },
        //我的团队
        {
          path: "team-resource",
          meta: { title: "团队资源" },
          component: () => import("../components/teamPage/teamResource.vue"),
        },
        {
          path: "team-member",
          meta: { title: "成员权限" },
          component: () => import("../components/teamPage/teamMember.vue"),
        },
        {
          path: "team-setting",
          meta: { title: "团队设置" },
          component: () => import("../components/teamPage/teamSetting.vue"),
        },
        {
          path:"intelligence-select",
          meta:{title:"智能选型"},
          component:()=>import("../components/others/intelligentSelectionPage.vue")
        },
        {
          path:"selection-result",
          meta:{title:"选型结果"},
          component:()=>import("../components/projectManagePage/selectionProjectList.vue")
        }
      ],
    },
    {
      path: "/help",
      meta: { title: "帮助" },
      component: () => import("../views/Help.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/Login.vue"),
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/Register.vue"),
    },

    {},
  ],
});

// 路由权限控制：仅审核角色可进入审核页
router.beforeEach((to, from, next) => {
  const needRoles = to.meta.requiresRole
  if (needRoles && needRoles.length) {
    // 角色来源：localStorage 可与用户 store 同步
    const storedUser = localStorage.getItem('user')
    let role = localStorage.getItem('userRole')
    if (!role && storedUser) {
      try { role = JSON.parse(storedUser).role } catch {}
    }
    if (!needRoles.includes(role)) {
     ElMessage.warning('仅审核人员可访问该页面')
      return next('/main/standard-list')
    }
  }
  next()
})

export default router;
