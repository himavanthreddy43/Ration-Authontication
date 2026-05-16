import os
import json
import base64
import uuid
import tempfile
import logging
from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify, request, send_from_directory
from sqlalchemy.exc import IntegrityError
from models import db, Family, FamilyMember, FaceData, MonthlyRation, RationShop, FailedScanLog
import face_utils

logger = logging.getLogger(__name__)
api_bp = Blueprint('api', __name__)

# IST timezone offset (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@api_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

def save_base64_image_permanent(base64_str: str, filename: str) -> str:
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]
    img_data = base64.b64decode(base64_str)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    with open(filepath, 'wb') as f:
        f.write(img_data)
    return filepath

def save_base64_image_temp(base64_str: str) -> str:
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]
    img_data = base64.b64decode(base64_str)
    fd, temp_path = tempfile.mkstemp(suffix='.jpg')
    with os.fdopen(fd, 'wb') as f:
        f.write(img_data)
    return temp_path

FACE_CACHE = []
CACHE_INITIALIZED = False

def refresh_face_cache():
    global FACE_CACHE, CACHE_INITIALIZED
    try:
        all_faces = FaceData.query.all()
        new_cache = []
        for face in all_faces:
            try:
                emb = json.loads(face.face_embedding_vector)
                new_cache.append({
                    'face_id': face.face_id,
                    'member_id': face.member_id,
                    'family_id': face.family_id,
                    'embedding': emb
                })
            except Exception as e:
                logger.error(f"Error parsing face embedding {face.face_id}: {e}")
        FACE_CACHE = new_cache
        CACHE_INITIALIZED = True
        logger.info(f"Face cache refreshed with {len(FACE_CACHE)} faces.")
    except Exception as e:
        logger.error(f"Failed to refresh face cache: {e}")

