"""
Migration script to add image_url column to articles table.
Run this once to update your existing database.

Usage:
    python migrate_add_image_url.py
    # or
    python migrate_add_image_url.py --db-path path/to/news_iq.db
"""
import sqlite3
import sys
from pathlib import Path

def migrate_database(db_path: str):
    """Add image_url column to articles table if it doesn't exist."""
    print(f"Connecting to database: {db_path}")
    
    if not Path(db_path).exists():
        print(f"✗ Database file not found: {db_path}")
        print("  The database will be created automatically on first run.")
        return
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(articles)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "image_url" in columns:
            print("✓ Column 'image_url' already exists. No migration needed.")
        else:
            print("Adding 'image_url' column to articles table...")
            cursor.execute("ALTER TABLE articles ADD COLUMN image_url VARCHAR(512)")
            conn.commit()
            print("✓ Successfully added 'image_url' column!")
    except sqlite3.Error as e:
        print(f"✗ Error: {e}")
        conn.rollback()
    finally:
        conn.close()
    
    print("Migration complete.")

if __name__ == "__main__":
    # Default database path
    if len(sys.argv) > 1 and sys.argv[1] == "--db-path":
        db_path = sys.argv[2]
    else:
        # Default to news_iq.db in the backend directory
        db_path = Path(__file__).parent / "news_iq.db"
    
    migrate_database(str(db_path))
