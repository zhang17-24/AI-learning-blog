# AI智能学习日程规划助手

> 🤖 集成大模型AI的学习管理平台，支持课程管理、作业跟踪、小组协作和智能学习规划

## ✨ 核心亮点

### 🎯 AI智能能力
- **AI伙伴**：全局可访问的智能助手，提供学习答疑、情感陪伴、聊天历史
- **智能文本搜索**：选中文本自动分析，AI提取关键信息并生成搜索建议
- **文件内容分析**：上传文件自动分析，预估完成时间并提供着手建议
- **学习目标拆解**：将大目标拆解为可执行步骤，推荐最优学习路径
- **多模型支持**：轻松切换讯飞星火、DeepSeek、Groq等大模型

### 📚 学习管理
- **课程管理**：周视图课程表，CSV批量导入，时间段自定义
- **作业跟踪**：优先级管理、状态跟踪、提醒设置、文件上传
- **小组协作**：类似Git的协作系统，项目管理、版本控制
- **写作空间**：多文件管理、翻译、搜索、总结，支持Word和图片上传

### ⏱️ 时间管理
- **全局番茄钟**：左下角浮动，页面切换不暂停，自定义时长（1-120分钟）
- **实时数据**：待完成作业、本周课程、学习进度实时统计

### 🎨 用户体验
- **现代化UI**：渐变色彩、卡片布局、响应式设计
- **全局Toast通知**：操作反馈清晰直观
- **骨架屏加载**：优化加载体验
- **平滑动画**：页面切换和交互动画流畅自然

---

## 🛠️ 技术栈

**前端**：React + TypeScript + Vite + Tailwind CSS  
**后端**：Flask + SQLAlchemy + SQLite（开发）/ PostgreSQL（生产）  
**认证**：JWT Token + bcrypt密码加密  
**实时通信**：WebSocket (Flask-SocketIO)  
**AI集成**：多模型支持（讯飞星火、DeepSeek、Groq、OpenAI）

---

## 📋 功能详解

### 课程管理
- **周视图课程表**：周一至周日，按时间段显示
- **手动添加**：课程名称、教师、地点、时间
- **批量导入**：CSV文件导入，支持多课程一次性导入
- **编辑删除**：随时修改和删除课程信息

**CSV格式示例**：
```csv
course_name,instructor,location,day_of_week,start_time,end_time
线性代数,熊波,教学楼A101,1,08:00,09:40
大学物理,艾汉华,教学楼B202,1,10:00,11:40
```

### 作业管理
- **完整CRUD**：创建、编辑、删除作业
- **优先级设置**：低、中、高三级优先级
- **状态跟踪**：待完成、进行中、已完成
- **提醒功能**：自定义提醒时间
- **文件管理**：上传、下载、删除作业相关文件
- **关联课程**：可选关联到已有课程

### 小组协作（Git for Learning）
- **小组管理**：创建小组、密钥加入、成员管理
- **项目管理**：在小组中创建和管理项目
- **文件管理**：上传、编辑、删除项目文件
- **版本控制**：提交历史、版本号、文件变更追踪

### AI智能功能

#### AI伙伴（全局）
- 右下角浮动按钮，任意页面可访问
- 学习答疑、情感陪伴、上下文记忆
- 聊天历史保存在数据库

#### 智能文本搜索
- 选中文本超过2个字符自动弹出浮动工具栏
- AI分析内容，提取关键信息
- 生成搜索建议，一键跳转Google

#### 文件内容分析
- 上传文本文件或输入内容
- AI自动分析并预估完成时间
- 提供具体的着手建议和执行步骤

#### 学习目标拆解
- 输入学习目标，AI拆解为可执行步骤
- 推荐最优学习顺序
- 每个步骤包含时间预估和前置知识要求

#### 写作空间
- 多文件/图片同屏管理
- 支持Word文档和图片上传
- AI翻译、搜索、全文总结功能
- 数据库持久化存储

### 全局番茄钟
- **左下角浮动**：计时状态实时可见
- **页面切换不暂停**：任意导航保持计时
- **自定义时长**：学习1-120分钟，休息1-60分钟
- **进度可视化**：圆形进度条显示剩余时间
- **完成统计**：今日已完成番茄数统计

---

## 🔧 配置说明

### 前置要求
- **Python 3.9+**：已安装并添加到PATH环境变量
- **Node.js 16+**：已安装并添加到PATH环境变量

### 数据库配置

#### 开发环境（默认）
项目默认使用 **SQLite** 数据库，无需额外安装数据库服务。
- 数据库文件：`backend/learning_assistant.db`
- 首次使用需运行 `backend/初始化数据库.bat`

#### 生产环境
如需使用 PostgreSQL：
1. 安装 PostgreSQL 数据库
2. 创建数据库：`learning_assistant`
3. 在 `backend` 目录创建 `.env` 文件：
```env
DATABASE_URL=postgresql://用户名:密码@localhost:5432/learning_assistant
```

### 快速开始

**第1步：初始化数据库（仅首次）**
- 进入 `backend` 文件夹，双击运行：**`初始化数据库.bat`**
- 脚本会自动完成环境检查、依赖安装、数据库初始化
- 创建测试账户（邮箱：test@example.com，密码：123456）