@api_bp.route('/family/register', methods=['POST'])
def register_family():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid request payload"}), 400
        
    try:
        new_family = Family(
            head_of_family_name=data.get('head_name'),
            ration_card_number=data.get('ration_card_number'),
            family_members_count=len(data.get('members', [])),
            village_name=data.get('village_name'),
            phone_number=data.get('phone_number'),
            address=data.get('address')
        )
        db.session.add(new_family)
        db.session.flush() # To get family_id
        
        for member in data.get('members', []):
            new_member = FamilyMember(
                family_id=new_family.family_id,
                member_name=member.get('name'),
                gender=member.get('gender'),
                # Add defensive int casting
                age=int(member.get('age', 0)) if str(member.get('age', '0')).isdigit() else None,
                relationship=member.get('relationship'),
                is_default_member=member.get('is_default_member', False)
            )
            db.session.add(new_member)
            db.session.flush() # To get member_id
            
            # Phase 2: Handle multiple images per person
            images = member.get('images', [])
            if 'image' in member and not images:
                images = [member['image']]
                
            if not images:
                raise ValueError(f"At least one image required for {member.get('name')}")
            
            valid_face_found = False
            for idx, img_b64 in enumerate(images):
                filename = f"{new_family.family_id}_{new_member.member_id}_{uuid.uuid4().hex}.jpg"
                filepath = save_base64_image_permanent(img_b64, filename)
                
                embedding = face_utils.extract_embedding(filepath)
                if embedding is not None:
                    valid_face_found = True
                    face_data = FaceData(
                        member_id=new_member.member_id,
                        family_id=new_family.family_id,
                        face_embedding_vector=json.dumps(embedding),
                        face_image_path=filepath
                    )
                    db.session.add(face_data)
                else:
                    logger.warning(f"No face detected in image {idx+1} for member {new_member.member_name}")
                    
            if not valid_face_found:
                raise ValueError(f"No valid faces detected in any of the provided images for {member.get('name')}")
                
        db.session.commit()
        refresh_face_cache()
        logger.info(f"Family registered successfully with ID: {new_family.family_id}")
        return jsonify({"message": "Family registered successfully", "id": new_family.family_id}), 201
        
    except ValueError as ve:
        db.session.rollback()
        logger.warning(f"Validation error during registration: {ve}")
        return jsonify({"error": str(ve)}), 400
    except IntegrityError as ie:
        db.session.rollback()
        logger.warning(f"Database integrity error: {ie}")
        return jsonify({"error": "A family with this ration card number is already registered. Please use a different ration card number."}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Unexpected error during registration: {e}", exc_info=True)
        return jsonify({"error": f"Failed to register family: {str(e)}"}), 500

@api_bp.route('/recognize', methods=['POST'])
def recognize():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid request payload"}), 400
        
    base64_img = data.get('image')
    if not base64_img:
        return jsonify({"error": "No image provided"}), 400
        
    temp_path = save_base64_image_temp(base64_img)
    try:
        scanned_embedding = face_utils.extract_embedding(temp_path)
        if scanned_embedding is None:
            import shutil
            failed_filename = f"failed_noface_{uuid.uuid4().hex}.jpg"
            shutil.copy(temp_path, os.path.join(UPLOAD_FOLDER, failed_filename))
            failed_log = FailedScanLog(image_path=failed_filename, reason="No face detected in image")
            db.session.add(failed_log)
            db.session.commit()
            return jsonify({"error": "No face detected in the provided image"}), 400
            
        global CACHE_INITIALIZED
        if not CACHE_INITIALIZED:
            refresh_face_cache()
            
        matched_member_id = None
        matched_family_id = None
        best_distance = float('inf')
        
        for cached_face in FACE_CACHE:
            saved_embedding = cached_face['embedding']
            is_match, distance = face_utils.compare_embeddings(scanned_embedding, saved_embedding)
            if is_match and distance < best_distance:
                best_distance = distance
                matched_member_id = cached_face['member_id']
                matched_family_id = cached_face['family_id']
                
        if matched_member_id:
            family = Family.query.get(matched_family_id)
            member = FamilyMember.query.get(matched_member_id)
            
            if not family or not member:
                return jsonify({"error": "Data internal consistency error. Family or member not found."}), 500
            
            # Check attendance (Phase 5)
            # Use timezone aware datetimes using timezone.utc
            now = datetime.now(timezone.utc)
            current_month = now.month
            current_year = now.year
            
            existing_ration = MonthlyRation.query.filter_by(
                family_id=family.family_id,
                month=current_month,
                year=current_year
            ).first()
            
            already_received = existing_ration is not None and existing_ration.received_status
            
            logger.info(f"Face recognized mapping to family_id {family.family_id}, member {member.member_name}")
            return jsonify({
                "family_id": family.family_id,
                "head_name": family.head_of_family_name,
                "ration_card_number": family.ration_card_number,
                "members_count": family.family_members_count,
                "recognized_member": member.member_name,
                "already_received_this_month": already_received,
                "rice_quantity_kg": family.family_members_count * 6
            }), 200
                
        import shutil
        failed_filename = f"failed_nomatch_{uuid.uuid4().hex}.jpg"
        shutil.copy(temp_path, os.path.join(UPLOAD_FOLDER, failed_filename))
        failed_log = FailedScanLog(image_path=failed_filename, reason="No matching family member found in database")
        db.session.add(failed_log)
        db.session.commit()
        return jsonify({"error": "No matching family member found in the database"}), 404
        
    except Exception as e:
        logger.error(f"Error during facial recognition: {e}", exc_info=True)
        return jsonify({"error": "Internal server error during recognition"}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@api_bp.route('/family/<int:family_id>/mark_ration', methods=['POST'])
def mark_ration(family_id):
    family = Family.query.get_or_404(family_id)
    now = datetime.now(timezone.utc)
    current_month = now.month
    current_year = now.year
    
    try:
        existing_ration = MonthlyRation.query.filter_by(
            family_id=family.family_id,
            month=current_month,
            year=current_year
        ).first()
        
        if existing_ration and existing_ration.received_status:
            return jsonify({"error": "Ration already collected this month"}), 400
            
        if not existing_ration:
            existing_ration = MonthlyRation(
                family_id=family.family_id,
                month=current_month,
                year=current_year,
                received_status=True,
                received_time=now
            )
            db.session.add(existing_ration)
        else:
            existing_ration.received_status = True
            existing_ration.received_time = now
            
        db.session.commit()
        logger.info(f"Ration successfully marked for family_id {family.family_id}")
        return jsonify({"message": "Ration marked successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to mark ration for family_id {family.family_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to mark ration due to internal error"}), 500

@api_bp.route('/stats', methods=['GET'])
def get_stats():
    try:
        total_families = Family.query.count()
        now = datetime.now(timezone.utc)
        current_month = now.month
        current_year = now.year
        
        distributed = MonthlyRation.query.filter_by(
            month=current_month,
            year=current_year,
            received_status=True
        ).count()
        
        today_start = datetime(current_year, current_month, now.day)
        
        # Auto-cleanup old failed scans (older than today)
        old_logs = FailedScanLog.query.filter(FailedScanLog.timestamp < today_start).all()
        if old_logs:
            for log in old_logs:
                if log.image_path:
                    filepath = os.path.join(UPLOAD_FOLDER, log.image_path)
                    if os.path.exists(filepath):
                        try:
                            os.remove(filepath)
                        except OSError:
                            pass
                db.session.delete(log)
            db.session.commit()
            
        failed_today = FailedScanLog.query.filter(FailedScanLog.timestamp >= today_start).count()
        
        return jsonify({
            "total_families": total_families,
            "distributed_this_month": distributed,
            "pending_this_month": max(0, total_families - distributed),
            "failed_today": failed_today
        })
    except Exception as e:
        logger.error(f"Failed to fetch stats: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch stats"}), 500

@api_bp.route('/dashboard_data', methods=['GET'])
def get_dashboard_data():
    try:
        import calendar as cal_module
        now = datetime.now(timezone.utc)
        now_ist = now.astimezone(IST)
        
        def to_ist_str(dt):
            """Convert a datetime to IST formatted time string."""
            if dt is None:
                return ""
            if dt.tzinfo is None:
                # Naive datetime assumed UTC
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(IST).strftime("%I:%M %p")
        
        # 1. Recent Activity
        activities = []
        
        recent_rations = MonthlyRation.query.filter_by(received_status=True).order_by(MonthlyRation.received_time.desc()).limit(10).all()
        for r in recent_rations:
            if r.received_time and r.family_ref:
                activities.append({
                    "time": to_ist_str(r.received_time),
                    "timestamp": r.received_time.timestamp(),
                    "action": "Ration Collected",
                    "family": r.family_ref.head_of_family_name,
                    "members": r.family_ref.family_members_count,
                    "status": "success"
                })
                
        recent_families = Family.query.order_by(Family.created_at.desc()).limit(10).all()
        for f in recent_families:
            if f.created_at:
                activities.append({
                    "time": to_ist_str(f.created_at),
                    "timestamp": f.created_at.timestamp(),
                    "action": "Family Registered",
                    "family": f.head_of_family_name,
                    "members": f.family_members_count,
                    "status": "info"
                })
                
        # Sort combined activities by timestamp descending
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        top_activities = activities[:5]
        for a in top_activities:
            del a['timestamp'] # Clean up
            
        # 2. Monthly Calendar Data
        current_month = now_ist.month
        current_year = now_ist.year
        days_in_month = cal_module.monthrange(current_year, current_month)[1]
        first_weekday = cal_module.monthrange(current_year, current_month)[0]  # 0=Monday

        # Get all rations for current month
        month_rations = MonthlyRation.query.filter(
            MonthlyRation.received_status == True,
            MonthlyRation.month == current_month,
            MonthlyRation.year == current_year,
            MonthlyRation.received_time.isnot(None)
        ).all()

        # Build day -> list of families mapping
        calendar_data = {}
        for day in range(1, days_in_month + 1):
            calendar_data[str(day)] = []

        distributed_kg = 0
        for r in month_rations:
            if r.received_time and r.family_ref:
                # Convert stored UTC time to IST for correct day mapping
                ist_time = r.received_time
                if ist_time.tzinfo is None:
                    ist_time = ist_time.replace(tzinfo=timezone.utc)
                ist_time = ist_time.astimezone(IST)
                day_num = ist_time.day
                calendar_data[str(day_num)].append({
                    "family": r.family_ref.head_of_family_name,
                    "members": r.family_ref.family_members_count,
                    "time": ist_time.strftime("%I:%M %p")
                })
                distributed_kg += r.family_ref.family_members_count * 6

        # 3. Stock Summary
        all_families = Family.query.all()
        total_stock_kg = sum(f.family_members_count for f in all_families) * 6
        balance_kg = max(0, total_stock_kg - distributed_kg)

        return jsonify({
            "recentActivity": top_activities,
            "calendarData": calendar_data,
            "currentMonth": current_month,
            "currentYear": current_year,
            "daysInMonth": days_in_month,
            "firstWeekday": first_weekday,
            "today": now_ist.day,
            "stockSummary": {
                "total_stock_kg": total_stock_kg,
                "distributed_kg": distributed_kg,
                "balance_kg": balance_kg
            }
        })
    except Exception as e:
        logger.error(f"Failed to fetch dashboard data: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch dashboard data"}), 500

