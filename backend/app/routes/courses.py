"""
课程管理路由
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, time
from app.models import db
from app.models.course import Course
from app.utils.auth import login_required
import csv
import io

bp = Blueprint('courses', __name__)


def parse_time(time_str):
    """
    将时间字符串转换为Time对象
    
    Args:
        time_str: 时间字符串，格式为 'HH:MM' 或 'HH:MM:SS'
        
    Returns:
        Time对象
    """
    try:
        if isinstance(time_str, str):
            parts = time_str.split(':')
            hour = int(parts[0])
            minute = int(parts[1])
            second = int(parts[2]) if len(parts) > 2 else 0
            return time(hour, minute, second)
        return time_str
    except (ValueError, IndexError, AttributeError):
        raise ValueError(f'无效的时间格式: {time_str}')


@bp.route('', methods=['GET', 'POST'])
@login_required
def courses():
    """获取课程列表或创建新课程"""
    user = request.current_user
    
    if request.method == 'GET':
        try:
            # 获取当前用户的所有课程
            courses_list = Course.query.filter_by(user_id=user.id).all()
            return jsonify({
                'courses': [course.to_dict() for course in courses_list]
            }), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    if request.method == 'POST':
        try:
            data = request.json
            
            # 验证必填字段
            required_fields = ['course_name', 'day_of_week', 'start_time', 'end_time']
            if not data or not all(data.get(field) is not None for field in required_fields):
                return jsonify({'error': '缺少必要字段：course_name, day_of_week, start_time, end_time'}), 400
            
            # 验证day_of_week范围 (0-6, 0=周日, 1=周一, ..., 6=周六)
            if not isinstance(data['day_of_week'], int) or data['day_of_week'] < 0 or data['day_of_week'] > 6:
                return jsonify({'error': 'day_of_week必须是0-6之间的整数 (0=周日, 1=周一, ..., 6=周六)'}), 400
            
            # 解析时间
            start_time = parse_time(data['start_time'])
            end_time = parse_time(data['end_time'])
            
            # 验证时间逻辑
            if start_time >= end_time:
                return jsonify({'error': '开始时间必须早于结束时间'}), 400
            
            # 创建新课程
            course = Course(
                user_id=user.id,
                course_name=data['course_name'],
                instructor=data.get('instructor', ''),
                location=data.get('location', ''),
                day_of_week=data['day_of_week'],
                start_time=start_time,
                end_time=end_time
            )
            
            db.session.add(course)
            db.session.commit()
            
            return jsonify({
                'message': '课程创建成功',
                'course': course.to_dict()
            }), 201
            
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'创建课程失败: {str(e)}'}), 500


@bp.route('/<int:course_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def course_detail(course_id):
    """获取、更新或删除课程"""
    user = request.current_user
    
    try:
        course = Course.query.filter_by(id=course_id, user_id=user.id).first()
        
        if not course:
            return jsonify({'error': '课程不存在或无权限访问'}), 404
        
        if request.method == 'GET':
            return jsonify({'course': course.to_dict()}), 200
        
        if request.method == 'PUT':
            data = request.json
            
            # 更新字段
            if 'course_name' in data:
                course.course_name = data['course_name']
            if 'instructor' in data:
                course.instructor = data.get('instructor', '')
            if 'location' in data:
                course.location = data.get('location', '')
            if 'day_of_week' in data:
                day_of_week = data['day_of_week']
                if not isinstance(day_of_week, int) or day_of_week < 0 or day_of_week > 6:
                    return jsonify({'error': 'day_of_week必须是0-6之间的整数'}), 400
                course.day_of_week = day_of_week
            if 'start_time' in data:
                course.start_time = parse_time(data['start_time'])
            if 'end_time' in data:
                course.end_time = parse_time(data['end_time'])
            
            # 验证时间逻辑
            if course.start_time >= course.end_time:
                return jsonify({'error': '开始时间必须早于结束时间'}), 400
            
            db.session.commit()
            
            return jsonify({
                'message': '课程更新成功',
                'course': course.to_dict()
            }), 200
        
        if request.method == 'DELETE':
            db.session.delete(course)
            db.session.commit()
            
            return jsonify({'message': '课程删除成功'}), 200
            
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'操作失败: {str(e)}'}), 500


@bp.route('/import', methods=['POST'])
@login_required
def import_courses():
    """
    导入课程（支持CSV格式）
    
    CSV格式要求：
    course_name,instructor,location,day_of_week,start_time,end_time
    线性代数,熊波,教学楼A101,1,08:00,09:40
    大学物理,艾汉华,教学楼B202,1,10:00,11:40
    
    day_of_week: 0=周日, 1=周一, ..., 6=周六
    time格式: HH:MM 或 HH:MM:SS
    """
    user = request.current_user
    
    try:
        # 检查是否有文件
        if 'file' not in request.files:
            # 如果没有文件，尝试从JSON数据中读取
            data = request.json
            if not data or 'courses' not in data:
                return jsonify({'error': '请提供文件或课程数据'}), 400
            
            courses_data = data['courses']
            imported_count = 0
            errors = []
            
            for idx, course_data in enumerate(courses_data):
                try:
                    # 验证必填字段
                    required_fields = ['course_name', 'day_of_week', 'start_time', 'end_time']
                    if not all(course_data.get(field) is not None for field in required_fields):
                        errors.append(f'第{idx+1}行：缺少必要字段')
                        continue
                    
                    # 解析时间
                    start_time = parse_time(course_data['start_time'])
                    end_time = parse_time(course_data['end_time'])
                    
                    # 验证day_of_week
                    day_of_week = int(course_data['day_of_week'])
                    if day_of_week < 0 or day_of_week > 6:
                        errors.append(f'第{idx+1}行：day_of_week必须是0-6')
                        continue
                    
                    # 验证时间逻辑
                    if start_time >= end_time:
                        errors.append(f'第{idx+1}行：开始时间必须早于结束时间')
                        continue
                    
                    # 创建课程
                    course = Course(
                        user_id=user.id,
                        course_name=course_data['course_name'],
                        instructor=course_data.get('instructor', ''),
                        location=course_data.get('location', ''),
                        day_of_week=day_of_week,
                        start_time=start_time,
                        end_time=end_time
                    )
                    
                    db.session.add(course)
                    imported_count += 1
                    
                except Exception as e:
                    errors.append(f'第{idx+1}行：{str(e)}')
                    continue
            
            db.session.commit()
            
            return jsonify({
                'message': f'成功导入{imported_count}门课程',
                'imported_count': imported_count,
                'errors': errors if errors else None
            }), 201
        
        # 处理文件上传
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '未选择文件'}), 400
        
        # 检查文件格式
        if not file.filename.endswith(('.csv', '.txt')):
            return jsonify({'error': '只支持CSV或TXT格式文件'}), 400
        
        # 读取文件内容
        file_content = file.read().decode('utf-8-sig')  # 使用utf-8-sig处理BOM
        csv_reader = csv.DictReader(io.StringIO(file_content))
        
        imported_count = 0
        errors = []
        
        for idx, row in enumerate(csv_reader, start=2):  # 从第2行开始（第1行是标题）
            try:
                # 验证必填字段
                if not row.get('course_name') or not row.get('day_of_week') or not row.get('start_time') or not row.get('end_time'):
                    errors.append(f'第{idx}行：缺少必要字段')
                    continue
                
                # 解析时间
                start_time = parse_time(row['start_time'].strip())
                end_time = parse_time(row['end_time'].strip())
                
                # 验证day_of_week
                try:
                    day_of_week = int(row['day_of_week'].strip())
                except ValueError:
                    errors.append(f'第{idx}行：day_of_week必须是整数')
                    continue
                
                if day_of_week < 0 or day_of_week > 6:
                    errors.append(f'第{idx}行：day_of_week必须是0-6')
                    continue
                
                # 验证时间逻辑
                if start_time >= end_time:
                    errors.append(f'第{idx}行：开始时间必须早于结束时间')
                    continue
                
                # 创建课程
                course = Course(
                    user_id=user.id,
                    course_name=row['course_name'].strip(),
                    instructor=row.get('instructor', '').strip(),
                    location=row.get('location', '').strip(),
                    day_of_week=day_of_week,
                    start_time=start_time,
                    end_time=end_time
                )
                
                db.session.add(course)
                imported_count += 1
                
            except Exception as e:
                errors.append(f'第{idx}行：{str(e)}')
                continue
        
        db.session.commit()
        
        return jsonify({
            'message': f'成功导入{imported_count}门课程',
            'imported_count': imported_count,
            'errors': errors if errors else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'导入失败: {str(e)}'}), 500

