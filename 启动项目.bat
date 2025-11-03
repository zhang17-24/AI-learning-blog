@echo off
chcp 65001 > nul
REM 统一启动脚本 - 启动前后端服务

echo ========================================
echo    AI智能学习日程规划助手
echo    启动项目
echo ========================================
echo.

cd /d "%~dp0"

REM ========== 检查并设置后端环境 ==========
echo [1/4] 检查后端环境...
cd backend

REM 检查Python是否可用
where python.exe >nul 2>&1
if %errorlevel% neq 0 (
    where py.exe >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ 错误：未找到Python！
        echo.
        echo 请先安装Python 3.9+，并确保已添加到PATH环境变量
        echo 下载地址：https://www.python.org/downloads/
        echo.
        pause
        exit /b 1
    )
)

REM 检查虚拟环境是否存在，不存在则创建
if not exist "venv\Scripts\activate.bat" (
    echo ⚠️  虚拟环境不存在，正在创建...
    where python.exe >nul 2>&1
    if %errorlevel%==0 (
        python.exe -m venv venv
    ) else (
        py.exe -m venv venv
    )
    
    if %errorlevel% neq 0 (
        echo ❌ 创建虚拟环境失败！
        pause
        exit /b 1
    )
    echo ✅ 虚拟环境创建成功
    echo.
    
    REM 激活虚拟环境并安装依赖
    echo [安装] 后端依赖包...
    call venv\Scripts\activate.bat
    python -m pip install --upgrade pip -q
    python -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
    if %errorlevel% neq 0 (
        echo ⚠️  依赖安装可能有问题，但继续启动...
    )
) else (
    REM 激活虚拟环境
    call venv\Scripts\activate.bat
)

REM 检查Flask是否安装
python -c "import flask" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Flask未安装，正在安装依赖...
    python -m pip install --upgrade pip -q
    python -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
)

REM 检查并关闭占用5000端口的进程
echo [2/4] 检查端口5000...
netstat -ano | findstr :5000 | findstr LISTENING >nul
if not errorlevel 1 (
    echo ⚠️  端口5000被占用，正在尝试关闭...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

echo ✅ 后端环境就绪
cd ..

REM ========== 检查并设置前端环境 ==========
echo [3/4] 检查前端环境...
cd frontend

REM 检查Node.js是否可用
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到Node.js！
    echo.
    echo 请先安装Node.js 16+
    echo 下载地址：https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM 检查node_modules是否存在，不存在则安装
if not exist node_modules (
    echo ⚠️  依赖未安装，正在安装...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败！
        pause
        exit /b 1
    )
)

echo ✅ 前端环境就绪
cd ..

REM ========== 启动服务 ==========
echo [4/4] 启动前后端服务...
echo.

REM 启动后端服务（新窗口）
start "AI助手 - 后端服务" cmd /k "cd /d %~dp0backend && venv\Scripts\activate.bat && python run.py"

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端服务（新窗口）
start "AI助手 - 前端服务" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo ✅ 服务启动成功！
echo ========================================
echo.
echo 后端服务: http://localhost:5000
echo 前端服务: http://localhost:5173
echo.
echo 提示：
echo - 服务已在新的窗口中启动
echo - 关闭对应的窗口即可停止服务
echo - 首次使用请先运行"初始化数据库.bat"创建数据库
echo.
pause