@api_bp.route('/dashboard/details', methods=['GET'])
def get_dashboard_details():
    try:
        list_type = request.args.get('type')
        now = datetime.now(timezone.utc)
        current_month = now.month
        current_year = now.year

        if list_type == 'total':
            families = Family.query.all()
            return jsonify([{"id": f.family_id, "head": f.head_of_family_name, "rc": f.ration_card_number, "members": f.family_members_count, "phone": f.phone_number} for f in families])
            
        elif list_type == 'distributed':
            distributed = MonthlyRation.query.filter_by(month=current_month, year=current_year, received_status=True).all()
            family_ids = [r.family_id for r in distributed]
            families = Family.query.filter(Family.family_id.in_(family_ids)).all()
            return jsonify([{"id": f.family_id, "head": f.head_of_family_name, "rc": f.ration_card_number, "members": f.family_members_count, "phone": f.phone_number} for f in families])
            
        elif list_type == 'pending':
            distributed = MonthlyRation.query.filter_by(month=current_month, year=current_year, received_status=True).all()
            family_ids = [r.family_id for r in distributed]
            if family_ids:
                families = Family.query.filter(~Family.family_id.in_(family_ids)).all()
            else:
                families = Family.query.all()
            return jsonify([{"id": f.family_id, "head": f.head_of_family_name, "rc": f.ration_card_number, "members": f.family_members_count, "phone": f.phone_number} for f in families])
            
        elif list_type == 'failed':
            logs = FailedScanLog.query.order_by(FailedScanLog.timestamp.desc()).all()
            return jsonify([{
                "id": log.log_id,
                "reason": log.reason,
                "time": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "image_url": f"http://localhost:5000/api/uploads/{log.image_path}" if log.image_path else None
            } for log in logs])
            
        return jsonify({"error": "Invalid type"}), 400
    except Exception as e:
        logger.error(f"Failed to fetch dashboard details: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch dashboard details"}), 500

