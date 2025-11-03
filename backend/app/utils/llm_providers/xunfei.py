"""
讯飞星火大模型提供商
"""
import json
import time
import hashlib
import base64
import hmac
import urllib.parse
from typing import List, Dict, Optional, Any

try:
    import websocket
except ImportError:
    websocket = None

from .base import LLMProvider


class XunfeiProvider(LLMProvider):
    """讯飞星火API封装类（WebSocket协议）"""
    
    def __init__(self, config: Dict[str, Any]):
        """
        初始化讯飞星火API配置
        
        Args:
            config: 配置字典，包含以下键：
                - appid: 应用ID
                - api_key: API密钥
                - api_secret: API密钥Secret
                - domain: 模型ID（modelId），如 'lite', 'general', 'generalv2' 等
                - base_url: API基础URL（可选）
        """
        super().__init__(config)
        self.appid = config.get('appid', '')
        self.api_key = config.get('api_key', '')
        self.api_secret = config.get('api_secret', '')
        self.domain = config.get('domain', 'lite')
        self.base_url = config.get(
            'base_url', 
            'wss://spark-api.xf-yun.com/v1.1/chat'
        )
    
    def _create_url(self):
        """
        生成带鉴权参数的WebSocket URL
        
        Returns:
            带鉴权参数的WebSocket URL
        """
        import email.utils
        
        # 生成时间戳
        host = urllib.parse.urlparse(self.base_url).netloc
        path = urllib.parse.urlparse(self.base_url).path
        
        # 生成RFC1123格式的时间戳（使用GMT时区）
        now = time.time()
        date = email.utils.formatdate(timeval=now, localtime=False, usegmt=True)
        
        # 构建签名字符串
        signature_origin = f"host: {host}\ndate: {date}\nGET {path} HTTP/1.1"
        
        # 使用HMAC-SHA256计算签名
        signature_sha = hmac.new(
            self.api_secret.encode('utf-8'),
            signature_origin.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()
        signature = base64.b64encode(signature_sha).decode('utf-8')
        
        # 构建Authorization头
        authorization_origin = f'api_key="{self.api_key}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature}"'
        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')
        
        # 构建WebSocket URL（将参数编码到URL中）
        url = f"{self.base_url}?authorization={urllib.parse.quote(authorization)}&date={urllib.parse.quote(date)}&host={urllib.parse.quote(host)}"
        return url
    
    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.5, max_tokens: int = 4096) -> Dict[str, Any]:
        """
        调用讯飞星火聊天接口（使用WebSocket协议）
        
        Args:
            messages: 对话消息列表，格式：[{"role": "user", "content": "..."}]
            temperature: 温度参数，控制随机性，范围0-1
            max_tokens: 最大生成token数
            
        Returns:
            dict: API响应结果，包含content字段
        """
        if websocket is None:
            return {
                'success': False,
                'error': 'websocket-client库未安装，请运行: pip install websocket-client'
            }
        
        try:
            # 检查配置
            if not self.appid or not self.api_key or not self.api_secret:
                return {
                    'success': False,
                    'error': '讯飞API配置不完整，请检查XUNFEI_APPID、XUNFEI_API_KEY和XUNFEI_API_SECRET'
                }
            
            # 生成WebSocket URL
            try:
                ws_url = self._create_url()
            except Exception as url_error:
                return {
                    'success': False,
                    'error': f'生成WebSocket URL失败: {str(url_error)}'
                }
            
            # 构建请求数据
            # 转换messages格式：讯飞API需要特定的格式
            text_messages = []
            for msg in messages:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                if role == 'system':
                    # 系统提示词需要特殊处理
                    continue
                text_messages.append({
                    'role': role,
                    'content': content
                })
            
            request_data = {
                "header": {
                    "app_id": self.appid,
                    "uid": "39769795890"
                },
                "parameter": {
                    "chat": {
                        "domain": self.domain,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        "top_k": 4
                    }
                },
                "payload": {
                    "message": {
                        "text": text_messages
                    }
                }
            }
            
            # 添加系统提示词（如果有）
            system_msg = next((msg.get('content') for msg in messages if msg.get('role') == 'system'), None)
            if system_msg:
                request_data["parameter"]["chat"]["system"] = {
                    "text": [{"role": "system", "content": system_msg}]
                }
            
            # 用于收集响应
            full_content = []
            error_code = None
            error_message = None
            ws_closed = False
            connection_error = None
            
            # WebSocket消息处理
            def on_message(ws, message):
                nonlocal full_content, error_code, error_message
                try:
                    data = json.loads(message)
                    
                    # 检查错误
                    header = data.get('header', {})
                    code = header.get('code', 0)
                    status = header.get('status', 0)
                    
                    if code != 0:
                        error_code = code
                        error_message = header.get('message', '未知错误')
                        ws.close()
                        return
                    
                    # 提取内容
                    payload = data.get('payload', {})
                    choices = payload.get('choices', {})
                    text_list = choices.get('text', [])
                    
                    for text_item in text_list:
                        content = text_item.get('content', '')
                        if content:
                            full_content.append(content)
                    
                    # 如果status=2，表示最后一个结果，可以关闭连接
                    if status == 2:
                        ws.close()
                    
                except json.JSONDecodeError:
                    pass
            
            def on_error(ws, error):
                nonlocal connection_error
                connection_error = str(error)
            
            def on_close(ws, close_status_code, close_msg):
                nonlocal ws_closed
                ws_closed = True
            
            def on_open(ws):
                # 连接打开后发送请求
                ws.send(json.dumps(request_data))
            
            # 创建WebSocket连接
            ws = websocket.WebSocketApp(
                ws_url,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close,
                on_open=on_open
            )
            
            # 运行WebSocket（带超时）
            import threading
            ws_thread = threading.Thread(target=ws.run_forever, kwargs={'ping_interval': 30, 'ping_timeout': 10})
            ws_thread.daemon = True
            ws_thread.start()
            
            # 等待响应（最多30秒）
            import time as time_module
            timeout = 30
            start_time = time_module.time()
            while not ws_closed and (time_module.time() - start_time) < timeout:
                time_module.sleep(0.1)
            
            # 如果超时或出错，关闭连接
            if not ws_closed:
                try:
                    ws.close()
                except:
                    pass
                if connection_error:
                    return {
                        'success': False,
                        'error': f'WebSocket连接错误: {connection_error}'
                    }
                else:
                    return {
                        'success': False,
                        'error': 'WebSocket请求超时（30秒）'
                    }
            
            # 检查是否有错误
            if error_code is not None:
                return {
                    'success': False,
                    'error': f'API返回错误: code={error_code}, message={error_message}'
                }
            
            # 拼接完整内容
            content = ''.join(full_content)
            
            if content:
                return {
                    'success': True,
                    'content': content
                }
            else:
                return {
                    'success': False,
                    'error': 'API返回空内容'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'API调用异常: {str(e)}'
            }
    
    def simple_chat(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """
        简单对话接口，自动构建消息格式
        
        Args:
            prompt: 用户输入的问题或提示
            system_prompt: 系统提示词（可选）
            
        Returns:
            str: AI回复内容，失败时返回None
        """
        messages = []
        
        # 添加系统提示词
        if system_prompt:
            messages.append({
                'role': 'system',
                'content': system_prompt
            })
        
        # 添加用户消息
        messages.append({
            'role': 'user',
            'content': prompt
        })
        
        # 调用API
        result = self.chat(messages)
        
        if result.get('success'):
            return result.get('content', '')
        else:
            return None
    
    def check_config(self) -> Dict[str, Any]:
        """
        检查配置是否完整
        
        Returns:
            dict: 配置检查结果
        """
        missing = []
        
        if not self.appid:
            missing.append('appid')
        if not self.api_key:
            missing.append('api_key')
        if not self.api_secret:
            missing.append('api_secret')
        
        return {
            'valid': len(missing) == 0,
            'missing': missing,
            'provider': 'xunfei'
        }
