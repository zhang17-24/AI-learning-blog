"""
数据库模型模块
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# 导入所有模型
from .user import User
from .course import Course
from .assignment import Assignment
from .assignment_file import AssignmentFile
from .study_plan import StudyPlan
from .group import Group, GroupMember
from .group_task import GroupTask
from .message import Message
from .file import File
from .project import Project, ProjectFile
from .commit import Commit, FileChange
from .ai_chat import AIChatSession, AIChatMessage
from .writing_space import WritingSession, WritingItem
from .notification import Notification

__all__ = [
    'db',
    'User',
    'Course',
    'Assignment',
    'AssignmentFile',
    'StudyPlan',
    'Group',
    'GroupMember',
    'GroupTask',
    'Message',
    'File',
    'Project',
    'ProjectFile',
    'Commit',
    'FileChange',
    'AIChatSession',
    'AIChatMessage',
    'WritingSession',
    'WritingItem',
    'Notification'
]

