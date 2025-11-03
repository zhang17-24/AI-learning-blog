"""
LLM提供商基类
定义统一的接口规范
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any


class LLMProvider(ABC):
    """
    大语言模型提供商抽象基类
    
    所有大模型提供商都需要实现这个接口，以确保统一的调用方式
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        初始化提供商
        
        Args:
            config: 提供商配置字典
        """
        self.config = config
    
    @abstractmethod
    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 4096) -> Dict[str, Any]:
        """
        聊天接口：发送消息并获取AI回复
        
        Args:
            messages: 消息列表，格式：[{"role": "user", "content": "..."}]
            temperature: 温度参数，控制随机性（0-1）
            max_tokens: 最大生成token数
            
        Returns:
            dict: {
                "success": bool,
                "content": str,  # AI回复内容（success为True时）
                "error": str     # 错误信息（success为False时）
            }
        """
        pass
    
    @abstractmethod
    def simple_chat(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """
        简单对话接口：自动构建消息格式
        
        Args:
            prompt: 用户输入的问题或提示
            system_prompt: 系统提示词（可选）
            
        Returns:
            str: AI回复内容，失败时返回None
        """
        pass
    
    @abstractmethod
    def check_config(self) -> Dict[str, Any]:
        """
        检查配置是否完整
        
        Returns:
            dict: {
                "valid": bool,
                "missing": List[str],  # 缺失的配置项
                "provider": str        # 提供商名称
            }
        """
        pass
