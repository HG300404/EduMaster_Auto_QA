import os
import sys
import time
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

# Add backend to path to import models if needed
sys.path.append('/app/backend')

DATABASE_URL = os.getenv('DATABASE_URL')

def wait_for_db(engine, timeout=30):
    start_time = time.time()
    while True:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                return True
        except OperationalError:
            if time.time() - start_time > timeout:
                return False
            time.sleep(1)

def run_migrations():
    print(f"Connecting to database at {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    if not wait_for_db(engine):
        print("Error: Database connection timed out.")
        sys.exit(1)
        
    print("Database is ready. Running migrations...")
    
    import subprocess
    
    # Environment variables for Flask
    env = os.environ.copy()
    env['FLASK_APP'] = '/app/backend/app:create_app()'
    if DATABASE_URL:
        env['DATABASE_URL'] = DATABASE_URL
    
    try:
        # Check if backend directory is accessible
        if os.path.exists('/app/backend/migrations'):
            print("Alembic migrations found. Running 'flask db upgrade'...")
            # We need to be in the backend directory OR specify it
            result = subprocess.run(
                ["flask", "db", "upgrade"], 
                cwd="/app/backend",
                env=env,
                capture_output=True,
                text=True
            )
            print(result.stdout)
            if result.returncode != 0:
                print(f"Migration failed: {result.stderr}")
                # Fallback to create_all if migrations fail or table doesn't exist
                print("Attempting fallback to create_all()...")
                from backend.app import create_app, db
                app = create_app()
                with app.app_context():
                    db.create_all()
        else:
            print("No migrations found directory. Falling back to create_all().")
            from backend.app import create_app, db
            app = create_app()
            with app.app_context():
                db.create_all()
            
        print("Migrations/Schema creation completed.")
    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migrations()
