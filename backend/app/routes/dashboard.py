"""
Dashboard路由 - 统计数据和消息提醒
"""
from flask import Blueprint, request, jsonify, current_app
from app.utils.auth import login_required
from app.models import db
from app.models.assignment import Assignment
from app.models.course import Course
from app.models.notification import Notification
from app.models.group import Group, GroupMember
from app.models.group_task import GroupTask
from app.utils.xunfei_api import analyze_file_content, XunfeiAPI
from datetime import datetime, timedelta
import json
import re

bp = Blueprint('dashboard', __name__)


@bp.route('/stats', methods=['GET'])
@login_required
def get_stats():
    """
    获取首页统计数据
    
    返回:
        {
            "success": true,
            "stats": {
                "study_duration": 今日学习时长（小时，通过AI分析作业量推断）,
                "pending_assignments": 待完成作业数量,
                "this_week_courses": 本周课程数量,
                "learning_progress": 学习进度（百分比）
            }
        }
    """
    try:
        user = request.current_user
        
        # 获取待完成作业
        pending_assignments = Assignment.query.filter_by(
            user_id=user.id
        ).filter(
            Assignment.status.in_(['pending', 'in_progress'])
        ).all()
        
        # 获取本周课程
        today = datetime.now()
        day_of_week = today.weekday() + 1  # 1=Monday, 7=Sunday
        this_week_courses = Course.query.filter_by(
            user_id=user.id,
            day_of_week=day_of_week
        ).all()
        
        # 使用AI分析作业量推断学习时长
        study_duration = 0.0
        if pending_assignments:
            try:
                # 构建作业描述内容
                assignments_content = []
                for assignment in pending_assignments[:10]:  # 最多分析10个作业
                    content = f"作业标题：{assignment.title}"
                    if assignment.description:
                        content += f"\n描述：{assignment.description[:200]}"  # 限制描述长度
                    assignments_content.append(content)
                
                combined_content = "\n\n".join(assignments_content)
                
                if combined_content:
                    # 调用AI分析
                    result = analyze_file_content(
                        combined_content,
                        file_type='homework'
                    )
                    
                    if result.get('success') and result.get('estimated_hours'):
                        study_duration = float(result['estimated_hours'])
                    else:
                        # 如果AI分析失败，使用简单估算：每个作业平均2小时
                        study_duration = len(pending_assignments) * 2.0
                else:
                    study_duration = len(pending_assignments) * 2.0
            except Exception as e:
                current_app.logger.error(f'AI分析学习时长失败: {str(e)}')
                # 如果AI分析失败，使用简单估算
                study_duration = len(pending_assignments) * 2.0
        else:
            study_duration = 0.0
        
        # 计算学习进度（基于已完成作业比例）
        total_assignments = Assignment.query.filter_by(user_id=user.id).count()
        completed_assignments = Assignment.query.filter_by(
            user_id=user.id,
            status='completed'
        ).count()
        
        learning_progress = 0
        if total_assignments > 0:
            learning_progress = int((completed_assignments / total_assignments) * 100)
        
        return jsonify({
            'success': True,
            'stats': {
                'study_duration': round(study_duration, 1),
                'pending_assignments': len(pending_assignments),
                'this_week_courses': len(this_week_courses),
                'learning_progress': learning_progress
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'获取统计数据失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'获取统计数据失败: {str(e)}'
        }), 500


@bp.route('/overview', methods=['GET'])
@login_required
def get_overview():
    """
    获取学习概览数据
    
    返回:
        {
            "success": true,
            "recent_completed": [最近完成的作业列表],
            "daily_inspiration": {
                "motivation": "每日激励语句",
                "song": {歌曲推荐信息}
            },
            "ai_suggestions": {
                "total_hours": 总预估时长,
                "assignments_analysis": [作业分析],
                "group_tasks_analysis": [小组任务分析],
                "action_guide": [行动指南]
            }
        }
    """
    try:
        user = request.current_user
        
        # 1. 获取最近完成的作业（最近5个）
        recent_completed = Assignment.query.filter_by(
            user_id=user.id,
            status='completed'
        ).order_by(
            Assignment.updated_at.desc()
        ).limit(5).all()
        
        recent_completed_list = []
        for assignment in recent_completed:
            # 计算完成时间距离现在的时间
            time_diff = datetime.utcnow() - assignment.updated_at
            hours_ago = int(time_diff.total_seconds() / 3600)
            
            if hours_ago < 1:
                time_str = '刚刚'
            elif hours_ago < 24:
                time_str = f'{hours_ago}小时前'
            else:
                days_ago = int(hours_ago / 24)
                time_str = f'{days_ago}天前'
            
            recent_completed_list.append({
                'id': assignment.id,
                'title': assignment.title,
                'completed_time': time_str,
                'updated_at': assignment.updated_at.isoformat() if assignment.updated_at else None
            })
        
        # 2. 获取每日激励和歌曲推荐（使用大模型生成，确保每天更新）
        api = XunfeiAPI()
        today = datetime.now().strftime('%Y年%m月%d日')
        day_of_week = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][datetime.now().weekday()]
        
        # 生成每日激励
        motivation_prompt = f"""今天是{today}，{day_of_week}。请为我提供一条激励学习的语句。

要求：
- 30字以内
- 温暖、鼓舞人心、积极向上
- 符合当前是{day_of_week}的语境
- 直接返回激励语句，不要加引号或JSON格式

示例格式：学习是一场马拉松,而不是一场短跑。坚持就是胜利,每一步都离成功更近！💪"""
        
        motivation_result = api.simple_chat(
            motivation_prompt,
            system_prompt="你是一个贴心的学习助手，擅长用温暖的话语鼓励学习者。你的回答应该简洁、直接，不要包含JSON格式或引号。"
        )
        
        # 清理激励语句（移除JSON格式、引号等）
        motivation_text = motivation_result if motivation_result else '今天也要加油学习哦！💪'
        # 移除可能的JSON格式标记
        motivation_text = re.sub(r'^["\']|["\']$', '', motivation_text)
        motivation_text = re.sub(r'\{[^}]*"motivation"[^}]*\}', '', motivation_text)
        motivation_text = motivation_text.strip()
        
        if not motivation_text or len(motivation_text) < 5:
            motivation_text = '今天也要加油学习哦！💪'
        
        # 生成歌曲推荐（使用大模型，推荐热门积极向上的音乐）
        song_prompt = f"""今天是{today}，请为我推荐一首适合学习时听的歌曲。

要求：
1. 必须是真实存在的热门歌曲（最近流行的或经典的热门歌曲）
2. 歌曲风格要积极向上，适合作为学习时的背景音乐
3. 需要包含歌曲名、歌手名、推荐理由

请以JSON格式返回，格式如下：
{{
    "name": "歌曲名（必须是真实热门歌曲）",
    "artist": "歌手名",
    "reason": "推荐理由（为什么适合学习，为什么这首歌积极向上）"
}}

注意：歌曲必须是真实存在的热门歌曲，不要编造。"""
        
        song_result = api.simple_chat(
            song_prompt,
            system_prompt="你是一个音乐推荐专家，熟悉各种热门歌曲。你推荐的歌曲必须是真实存在的热门歌曲。"
        )
        
        # 解析歌曲推荐
        song_data = {
            'name': '轻音乐推荐',
            'artist': 'Various Artists',
            'reason': '适合学习的背景音乐'
        }
        
        if song_result:
            try:
                json_match = re.search(r'\{.*\}', song_result, re.DOTALL)
                if json_match:
                    parsed_song = json.loads(json_match.group())
                    song_data = {
                        'name': parsed_song.get('name', song_data['name']),
                        'artist': parsed_song.get('artist', song_data['artist']),
                        'reason': parsed_song.get('reason', song_data['reason'])
                    }
            except:
                pass
        
        # 3. AI学习建议（分析待完成作业和小组任务）
        pending_assignments = Assignment.query.filter_by(
            user_id=user.id
        ).filter(
            Assignment.status.in_(['pending', 'in_progress'])
        ).order_by(Assignment.due_date.asc()).all()
        
        # 获取用户的小组任务
        user_groups = Group.query.join(GroupMember).filter(
            GroupMember.user_id == user.id
        ).all()
        
        group_task_ids = []
        for group in user_groups:
            tasks = GroupTask.query.filter_by(
                group_id=group.id
            ).filter(
                GroupTask.assignee_id == user.id,
                GroupTask.status.in_(['pending', 'in_progress'])
            ).all()
            group_task_ids.extend([t.id for t in tasks])
        
        group_tasks = GroupTask.query.filter(GroupTask.id.in_(group_task_ids)).all() if group_task_ids else []
        
        # 构建分析内容
        analysis_content = []
        total_estimated_hours = 0.0
        
        assignments_analysis = []
        if pending_assignments:
            analysis_content.append("=== 待完成作业 ===\n")
            for assignment in pending_assignments[:10]:  # 最多分析10个
                content = f"作业：{assignment.title}"
                if assignment.description:
                    content += f"\n描述：{assignment.description[:150]}"
                content += f"\n截止日期：{assignment.due_date.strftime('%Y-%m-%d %H:%M')}"
                content += f"\n优先级：{assignment.priority}"
                analysis_content.append(content + "\n")
                
                # 对每个作业进行时间估计
                assignment_desc = f"{assignment.title}"
                if assignment.description:
                    assignment_desc += f"：{assignment.description[:200]}"
                
                try:
                    assignment_result = analyze_file_content(assignment_desc, file_type='homework')
                    if assignment_result.get('success') and assignment_result.get('estimated_hours'):
                        est_hours = float(assignment_result['estimated_hours'])
                        total_estimated_hours += est_hours
                        assignments_analysis.append({
                            'title': assignment.title,
                            'estimated_hours': round(est_hours, 1),
                            'due_date': assignment.due_date.isoformat(),
                            'priority': assignment.priority
                        })
                    else:
                        # 默认估算：高优先级3小时，中优先级2小时，低优先级1小时
                        default_hours = {'high': 3.0, 'medium': 2.0, 'low': 1.0}.get(assignment.priority, 2.0)
                        total_estimated_hours += default_hours
                        assignments_analysis.append({
                            'title': assignment.title,
                            'estimated_hours': default_hours,
                            'due_date': assignment.due_date.isoformat(),
                            'priority': assignment.priority
                        })
                except:
                    default_hours = {'high': 3.0, 'medium': 2.0, 'low': 1.0}.get(assignment.priority, 2.0)
                    total_estimated_hours += default_hours
        
        group_tasks_analysis = []
        if group_tasks:
            analysis_content.append("\n=== 小组任务 ===\n")
            for task in group_tasks[:10]:  # 最多分析10个
                content = f"任务：{task.title}"
                if task.description:
                    content += f"\n描述：{task.description[:150]}"
                content += f"\n截止日期：{task.due_date.strftime('%Y-%m-%d %H:%M')}"
                analysis_content.append(content + "\n")
                
                # 对每个任务进行时间估计
                task_desc = f"{task.title}"
                if task.description:
                    task_desc += f"：{task.description[:200]}"
                
                try:
                    task_result = analyze_file_content(task_desc, file_type='homework')
                    if task_result.get('success') and task_result.get('estimated_hours'):
                        est_hours = float(task_result['estimated_hours'])
                        total_estimated_hours += est_hours
                        group_tasks_analysis.append({
                            'title': task.title,
                            'estimated_hours': round(est_hours, 1),
                            'due_date': task.due_date.isoformat()
                        })
                    else:
                        # 默认估算2小时
                        total_estimated_hours += 2.0
                        group_tasks_analysis.append({
                            'title': task.title,
                            'estimated_hours': 2.0,
                            'due_date': task.due_date.isoformat()
                        })
                except:
                    total_estimated_hours += 2.0
                    group_tasks_analysis.append({
                        'title': task.title,
                        'estimated_hours': 2.0,
                        'due_date': task.due_date.isoformat()
                    })
        
        # 生成AI学习建议和行动指南
        action_guide = []
        if analysis_content:
            guide_prompt = f"""作为专业的学习规划助手，请分析以下学习任务并给出行动建议：

{''.join(analysis_content)}

请提供：
1. 总体完成时间预估（基于所有任务）
2. 优先级排序建议（哪些任务应该优先完成）
3. 具体行动指南（3-5条可执行的建议）

请以JSON格式返回：
{{
    "total_hours": 总小时数,
    "priority_order": ["任务1", "任务2", ...],
    "action_guide": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}}

注意：total_hours是数字，priority_order和action_guide是数组。"""
            
            guide_result = api.simple_chat(
                guide_prompt,
                system_prompt="你是一个专业的学习规划助手，擅长分析学习任务并提供实用的行动建议。你的建议应该具体、可执行。"
            )
            
            if guide_result:
                try:
                    json_match = re.search(r'\{.*\}', guide_result, re.DOTALL)
                    if json_match:
                        guide_data = json.loads(json_match.group())
                        action_guide = guide_data.get('action_guide', [])
                        # 如果AI给出的总时长更合理，使用AI的
                        if guide_data.get('total_hours'):
                            ai_total_hours = float(guide_data['total_hours'])
                            if ai_total_hours > 0:
                                total_estimated_hours = ai_total_hours
                except:
                    pass
        
        # 如果AI没有生成行动指南，使用默认建议
        if not action_guide:
            action_guide = [
                f"根据任务分析，预计需要{round(total_estimated_hours, 1)}小时完成所有任务",
                "优先完成即将到期的作业",
                "将大任务拆解为小步骤，逐个完成",
                "合理安排学习时间，避免疲劳",
                "完成后及时标记进度，保持动力"
            ]
        
        return jsonify({
            'success': True,
            'recent_completed': recent_completed_list,
            'daily_inspiration': {
                'motivation': motivation_text,
                'song': song_data
            },
            'ai_suggestions': {
                'total_hours': round(total_estimated_hours, 1),
                'assignments_analysis': assignments_analysis,
                'group_tasks_analysis': group_tasks_analysis,
                'action_guide': action_guide
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'获取学习概览失败: {str(e)}')
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'获取学习概览失败: {str(e)}',
            'recent_completed': [],
            'daily_inspiration': {
                'motivation': '今天也要加油学习哦！💪',
                'song': {
                    'name': '轻音乐推荐',
                    'artist': 'Various Artists',
                    'reason': '适合学习的背景音乐'
                }
            },
            'ai_suggestions': {
                'total_hours': 0,
                'assignments_analysis': [],
                'group_tasks_analysis': [],
                'action_guide': ['建议合理安排学习时间', '优先完成重要任务']
            }
        }), 500


@bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    """
    获取用户的消息提醒列表
    
    查询参数:
        unread_only: 是否只获取未读消息（可选）
        limit: 限制返回数量（可选，默认20）
    
    返回:
        {
            "success": true,
            "notifications": [
                {
                    "id": 1,
                    "type": "assignment",
                    "title": "作业提醒",
                    "content": "您有1个作业即将到期",
                    "link": "/assignments",
                    "is_read": false,
                    "created_at": "2024-01-01T12:00:00"
                }
            ],
            "unread_count": 3
        }
    """
    try:
        user = request.current_user
        
        # 获取查询参数
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = request.args.get('limit', type=int) or 20
        
        # 构建查询
        query = Notification.query.filter_by(user_id=user.id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        # 按创建时间倒序排列，限制数量
        notifications = query.order_by(
            Notification.created_at.desc()
        ).limit(limit).all()
        
        # 获取未读消息数量
        unread_count = Notification.query.filter_by(
            user_id=user.id,
            is_read=False
        ).count()
        
        return jsonify({
            'success': True,
            'notifications': [n.to_dict() for n in notifications],
            'unread_count': unread_count
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'获取消息提醒失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'获取消息提醒失败: {str(e)}'
        }), 500


@bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@login_required
def mark_notification_read(notification_id):
    """
    标记消息为已读
    
    返回:
        {
            "success": true,
            "message": "消息已标记为已读"
        }
    """
    try:
        user = request.current_user
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user.id
        ).first()
        
        if not notification:
            return jsonify({
                'success': False,
                'error': '消息不存在'
            }), 404
        
        notification.is_read = True
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '消息已标记为已读'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'标记消息已读失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'标记消息已读失败: {str(e)}'
        }), 500


