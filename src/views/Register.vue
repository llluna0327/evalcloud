<template>
  <div class="login-bg">
    <div class="login-card fade-up">
      <div class="login-right">
        <img src="@/assets/imgs/login.png" alt="register-illustration" />
      </div>
      <div class="login-left">
        <el-form :model="user" :rules="rules" ref="registerRef" class="login-form" @submit.prevent>
          <div class="login-title">欢迎注册评调云</div>
          <div class="login-subtitle">创建你的账户，开始高效创作与协作</div>
          <el-form-item prop="username">
            <el-input size="large" placeholder="请输入账号" v-model="user.username" clearable>
              <template #prefix>
                <el-icon>
                  <User />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input size="large" show-password placeholder="请输入密码" v-model="user.password" clearable>
              <template #prefix>
                <el-icon>
                  <Lock />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="confirmPass">
            <el-input size="large" show-password placeholder="请确认密码" v-model="user.confirmPass" @keyup.enter="Register"
              clearable>
              <template #prefix>
                <el-icon>
                  <Lock />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button class="login-btn" type="primary" size="large" @click="Register" auto-insert-space>
              注 册
            </el-button>
          </el-form-item>
          <div class="login-footer">
            已经有账号了？请
            <span class="login-link" @click="$router.push('/login')">登录</span>
          </div>
        </el-form>
      </div>

    </div>
  </div>
</template>

<script>
import { register } from "@/api/user.js";
import { User, Lock } from "@element-plus/icons-vue";

export default {
  name: "register",
  components: {
    User,
    Lock
  },
  data() {
    const validatePassword = (rule, confirmPass, callback) => {
      if (confirmPass === '') {
        callback(new Error('请确认密码'))
      } else if (confirmPass !== this.user.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    return {
      user: {
        username: '',
        password: '',
        confirmPass: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入账号', trigger: 'blur' },
          { pattern: /^\S{5,16}$/, message: '5-16个字符', trigger: "blur" },
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { pattern: /^\S{5,16}$/, message: '5-16个字符', trigger: "blur" },
        ],
        confirmPass: [
          { validator: validatePassword, trigger: 'blur' }
        ],
      }
    }
  },
  methods: {
    async Register() {
      this.$refs['registerRef'].validate(async (valid) => {
        if (valid) {
          try {
            const response = await register({
              username: this.user.username,
              password: this.user.password
            });
            if (response.code === 0) {
              this.$message.success('注册成功');
              this.$router.push('/login');
            } else {
              this.$message.error(response.message || '注册失败');
            }
          } catch (error) {
            this.$message.error('注册请求失败，请稍后再试');
            console.error(error);
          }
        }
      });
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
  border: 1.5px solid #e3eaf5;
  transition: border-color 0.2s;
}

:deep(.el-input__inner) {
  height: 44px;
  font-size: 15px;
  background: transparent;
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
  width: 92%;
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
</style>