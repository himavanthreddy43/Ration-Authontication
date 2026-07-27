web: sh -c "if [ -d backend ]; then cd backend; fi; exec gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120"