@bp.route('/notifications/generate', methods=['POST'])
@login_required
def generate_notifications():
    """
    生成消息提醒（自动检查并创建提醒）
    这个接口可以被定时任务调用，或者在需要时手动触发
    
    返回:
        {
            "success": true,
            "created_count": 创建的消息数量
        }
    """
    try:
        user = request.current_user
        created_count = 0
        
        # 1. 检查作业提醒
        now = datetime.now()
        upcoming_assignments = Assignment.query.filter_by(
            user_id=user.id,
            status='pending'
        ).filter(
            Assignment.due_date <= now + timedelta(days=3),
            Assignment.due_date >= now
        ).all()
        
        for assignment in upcoming_assignments:
            # 检查是否已有提醒
            existing = Notification.query.filter_by(
                user_id=user.id,
                type='assignment',
                link=f'/assignments?assignment_id={assignment.id}'
            ).filter(
                Notification.created_at >= now - timedelta(hours=24)
            ).first()
            
            if not existing:
                days_left = (assignment.due_date - now).days
                notification = Notification(
                    user_id=user.id,
                    type='assignment',
                    title='作业提醒',
                    content=f'作业《{assignment.title}》将在{days_left}天后到期，请及时完成',
                    link=f'/assignments?assignment_id={assignment.id}'
                )
                db.session.add(notification)
                created_count += 1
        
        # 2. 检查学习时间提醒
        # 如果今日学习时长建议大于0，且用户没有学习记录
        pending_count = Assignment.query.filter_by(
            user_id=user.id
        ).filter(
            Assignment.status.in_(['pending', 'in_progress'])
        ).count()
        
        if pending_count > 0:
            # 检查是否已有今日学习提醒
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            existing_study_reminder = Notification.query.filter_by(
                user_id=user.id,
                type='study_time'
            ).filter(
                Notification.created_at >= today_start
            ).first()
            
            if not existing_study_reminder:
                notification = Notification(
                    user_id=user.id,
                    type='study_time',
                    title='学习时间提醒',
                    content=f'您还有{pending_count}个待完成作业，建议今日安排时间学习',
                    link='/assignments'
                )
                db.session.add(notification)
                created_count += 1
        
        # 3. 检查小组提醒
        # 检查用户加入的小组是否有新消息（简化处理，这里只检查小组本身）
        user_groups = Group.query.join(GroupMember).filter(
            GroupMember.user_id == user.id
        ).all()
        
        for group in user_groups:
            # 检查是否有新活动提醒（这里简化处理，实际可以根据消息时间判断）
            existing_group_reminder = Notification.query.filter_by(
                user_id=user.id,
                type='group',
                link=f'/groups?group_id={group.id}'
            ).filter(
                Notification.created_at >= now - timedelta(hours=24)
            ).first()
            
            if not existing_group_reminder and len(user_groups) > 0:
                # 只在第一次加入小组时创建提醒
                notification = Notification(
                    user_id=user.id,
                    type='group',
                    title='小组提醒',
                    content=f'您加入的小组《{group.name}》有新动态',
                    link=f'/groups?group_id={group.id}'
                )
                db.session.add(notification)
                created_count += 1
                break  # 只创建一个小组提醒
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'created_count': created_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'生成消息提醒失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'生成消息提醒失败: {str(e)}'
        }), 500