# CRUD for Families and Members
@api_bp.route('/families', methods=['GET'])
def get_families():
    try:
        families = Family.query.all()
        result = []
        for family in families:
            members_data = []
            for member in family.members:
                image_data = [{"face_id": face.face_id, "url": f"http://localhost:5000/api/uploads/{os.path.basename(face.face_image_path)}"} for face in member.faces]
                members_data.append({
                    "member_id": member.member_id,
                    "name": member.member_name,
                    "gender": member.gender,
                    "age": member.age,
                    "relationship": member.relationship,
                    "images": image_data
                })
            
            result.append({
                "family_id": family.family_id,
                "head_name": family.head_of_family_name,
                "ration_card_number": family.ration_card_number,
                "village_name": family.village_name,
                "phone_number": family.phone_number,
                "address": family.address,
                "members": members_data
            })
            
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Failed to fetch families: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch families"}), 500

@api_bp.route('/families/<int:family_id>', methods=['PUT'])
def update_family(family_id):
    try:
        family = Family.query.get_or_404(family_id)
        data = request.json
        
        if 'head_name' in data: family.head_of_family_name = data['head_name']
        if 'ration_card_number' in data: family.ration_card_number = data['ration_card_number']
        if 'village_name' in data: family.village_name = data['village_name']
        if 'phone_number' in data: family.phone_number = data['phone_number']
        if 'address' in data: family.address = data['address']
        
        db.session.commit()
        return jsonify({"message": "Family updated successfully"}), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Ration card number already exists"}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to update family: {e}", exc_info=True)
        return jsonify({"error": "Failed to update family"}), 500