**第2步：启动项目**
- 返回根目录，双击运行：**`启动项目.bat`**
- 脚本会自动配置环境并启动前后端服务
- 后端服务：http://localhost:5000
- 前端服务：http://localhost:5173

**第3步：访问应用**
- 浏览器打开：**http://localhost:5173**
- 使用测试账户登录，或注册新账户

---

## ⚙️ API设置（LLM大模型配置）

项目支持多种大模型提供商，可以轻松切换。

### 配置方法

#### 方法一：使用环境变量文件（推荐）

1. 在 `backend` 目录创建 `.env` 文件：

```env
# 选择LLM提供商（xunfei 或 openai）
LLM_PROVIDER=xunfei

# 讯飞星火配置（默认）
XUNFEI_APPID=你的APPID
XUNFEI_API_KEY=你的API_KEY
XUNFEI_API_SECRET=你的API_SECRET
XUNFEI_DOMAIN=lite  # 模型ID，可选：lite, general, generalv2, pro
```

2. 重启后端服务即可生效

#### 方法二：直接修改配置文件
编辑 `backend/app/config.py`，修改相应配置项。

### 支持的提供商

#### 1. 讯飞星火（默认，推荐国内用户）

- **特点**：中文对话效果好，响应快速
- **获取方式**：
  1. 访问 [讯飞开放平台](https://www.xfyun.cn/) 注册并创建应用
  2. 获取 APPID、API_KEY、API_SECRET
  3. 访问 [讯飞星辰](https://xingchen.xfyun.cn/) 获取模型ID（domain）
- **配置示例**：
```env
LLM_PROVIDER=xunfei
XUNFEI_APPID=你的APPID
XUNFEI_API_KEY=你的API_KEY
XUNFEI_API_SECRET=你的API_SECRET
XUNFEI_DOMAIN=lite
```

#### 2. DeepSeek（推荐，价格便宜性能优秀）

- **特点**：国产大模型，价格便宜，性能优秀
- **获取方式**：访问 [DeepSeek官网](https://www.deepseek.com/) 注册并获取API密钥
- **配置示例**：
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...  # DeepSeek的API密钥
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat  # 或 deepseek-coder
```

#### 3. Groq（免费，速度极快）

- **特点**：完全免费，推理速度极快
- **获取方式**：访问 [Groq官网](https://console.groq.com/) 注册并获取API密钥
- **配置示例**：
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=gsk_...  # Groq的API密钥
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.1-8b-instant  # 或 llama-3.1-70b-versatile
```

#### 4. OpenAI官方API

- **配置示例**：
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo  # 或 gpt-4, gpt-4-turbo
```

### 切换提供商

1. 修改 `.env` 文件中的 `LLM_PROVIDER` 和相关配置
2. **重启后端服务**（重要！）
3. 验证配置：访问 `http://localhost:5000/api/ai/test`（需要登录）

> ⚠️ **安全提示**：不要将包含真实API密钥的 `.env` 文件提交到Git仓库！

---

## 🐛 常见问题

### 数据库初始化失败？
- 确认Python 3.9+已正确安装并添加到PATH
- 确认已运行 `初始化数据库.bat` 安装所有依赖
- 检查 `backend` 目录是否有写入权限
- 删除 `learning_assistant.db` 后重新初始化

### 端口5000被占用？
- `启动项目.bat` 脚本会自动检测并关闭占用端口的进程
- 如果自动关闭失败，手动运行：
```bash
netstat -ano | findstr :5000
taskkill /F /PID <进程ID>
```

### Python找不到？
- 重新安装Python 3.9+，安装时勾选"Add Python to PATH"
- 或手动将Python安装目录添加到系统PATH
- 安装完成后重启命令行窗口验证

### AI功能返回500错误？
- 检查 `.env` 文件或 `config.py` 中的API配置
- 确认API密钥未过期且有相应权限
- 检查网络连接（部分API需要科学上网）
- 查看后端控制台的详细错误信息

### 数据库表结构错误？
- 进入 `backend` 目录
- 删除 `learning_assistant.db` 文件（如存在）
- 重新运行 `初始化数据库.bat`

> ⚠️ **注意**：重新初始化会删除所有现有数据

---

## 📚 项目结构

```
new-blog/
├── 启动项目.bat              # 统一启动脚本
├── backend/
│   ├── 初始化数据库.bat      # 数据库初始化脚本
│   ├── app/
│   │   ├── models/          # 数据库模型
│   │   ├── routes/          # API路由
│   │   ├── utils/           # 工具函数
│   │   │   └── llm_providers/  # LLM提供商抽象层
│   │   └── config.py        # 配置文件
│   ├── init_db.py           # 数据库初始化
│   └── run.py               # 启动文件
└── frontend/
    ├── src/
    │   ├── components/      # React组件
    │   ├── pages/          # 页面组件
    │   ├── services/       # API服务
    │   ├── contexts/       # Context状态管理
    │   └── hooks/          # 自定义Hooks
    └── package.json
```

---

**祝您使用愉快！** 🎉
