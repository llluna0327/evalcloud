<template>
  <div class="login-bg">
    <div class="login-card fade-up">
      <div class="login-left">
        <el-form :model="user" :rules="rules" ref="loginRef" class="login-form" @submit.prevent>
          <div class="login-title">欢迎登录评调云</div>
          <div class="login-subtitle">请登录以继续你的高效创作</div>
          <el-form-item prop="username">
            <el-input size="large" placeholder="请输入账号" v-model="user.username" @keyup.enter="login" clearable>
              <template #prefix>
                <el-icon>
                  <User />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input size="large" show-password placeholder="请输入密码" v-model="user.password" @keyup.enter="login"
              clearable>
              <template #prefix>
                <el-icon>
                  <Lock />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="code">
            <div class="code-row">
              <el-input size="large" placeholder="请输入验证码" v-model="user.code" @keyup.enter="login" clearable>
                <template #prefix>
                  <el-icon>
                    <CircleCheck />
                  </el-icon>
                </template>
              </el-input>
              <div class="valid-code">
                <valid-code @update:value="getCode" />
              </div>
            </div>
          </el-form-item>

          <!-- 身份权限选择 -->
          <!-- <el-form-item>
            <div class="role-group">
              <span class="role-label">选择身份</span>
              <el-radio-group v-model="selectedRole" size="small" class="role-seg">
                <el-radio-button label="admin">
                  <el-icon>
                    <Setting />
                  </el-icon> 管理员
                </el-radio-button>
                <el-radio-button label="member">
                  <el-icon>
                    <UserFilled />
                  </el-icon> 成员
                </el-radio-button>
              </el-radio-group>
            </div>
          </el-form-item> -->
          <el-form-item>
            <el-button class="login-btn" type="primary" size="large" @click="login" auto-insert-space>
              登 录
            </el-button>
          </el-form-item>
          <div class="login-footer">
            还没有账号？请
            <span class="login-link" @click="$router.push('/register')">注册</span>
          </div>
        </el-form>
      </div>
      <div class="login-right">
        <img src="@/assets/imgs/login.png" alt="login-illustration" />
      </div>
    </div>
  </div>
</template>

<script>
import ValidCode from "@/components/others/ValidCode.vue";
import { login } from "@/api/user";
import { User, Lock, CircleCheck } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/user";


export default {
  name: "login",
  components: {
    ValidCode,
    User,
    Lock,
    CircleCheck
  },
  data() {
    const validateCode = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入验证码'))
      } else if (value.toLowerCase() !== this.code) {
        callback(new Error('验证码错误'))
      } else {
        callback()
      }
    }
    return {
      code: '',
      user: {
        // code: '',
        username: '',
        password: '',
      },
      // 新增：选择的角色
      // selectedRole: 'member',
      rules: {
        username: [
          { required: true, message: '请输入账号', trigger: 'blur' },
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
        ],
        code: [
          { validator: validateCode, trigger: 'blur' }
        ],
      },
    }
  },
  methods: {
    getCode(code) {
      this.code = code.toLowerCase()
    },
    async login() {
      this.$refs['loginRef'].validate(async (valid) => {
        if (!valid) return
        try {     
          const res = await login({
            username: this.user.username,
            password: this.user.password,
          })
         console.log('Login response:', res.data)
          // console.log('Server error:', res)

          if (res.code === 200) {
            // console.log('Server error:', res)
            const u = res?.data?.user || res?.data || {}
            const role = res.data
            const avatar = u.avatar || ''
            const name =  this.user.username
            // const token = res.data
            // if (token) {
            //   localStorage.setItem('token', token)
            // }

            const userStore = useUserStore()
            userStore.setUser({ username: name, role, avatar })

            this.$message.success(`登录成功，当前身份：${role}`)
            console.log('Logged in user:', { name, role, avatar})
            this.$router.push('/')
          } else {
            this.$message.error(res.message || '登录失败')
          }
        } catch (e) {
          this.$message.error('登录请求失败，请稍后再试')
          console.error(e)
        }
      })
    }
  }
}
</script>

<style scoped>
.login-bg {
  height: 100vh;
  width: 75vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: auto;
}

