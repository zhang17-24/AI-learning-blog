@echo off
chcp 65001 >nul
REM 初始化数据库脚本 - 包含环境配置和数据库初始化

echo ========================================
echo    AI智能学习日程规划助手
echo    初始化数据库
echo ========================================
echo.

cd /d "%~dp0"

REM ========== 检查Python环境 ==========
echo [1/4] 检查Python环境...
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

REM 显示Python版本
where python.exe >nul 2>&1
if %errorlevel%==0 (
    python.exe --version
    set PYTHON_CMD=python.exe
) else (
    py.exe --version
    set PYTHON_CMD=py.exe
)
echo ✅ Python环境正常
echo.

REM ========== 创建虚拟环境 ==========
echo [2/4] 配置虚拟环境...
if not exist "venv\Scripts\activate.bat" (
    echo 创建虚拟环境...
    %PYTHON_CMD% -m venv venv
    
    if %errorlevel% neq 0 (
        echo ❌ 创建虚拟环境失败！
        pause
        exit /b 1
    )
    echo ✅ 虚拟环境创建成功
) else (
    echo ✅ 虚拟环境已存在
)
echo.

REM ========== 激活虚拟环境并安装依赖 ==========
echo [3/4] 安装依赖包...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ❌ 激活虚拟环境失败！
    pause
    exit /b 1
)

REM 升级pip
echo 升级pip...
python -m pip install --upgrade pip -q

REM 检查Flask是否安装
python -c "import flask" >nul 2>&1
if %errorlevel% neq 0 (
    echo 安装项目依赖...
    python -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
    
    REM 再次检查Flask是否成功安装
    python -c "import flask" >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败！请检查错误信息。
        echo.
        echo 提示：如果看到"Successfully installed"，说明安装成功，可以继续。
        echo.
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖包已安装
)
echo.

REM ========== 初始化数据库 ==========
echo [4/4] 初始化数据库...
python init_db.py
set INIT_RESULT=%ERRORLEVEL%

if %INIT_RESULT% EQU 0 (
    echo.
    echo ========================================
    echo ✅ 数据库初始化成功！
    echo ========================================
    echo.
    echo 测试账户信息：
    echo   邮箱: test@example.com
    echo   密码: 123456
    echo.
    echo 提示：
    echo - 现在可以运行"启动项目.bat"启动服务
    echo - 使用上述账户登录系统
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ 数据库初始化失败！
    echo ========================================
    echo.
    echo 请检查错误信息，或尝试：
    echo 1. 确保已正确安装所有依赖
    echo 2. 检查是否有权限访问数据库文件
    echo 3. 删除 learning_assistant.db 后重新运行此脚本
    echo.
)

pause