@api_bp.route('/families/<int:family_id>', methods=['DELETE'])
def delete_family(family_id):
    try:
        family = Family.query.get_or_404(family_id)
        
        # Manually remove face images associated with this family from the uploads folder
        for member in family.members:
            for face in member.faces:
                if os.path.exists(face.face_image_path):
                    try:
                        os.remove(face.face_image_path)
                    except OSError:
                        pass
                        
        db.session.delete(family)
        db.session.commit()
        refresh_face_cache()
        return jsonify({"message": "Family and all related data deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to delete family: {e}", exc_info=True)
        return jsonify({"error": "Failed to delete family"}), 500

@api_bp.route('/family_members/<int:member_id>', methods=['PUT'])
def update_family_member(member_id):
    try:
        member = FamilyMember.query.get_or_404(member_id)
        data = request.json
        
        if 'name' in data: member.member_name = data['name']
        if 'gender' in data: member.gender = data['gender']
        if 'age' in data: 
            age_val = str(data['age'])
            if age_val.isdigit():
                member.age = int(age_val)
        if 'relationship' in data: member.relationship = data['relationship']
        
        db.session.commit()
        return jsonify({"message": "Member updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to update member: {e}", exc_info=True)
        return jsonify({"error": "Failed to update member"}), 500

@api_bp.route('/face/<int:face_id>', methods=['DELETE'])
def delete_face(face_id):
    try:
        face = FaceData.query.get_or_404(face_id)
        if os.path.exists(face.face_image_path):
            try:
                os.remove(face.face_image_path)
            except OSError:
                pass
        db.session.delete(face)
        db.session.commit()
        refresh_face_cache()
        return jsonify({"message": "Face deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to delete face: {e}", exc_info=True)
        return jsonify({"error": "Failed to delete face"}), 500

@api_bp.route('/family_members/<int:member_id>', methods=['DELETE'])
def delete_family_member(member_id):
    try:
        member = FamilyMember.query.get_or_404(member_id)
        family = member.family
        
        # Remove member's face images
        for face in member.faces:
            if os.path.exists(face.face_image_path):
                try:
                    os.remove(face.face_image_path)
                except OSError:
                    pass
                    
        db.session.delete(member)
        # Update family member count
        if family:
            family.family_members_count = max(0, family.family_members_count - 1)
            
        db.session.commit()
        refresh_face_cache()
        return jsonify({"message": "Member deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to delete member: {e}", exc_info=True)
        return jsonify({"error": "Failed to delete member"}), 500

# Phase 6: AI Chatbot API endpoint
@api_bp.route('/family/<int:family_id>/member', methods=['POST'])
def add_family_member(family_id):
    family = Family.query.get_or_404(family_id)
    data = request.json
    
    if not data:
        return jsonify({"error": "Invalid request payload"}), 400
        
    try:
        new_member = FamilyMember(
            family_id=family.family_id,
            member_name=data.get('name'),
            gender=data.get('gender'),
            age=int(data.get('age', 0)) if str(data.get('age', '0')).isdigit() else None,
            relationship=data.get('relationship'),
            is_default_member=data.get('is_default_member', False)
        )
        db.session.add(new_member)
        db.session.flush() # To get member_id
        
        images = data.get('images', [])
        if not images:
            raise ValueError(f"At least one image required for {new_member.member_name}")
            
        valid_face_found = False
        for idx, img_b64 in enumerate(images):
            filename = f"{family.family_id}_{new_member.member_id}_{uuid.uuid4().hex}.jpg"
            filepath = save_base64_image_permanent(img_b64, filename)
            
            embedding = face_utils.extract_embedding(filepath)
            if embedding is not None:
                valid_face_found = True
                face_data = FaceData(
                    member_id=new_member.member_id,
                    family_id=family.family_id,
                    face_embedding_vector=json.dumps(embedding),
                    face_image_path=filepath
                )
                db.session.add(face_data)
            else:
                logger.warning(f"No face detected in image {idx+1} for member {new_member.member_name}")
                
        if not valid_face_found:
            raise ValueError(f"No valid faces detected in any of the provided images for {new_member.member_name}")
            
        family.family_members_count += 1
        db.session.commit()
        refresh_face_cache()
        
        logger.info(f"New member added to family_id {family.family_id} successfully")
        
        return jsonify({
            "message": "Member added successfully",
            "member": {
                "member_id": new_member.member_id,
                "name": new_member.member_name,
                "gender": new_member.gender,
                "age": new_member.age,
                "relationship": new_member.relationship
            }
        }), 201
        
    except ValueError as ve:
        db.session.rollback()
        logger.warning(f"Validation error during member addition: {ve}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Unexpected error during member addition: {e}", exc_info=True)
        return jsonify({"error": f"Failed to add member: {str(e)}"}), 500

@api_bp.route('/family_members/<int:member_id>/face', methods=['POST'])
def add_member_face(member_id):
    member = FamilyMember.query.get_or_404(member_id)
    data = request.json
    
    if not data or 'image' not in data:
        return jsonify({"error": "Image data is required"}), 400
        
    try:
        img_b64 = data['image']
        filename = f"{member.family_id}_{member.member_id}_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        save_base64_image_permanent(img_b64, filename)
        
        embedding = face_utils.extract_embedding(filepath)
        if embedding is None:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({"error": "No face detected in the image"}), 400
            
        face_data = FaceData(
            member_id=member.member_id,
            family_id=member.family_id,
            face_embedding_vector=json.dumps(embedding),
            face_image_path=filepath
        )
        db.session.add(face_data)
        db.session.commit()
        refresh_face_cache()
        
        return jsonify({
            "message": "Face added successfully",
            "face": {
                "face_id": face_data.face_id,
                "url": f"http://localhost:5000/api/uploads/{filename}"
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to add face for member {member_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to process image"}), 500

@api_bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"error": "Valid JSON bearing 'message' key is required."}), 400
        
    user_message = data.get('message', '').lower()
    
    try:
        response = "I'm sorry, I didn't understand that. You can ask me how to register, how to scan face, or how to mark ration."
        if "register" in user_message or "add family" in user_message:
            response = "To register, go to the 'Registration' page. Fill in the family details, then add members. You can capture multiple photos of the member's face for better accuracy before saving."
        elif "scan" in user_message or "recognize" in user_message or "search" in user_message:
            response = "Navigate to the 'Recognition' page. Click 'Scan Face' to turn on your webcam, hold still until your face is detected. The system will retrieve your family ration status."
        elif "ration" in user_message or "mark" in user_message:
            response = "After successfully scanning a face on the Validation page, if the ration for the current month hasn't been collected, a button will appear to 'Mark Ration Collected'."
        elif "hello" in user_message or "hi" in user_message:
            response = "Hello! I am your AI assistant for the Smart Ration App. How can I help you today?"
            
        return jsonify({"response": response})
    except Exception as e:
        logger.error(f"Chatbot processing error: {e}", exc_info=True)
        return jsonify({"error": "Chatbot failed to process message"}), 500