.login-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  background: url('@/assets/imgs/bg.jpg') no-repeat center bottom/cover;
  z-index: 0;
  pointer-events: none;
}

.login-card {
  margin-left: -250px;
  z-index: 1;
  display: flex;
  flex-direction: row;
  width: 900px;
  max-width: 96vw;
  min-height: 420px;
  background-color: rgba(255, 255, 255, 0.566);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 40px 0 rgba(28, 66, 147, 0.13);
  overflow: hidden;
  border-radius: 10px;
}

.login-left {
  flex: 1.1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 38px 36px 38px 44px;
  /* background: rgba(255,255,255,0.92); */
}

.login-form {
  width: 100%;
  max-width: 340px;
}

.login-title {
  font-size: 24px;
  font-weight: 800;
  text-align: center;
  margin-bottom: 8px;
  color: #1b2840;
  letter-spacing: 1px;
}

.login-subtitle {
  text-align: center;
  color: #6b7785;
  margin-bottom: 22px;
  font-size: 14px;
}

.el-form-item {
  margin-bottom: 22px;
}

:deep(.el-input__wrapper) {
  border-radius: 12px !important;
  padding: 0 12px;

  transition: border-color 0.2s;
}



:deep(.el-input__inner) {
  height: 44px;
  font-size: 15px;
  background: transparent;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.valid-code {
  width: 110px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7faff;
  border-radius: 10px;
  border: 1.5px solid #e3eaf5;
  margin-left: 4px;
}

.login-btn {
  width: 100%;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(90deg, #4e9cff 0%, #6ec6ff 100%);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 2px;
  border: none;
  box-shadow: 0 4px 18px rgba(92, 141, 255, 0.13);
  transition: filter 0.2s;
}

.login-btn:hover {
  filter: brightness(1.06);
}

.login-footer {
  text-align: left;
  color: #6b7785;
  font-size: 14px;
  margin-top: 2px;
  margin-left: 2px;
}

.login-link {
  color: #4e9cff;
  cursor: pointer;
  margin-left: 2px;
  font-weight: 600;
  transition: color 0.2s;
}

.login-link:hover {
  color: #2b6edb;
}

.login-right {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.18);
  min-width: 0;
}

.login-right img {
  width: 80%;
  max-width: 400px;
  min-width: 220px;
  height: auto;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}

.fade-up {
  animation: fadeUp .5s cubic-bezier(.4, 0, .2, 1);
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 800px) {
  .login-card {
    flex-direction: column;
    min-width: 0;
  }

  .login-left,
  .login-right {
    padding: 28px 12px;
  }

  .login-right {
    justify-content: center;
  }

  .login-right img {
    width: 70%;
    min-width: 120px;
  }
}

@media (max-width: 520px) {
  .login-card {
    width: 99vw;
  }

  .login-form {
    max-width: 100vw;
  }

  .login-left,
  .login-right {
    padding: 16px 2vw;
  }

  .login-title {
    font-size: 19px;
  }

  .login-subtitle {
    font-size: 12px;
  }
}

/* 身份选择样式（胶囊分段控件） */
.role-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.role-label {
  color: #6b7785;
  font-size: 13px;
  white-space: nowrap;
}

:deep(.role-seg) {
  display: inline-flex;
  /* background: #f5f7fb; */
  padding: 4px;
  border-radius: 999px;
  border: 1px none #e6eef7;
}

:deep(.role-seg .el-radio-button__inner) {
  border: none;
  background: transparent;
  color: #55657a;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 600;
  transition: all .2s ease;
}

:deep(.role-seg .el-radio-button:first-child .el-radio-button__inner) {
  margin-left: 0;
}

:deep(.role-seg .el-radio-button__inner:hover) {
  background: #eef3ff;
}

:deep(.role-seg .el-radio-button.is-active .el-radio-button__inner) {
  color: #fff;
  background: linear-gradient(90deg, #4e9cff 0%, #6ec6ff 100%);
  box-shadow: 0 4px 14px rgba(78, 156, 255, .25);
}

:deep(.role-seg .el-icon) {
  margin-right: 4px;
}

/* 小屏适配 */
@media (max-width: 520px) {
  .role-group {
    gap: 8px;
  }

  .role-label {
    font-size: 12px;
  }
}
</style>