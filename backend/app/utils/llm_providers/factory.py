"""
LLM提供商工厂类
根据配置自动选择和使用不同的LLM提供商
"""
from typing import Dict, Any, Optional
from flask import current_app

from .base import LLMProvider
from .xunfei import XunfeiProvider
from .openai import OpenAIProvider


class LLMFactory:
    """LLM提供商工厂类"""
    
    # 支持的提供商类型
    PROVIDERS = {
        'xunfei': XunfeiProvider,
        'openai': OpenAIProvider,
    }
    
    @classmethod
    def create_provider(cls, provider_type: Optional[str] = None, config: Optional[Dict[str, Any]] = None) -> LLMProvider:
        """
        创建LLM提供商实例
        
        Args:
            provider_type: 提供商类型（xunfei, openai等），如果为None则从配置读取
            config: 自定义配置字典，如果为None则从应用配置读取
            
        Returns:
            LLMProvider: 提供商实例
        """
        # 如果没有指定provider_type，从配置读取
        if provider_type is None:
            try:
                provider_type = current_app.config.get('LLM_PROVIDER', 'xunfei')
            except RuntimeError:
                # 不在应用上下文中，使用默认值
                provider_type = 'xunfei'
        
        # 获取提供商类
        provider_class = cls.PROVIDERS.get(provider_type.lower())
        if not provider_class:
            raise ValueError(f'不支持的LLM提供商类型: {provider_type}')
        
        # 如果没有提供配置，从应用配置读取
        if config is None:
            config = cls._get_config_from_app(provider_type)
        
        # 创建提供商实例
        return provider_class(config)
    
    @classmethod
    def _get_config_from_app(cls, provider_type: str) -> Dict[str, Any]:
        """
        从应用配置中读取提供商配置
        
        Args:
            provider_type: 提供商类型
            
        Returns:
            dict: 配置字典
        """
        try:
            if provider_type.lower() == 'xunfei':
                return {
                    'appid': current_app.config.get('XUNFEI_APPID', ''),
                    'api_key': current_app.config.get('XUNFEI_API_KEY', ''),
                    'api_secret': current_app.config.get('XUNFEI_API_SECRET', ''),
                    'domain': current_app.config.get('XUNFEI_DOMAIN', 'lite'),
                    'base_url': current_app.config.get('XUNFEI_API_URL', 'wss://spark-api.xf-yun.com/v1.1/chat')
                }
            elif provider_type.lower() == 'openai':
                return {
                    'api_key': current_app.config.get('OPENAI_API_KEY', ''),
                    'base_url': current_app.config.get('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
                    'model': current_app.config.get('OPENAI_MODEL', 'gpt-3.5-turbo')
                }
            else:
                return {}
        except RuntimeError:
            # 不在应用上下文中，返回空配置
            return {}


def get_llm_provider(provider_type: Optional[str] = None, config: Optional[Dict[str, Any]] = None) -> LLMProvider:
    """
    便捷函数：获取LLM提供商实例
    
    Args:
        provider_type: 提供商类型（可选）
        config: 自定义配置（可选）
        
    Returns:
        LLMProvider: 提供商实例
    """
    return LLMFactory.create_provider(provider_type, config)
