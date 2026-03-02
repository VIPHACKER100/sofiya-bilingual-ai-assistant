import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

from config import DATA_DIR
from utils.logger import logger


@dataclass
class ConversationEntry:
    """Single conversation entry"""
    id: Optional[int] = None
    timestamp: str = ""
    user_input: str = ""
    sofiya_response: str = ""
    command_type: str = ""
    success: bool = True
    context: str = ""  # JSON string of context data
    language: str = "en"
    session_id: str = ""


@dataclass
class MemoryEntry:
    """User memory/fact storage"""
    id: Optional[int] = None
    key: str = ""  # e.g., "favorite_color", "boss_name"
    value: str = ""
    category: str = "general"  # e.g., "preferences", "contacts", "facts"
    created_at: str = ""
    updated_at: str = ""
    confidence: float = 1.0  # 0.0 to 1.0
    source: str = ""  # How this was learned


class MemoryManager:
    """Manage conversation history and user memory"""

    def __init__(self):
        self.db_path = DATA_DIR / "memory.db"
        self._init_database()

    def _init_database(self):
        """Initialize SQLite database with tables"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            # Conversations table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    user_input TEXT NOT NULL,
                    sofiya_response TEXT NOT NULL,
                    command_type TEXT,
                    success BOOLEAN DEFAULT 1,
                    context TEXT,
                    language TEXT DEFAULT 'en',
                    session_id TEXT
                )
            ''')

            # Memory/facts table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS memory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE NOT NULL,
                    value TEXT NOT NULL,
                    category TEXT DEFAULT 'general',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    confidence REAL DEFAULT 1.0,
                    source TEXT
                )
            ''')

            # Sessions table for tracking conversation sessions
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT UNIQUE NOT NULL,
                    started_at TEXT NOT NULL,
                    ended_at TEXT,
                    command_count INTEGER DEFAULT 0,
                    metadata TEXT
                )
            ''')

            # Create indexes for faster queries
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_conversations_timestamp
                ON conversations(timestamp)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_conversations_session
                ON conversations(session_id)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_memory_category
                ON memory(category)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_memory_key
                ON memory(key)
            ''')

            conn.commit()
            conn.close()
            logger.info("Memory database initialized successfully")

        except Exception as e:
            logger.error(f"Error initializing memory database: {e}")

    def save_conversation(self, entry: ConversationEntry) -> bool:
        """Save a conversation entry"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            if not entry.timestamp:
                entry.timestamp = datetime.now().isoformat()

            cursor.execute('''
                INSERT INTO conversations
                (timestamp, user_input, sofiya_response, command_type, success, context, language, session_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                entry.timestamp,
                entry.user_input,
                entry.sofiya_response,
                entry.command_type,
                entry.success,
                entry.context,
                entry.language,
                entry.session_id
            ))

            conn.commit()
            entry.id = cursor.lastrowid
            conn.close()

            logger.info(f"Saved conversation entry: {entry.id}")
            return True

        except Exception as e:
            logger.error(f"Error saving conversation: {e}")
            return False

    def get_recent_conversations(
            self,
            limit: int = 10,
            session_id: str = None) -> List[ConversationEntry]:
        """Get recent conversation history"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            if session_id:
                cursor.execute('''
                    SELECT * FROM conversations
                    WHERE session_id = ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                ''', (session_id, limit))
            else:
                cursor.execute('''
                    SELECT * FROM conversations
                    ORDER BY timestamp DESC
                    LIMIT ?
                ''', (limit,))

            rows = cursor.fetchall()
            conn.close()

            entries = []
            for row in rows:
                entry = ConversationEntry(
                    id=row[0],
                    timestamp=row[1],
                    user_input=row[2],
                    sofiya_response=row[3],
                    command_type=row[4],
                    success=bool(row[5]),
                    context=row[6],
                    language=row[7],
                    session_id=row[8]
                )
                entries.append(entry)

            return entries

        except Exception as e:
            logger.error(f"Error getting conversations: {e}")
            return []

    def search_conversations(
            self,
            query: str,
            limit: int = 10) -> List[ConversationEntry]:
        """Search conversation history"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            search_term = f"%{query}%"
            cursor.execute('''
                SELECT * FROM conversations
                WHERE user_input LIKE ? OR sofiya_response LIKE ?
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (search_term, search_term, limit))

            rows = cursor.fetchall()
            conn.close()

            entries = []
            for row in rows:
                entry = ConversationEntry(
                    id=row[0],
                    timestamp=row[1],
                    user_input=row[2],
                    sofiya_response=row[3],
                    command_type=row[4],
                    success=bool(row[5]),
                    context=row[6],
                    language=row[7],
                    session_id=row[8]
                )
                entries.append(entry)

            return entries

        except Exception as e:
            logger.error(f"Error searching conversations: {e}")
            return []

    def get_conversation_stats(self, days: int = 7) -> Dict:
        """Get conversation statistics"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            since = (datetime.now() - timedelta(days=days)).isoformat()

            # Total conversations
            cursor.execute('''
                SELECT COUNT(*) FROM conversations
                WHERE timestamp > ?
            ''', (since,))
            total = cursor.fetchone()[0]

            # Successful commands
            cursor.execute('''
                SELECT COUNT(*) FROM conversations
                WHERE timestamp > ? AND success = 1
            ''', (since,))
            successful = cursor.fetchone()[0]

            # Command types breakdown
            cursor.execute('''
                SELECT command_type, COUNT(*) as count
                FROM conversations
                WHERE timestamp > ?
                GROUP BY command_type
                ORDER BY count DESC
            ''', (since,))
            command_types = {row[0]: row[1] for row in cursor.fetchall()}

            # Language distribution
            cursor.execute('''
                SELECT language, COUNT(*) as count
                FROM conversations
                WHERE timestamp > ?
                GROUP BY language
            ''', (since,))
            languages = {row[0]: row[1] for row in cursor.fetchall()}

            conn.close()

            return {
                "total_conversations": total,
                "successful_commands": successful,
                "success_rate": (successful / total * 100) if total > 0 else 0,
                "command_types": command_types,
                "languages": languages,
                "period_days": days
            }

        except Exception as e:
            logger.error(f"Error getting conversation stats: {e}")
            return {}

    def save_memory(self, entry: MemoryEntry) -> bool:
        """Save a memory/fact about the user"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            now = datetime.now().isoformat()

            # Check if key already exists
            cursor.execute('SELECT id FROM memory WHERE key = ?', (entry.key,))
            existing = cursor.fetchone()

            if existing:
                # Update existing
                cursor.execute('''
                    UPDATE memory
                    SET value = ?, updated_at = ?, confidence = ?, source = ?
                    WHERE key = ?
                ''', (entry.value, now, entry.confidence, entry.source, entry.key))
            else:
                # Insert new
                if not entry.created_at:
                    entry.created_at = now
                if not entry.updated_at:
                    entry.updated_at = now

                cursor.execute('''
                    INSERT INTO memory
                    (key, value, category, created_at, updated_at, confidence, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    entry.key,
                    entry.value,
                    entry.category,
                    entry.created_at,
                    entry.updated_at,
                    entry.confidence,
                    entry.source
                ))

            conn.commit()
            conn.close()

            logger.info(f"Saved memory: {entry.key} = {entry.value}")
            return True

        except Exception as e:
            logger.error(f"Error saving memory: {e}")
            return False

    def get_memory(self, key: str) -> Optional[MemoryEntry]:
        """Get a specific memory entry"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            cursor.execute('SELECT * FROM memory WHERE key = ?', (key,))
            row = cursor.fetchone()
            conn.close()

            if row:
                return MemoryEntry(
                    id=row[0],
                    key=row[1],
                    value=row[2],
                    category=row[3],
                    created_at=row[4],
                    updated_at=row[5],
                    confidence=row[6],
                    source=row[7]
                )
            return None

        except Exception as e:
            logger.error(f"Error getting memory: {e}")
            return None

    def get_memories_by_category(self, category: str) -> List[MemoryEntry]:
        """Get all memories in a category"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            cursor.execute('''
                SELECT * FROM memory
                WHERE category = ?
                ORDER BY updated_at DESC
            ''', (category,))

            rows = cursor.fetchall()
            conn.close()

            entries = []
            for row in rows:
                entry = MemoryEntry(
                    id=row[0],
                    key=row[1],
                    value=row[2],
                    category=row[3],
                    created_at=row[4],
                    updated_at=row[5],
                    confidence=row[6],
                    source=row[7]
                )
                entries.append(entry)

            return entries

        except Exception as e:
            logger.error(f"Error getting memories by category: {e}")
            return []

    def search_memory(self, query: str) -> List[MemoryEntry]:
        """Search memory entries"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            search_term = f"%{query}%"
            cursor.execute('''
                SELECT * FROM memory
                WHERE key LIKE ? OR value LIKE ?
                ORDER BY confidence DESC, updated_at DESC
            ''', (search_term, search_term))

            rows = cursor.fetchall()
            conn.close()

            entries = []
            for row in rows:
                entry = MemoryEntry(
                    id=row[0],
                    key=row[1],
                    value=row[2],
                    category=row[3],
                    created_at=row[4],
                    updated_at=row[5],
                    confidence=row[6],
                    source=row[7]
                )
                entries.append(entry)

            return entries

        except Exception as e:
            logger.error(f"Error searching memory: {e}")
            return []

    def delete_memory(self, key: str) -> bool:
        """Delete a memory entry"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            cursor.execute('DELETE FROM memory WHERE key = ?', (key,))
            conn.commit()
            conn.close()

            logger.info(f"Deleted memory: {key}")
            return True

        except Exception as e:
            logger.error(f"Error deleting memory: {e}")
            return False

    def start_session(self, session_id: str) -> bool:
        """Start a new conversation session"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            cursor.execute('''
                INSERT INTO sessions (session_id, started_at, command_count)
                VALUES (?, ?, 0)
            ''', (session_id, datetime.now().isoformat()))

            conn.commit()
            conn.close()

            logger.info(f"Started session: {session_id}")
            return True

        except Exception as e:
            logger.error(f"Error starting session: {e}")
            return False

    def end_session(self, session_id: str) -> bool:
        """End a conversation session"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            # Count commands in session
            cursor.execute('''
                SELECT COUNT(*) FROM conversations WHERE session_id = ?
            ''', (session_id,))
            count = cursor.fetchone()[0]

            cursor.execute('''
                UPDATE sessions
                SET ended_at = ?, command_count = ?
                WHERE session_id = ?
            ''', (datetime.now().isoformat(), count, session_id))

            conn.commit()
            conn.close()

            logger.info(f"Ended session: {session_id} with {count} commands")
            return True

        except Exception as e:
            logger.error(f"Error ending session: {e}")
            return False

    def cleanup_old_data(self, days: int = 30) -> int:
        """Remove old conversation data"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            cutoff = (datetime.now() - timedelta(days=days)).isoformat()

            cursor.execute('''
                DELETE FROM conversations WHERE timestamp < ?
            ''', (cutoff,))

            deleted = cursor.rowcount
            conn.commit()
            conn.close()

            logger.info(f"Cleaned up {deleted} old conversation entries")
            return deleted

        except Exception as e:
            logger.error(f"Error cleaning up old data: {e}")
            return 0


# Singleton instance
memory_manager = MemoryManager()
