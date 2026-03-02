import asyncio
import json
import schedule
import time
from datetime import datetime, timedelta
from threading import Thread
from typing import Dict, List, Optional, Callable, Any, cast
from dataclasses import dataclass, asdict
from pathlib import Path

from config import DATA_DIR
from utils.logger import logger


@dataclass
class ScheduledTask:
    """A scheduled task"""
    id: str
    name: str
    description: str
    command: str  # Command to execute
    schedule_type: str  # 'daily', 'weekly', 'once', 'interval'
    schedule_time: str  # Time in HH:MM format or interval
    # For weekly: ['monday', 'wednesday', etc.]
    days: Optional[List[str]] = None
    enabled: bool = True
    created_at: str = ""
    last_run: str = ""
    run_run: str = ""
    run_count: int = 0
    parameters: Optional[Dict[str, Any]] = None  # Additional parameters


@dataclass
class Macro:
    """A macro - sequence of commands"""
    id: str
    name: str
    description: str
    # List of {command: str, delay: int, parameters: dict}
    commands: List[Dict]
    trigger: str  # 'voice', 'hotkey', 'manual'
    trigger_phrase: str = ""  # Voice trigger phrase
    hotkey: str = ""  # Keyboard shortcut
    enabled: bool = True
    created_at: str = ""
    run_count: int = 0


class AutomationManager:
    """Manage scheduled tasks and macros"""

    def __init__(self):
        self.tasks: Dict[str, ScheduledTask] = {}
        self.macros: Dict[str, Macro] = {}
        self.task_callbacks: Dict[str, Callable] = {}
        self.running: bool = False
        self.scheduler_thread: Optional[Thread] = None
        self._load_data()

    def _load_data(self):
        """Load tasks and macros from file"""
        tasks_file = DATA_DIR / "scheduled_tasks.json"
        macros_file = DATA_DIR / "macros.json"

        if tasks_file.exists():
            try:
                with open(tasks_file, 'r') as f:
                    data = json.load(f)
                    for task_data in data:
                        task = ScheduledTask(**cast(Any, task_data))
                        self.tasks[task.id] = task
                logger.info(f"Loaded {len(self.tasks)} scheduled tasks")
            except Exception as e:
                logger.error(f"Error loading tasks: {e}")

        if macros_file.exists():
            try:
                with open(macros_file, 'r') as f:
                    data = json.load(f)
                    for macro_data in data:
                        macro = Macro(**cast(Any, macro_data))
                        self.macros[macro.id] = macro
                logger.info(f"Loaded {len(self.macros)} macros")
            except Exception as e:
                logger.error(f"Error loading macros: {e}")

    def _save_data(self):
        """Save tasks and macros to file"""
        try:
            tasks_file = DATA_DIR / "scheduled_tasks.json"
            with open(tasks_file, 'w') as f:
                json.dump([asdict(cast(Any, task))
                          for task in self.tasks.values()], f, indent=2)

            macros_file = DATA_DIR / "macros.json"
            with open(macros_file, 'w') as f:
                json.dump([asdict(cast(Any, macro))
                          for macro in self.macros.values()], f, indent=2)

            logger.info("Saved automation data")
        except Exception as e:
            logger.error(f"Error saving automation data: {e}")

    def start_scheduler(self):
        """Start the scheduler in a background thread"""
        if self.running:
            return

        self.running = True
        self.scheduler_thread = Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        logger.info("Automation scheduler started")

    def stop_scheduler(self):
        """Stop the scheduler"""
        self.running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=2)
        logger.info("Automation scheduler stopped")

    def _run_scheduler(self):
        """Run the scheduler loop"""
        # Schedule all enabled tasks
        self._schedule_all_tasks()

        while self.running:
            schedule.run_pending()
            time.sleep(1)

    def _schedule_all_tasks(self):
        """Schedule all enabled tasks"""
        schedule.clear()

        for task in self.tasks.values():
            if task.enabled:
                self._schedule_task(task)

    def _schedule_task(self, task: ScheduledTask):
        """Schedule a single task"""
        try:
            if task.schedule_type == 'daily':
                schedule.every().day.at(task.schedule_time).do(
                    self._execute_task, task.id
                )

            elif task.schedule_type == 'weekly':
                days_map = {
                    'monday': schedule.every().monday,
                    'tuesday': schedule.every().tuesday,
                    'wednesday': schedule.every().wednesday,
                    'thursday': schedule.every().thursday,
                    'friday': schedule.every().friday,
                    'saturday': schedule.every().saturday,
                    'sunday': schedule.every().sunday
                }
                for day in (task.days or []):
                    if day.lower() in days_map:
                        days_map[day.lower()].at(task.schedule_time).do(
                            self._execute_task, task.id
                        )

            elif task.schedule_type == 'interval':
                # Parse interval (e.g., "30" for 30 minutes)
                interval_minutes = int(task.schedule_time)
                schedule.every(interval_minutes).minutes.do(
                    self._execute_task, task.id
                )

            logger.info(f"Scheduled task: {task.name} ({task.schedule_type})")

        except Exception as e:
            logger.error(f"Error scheduling task {task.name}: {e}")

    def _execute_task(self, task_id: str):
        """Execute a scheduled task"""
        task = self.tasks.get(task_id)
        if not task or not task.enabled:
            return

        logger.info(f"Executing scheduled task: {task.name}")

        # Update task stats
        task.last_run = datetime.now().isoformat()
        task.run_count += 1
        self._save_data()

        # Call the callback if registered
        if task_id in self.task_callbacks:
            try:
                callback = self.task_callbacks[task_id]
                callback(task.command, task.parameters)
            except Exception as e:
                logger.error(f"Error executing task callback: {e}")

    def register_task_callback(self, task_id: str, callback: Callable):
        """Register a callback function for a task"""
        self.task_callbacks[task_id] = callback

    def create_task(
            self,
            name: str,
            description: str,
            command: str,
            schedule_type: str,
            schedule_time: str,
            days: List[str] = None,
            parameters: Dict = None,
            enabled: bool = True) -> Optional[ScheduledTask]:
        """Create a new scheduled task"""
        try:
            import uuid
            task_id = str(uuid.uuid4())[:8]

            task = ScheduledTask(
                id=task_id,
                name=name,
                description=description,
                command=command,
                schedule_type=schedule_type,
                schedule_time=schedule_time,
                days=days or [],
                enabled=enabled,
                created_at=datetime.now().isoformat(),
                parameters=parameters or {}
            )

            self.tasks[task_id] = task

            # Schedule if enabled
            if task.enabled:
                self._schedule_task(task)

            self._save_data()

            logger.info(f"Created scheduled task: {name}")
            return task

        except Exception as e:
            logger.error(f"Error creating task: {e}")
            return None

    def update_task(self, task_id: str, **kwargs) -> bool:
        """Update an existing task"""
        if task_id not in self.tasks:
            return False

        try:
            task = self.tasks[task_id]

            for key, value in kwargs.items():
                if hasattr(task, key):
                    setattr(task, key, value)

            # Reschedule if needed
            schedule.clear()
            self._schedule_all_tasks()

            self._save_data()
            logger.info(f"Updated task: {task.name}")
            return True

        except Exception as e:
            logger.error(f"Error updating task: {e}")
            return False

    def delete_task(self, task_id: str) -> bool:
        """Delete a scheduled task"""
        if task_id not in self.tasks:
            return False

        try:
            task = self.tasks.pop(task_id)

            # Reschedule remaining tasks
            schedule.clear()
            self._schedule_all_tasks()

            self._save_data()
            logger.info(f"Deleted task: {task.name}")
            return True

        except Exception as e:
            logger.error(f"Error deleting task: {e}")
            return False

    def get_all_tasks(self) -> List[ScheduledTask]:
        """Get all scheduled tasks"""
        return list(self.tasks.values())

    def get_task(self, task_id: str) -> Optional[ScheduledTask]:
        """Get a specific task"""
        return self.tasks.get(task_id)

    def toggle_task(self, task_id: str) -> bool:
        """Toggle task enabled/disabled"""
        if task_id not in self.tasks:
            return False

        task = self.tasks[task_id]
        task.enabled = not task.enabled

        # Reschedule
        schedule.clear()
        self._schedule_all_tasks()

        self._save_data()
        logger.info(
            f"{'Enabled' if task.enabled else 'Disabled'} task: {task.name}")
        return True

    # ==================== MACROS ====================

    def create_macro(
            self,
            name: str,
            description: str,
            commands: List[Dict],
            trigger: str,
            trigger_phrase: str = "",
            hotkey: str = "",
            enabled: bool = True) -> Optional[Macro]:
        """Create a new macro"""
        try:
            import uuid
            macro_id = str(uuid.uuid4())[:8]

            macro = Macro(
                id=macro_id,
                name=name,
                description=description,
                commands=commands,
                trigger=trigger,
                trigger_phrase=trigger_phrase,
                hotkey=hotkey,
                enabled=enabled,
                created_at=datetime.now().isoformat()
            )

            self.macros[macro_id] = macro
            self._save_data()

            logger.info(f"Created macro: {name}")
            return macro

        except Exception as e:
            logger.error(f"Error creating macro: {e}")
            return None

    def update_macro(self, macro_id: str, **kwargs) -> bool:
        """Update an existing macro"""
        if macro_id not in self.macros:
            return False

        try:
            macro = self.macros[macro_id]

            for key, value in kwargs.items():
                if hasattr(macro, key):
                    setattr(macro, key, value)

            self._save_data()
            logger.info(f"Updated macro: {macro.name}")
            return True

        except Exception as e:
            logger.error(f"Error updating macro: {e}")
            return False

    def delete_macro(self, macro_id: str) -> bool:
        """Delete a macro"""
        if macro_id not in self.macros:
            return False

        try:
            macro = self.macros.pop(macro_id)
            self._save_data()
            logger.info(f"Deleted macro: {macro.name}")
            return True

        except Exception as e:
            logger.error(f"Error deleting macro: {e}")
            return False

    def get_all_macros(self) -> List[Macro]:
        """Get all macros"""
        return list(self.macros.values())

    def get_macro(self, macro_id: str) -> Optional[Macro]:
        """Get a specific macro"""
        return self.macros.get(macro_id)

    async def run_macro(
            self,
            macro_id: str,
            callback: Callable = None) -> bool:
        """Execute a macro"""
        if macro_id not in self.macros:
            return False

        macro = self.macros[macro_id]
        if not macro.enabled:
            return False

        logger.info(f"Running macro: {macro.name}")

        # Execute each command in sequence
        for cmd_data in macro.commands:
            try:
                command = cmd_data.get('command', '')
                delay = cmd_data.get('delay', 1)
                parameters = cmd_data.get('parameters', {})

                if callback:
                    res = callback(command, parameters)
                    if asyncio.iscoroutine(res):
                        await res

                # Wait for specified delay
                if delay > 0:
                    await asyncio.sleep(delay)

            except Exception as e:
                logger.error(f"Error executing macro command: {e}")
                return False

        # Update stats
        macro.run_count += 1
        self._save_data()

        return True

    def find_macro_by_trigger(self, trigger_phrase: str) -> Optional[Macro]:
        """Find a macro by its voice trigger phrase"""
        trigger_lower = trigger_phrase.lower()

        for macro in self.macros.values():
            if macro.enabled and macro.trigger == 'voice':
                if macro.trigger_phrase.lower() in trigger_lower:
                    return macro

        return None

    def toggle_macro(self, macro_id: str) -> bool:
        """Toggle macro enabled/disabled"""
        if macro_id not in self.macros:
            return False

        macro = self.macros[macro_id]
        macro.enabled = not macro.enabled

        self._save_data()
        logger.info(
            f"{'Enabled' if macro.enabled else 'Disabled'} macro: {macro.name}")
        return True

    # ==================== PRESETS ====================

    def create_preset_tasks(self):
        """Create useful preset tasks"""
        presets = [
            {
                'name': 'Good Morning',
                'description': 'Daily morning routine',
                'command': 'show_desktop',
                'schedule_type': 'daily',
                'schedule_time': '08:00',
                'enabled': False  # Disabled by default
            },
            {
                'name': 'System Check',
                'description': 'Check system status',
                'command': 'system_status',
                'schedule_type': 'interval',
                'schedule_time': '60',  # Every hour
                'enabled': False
            },
            {
                'name': 'Weekly Cleanup',
                'description': 'Clean up old files',
                'command': 'cleanup_temp',
                'schedule_type': 'weekly',
                'schedule_time': '10:00',
                'days': ['sunday'],
                'enabled': False
            }
        ]

        for preset in presets:
            if not any(t.name == preset['name'] for t in self.tasks.values()):
                self.create_task(**preset)

        logger.info("Created preset tasks")

    def create_preset_macros(self):
        """Create useful preset macros"""
        presets = [{'name': 'Work Mode',
                    'description': 'Open work applications',
                    'commands': [{'command': 'open_app',
                                   'delay': 2,
                                   'parameters': {'app': 'chrome'}},
                                 {'command': 'open_app',
                                  'delay': 2,
                                  'parameters': {'app': 'vscode'}},
                                 {'command': 'open_app',
                                  'delay': 2,
                                  'parameters': {'app': 'spotify'}}],
                    'trigger': 'voice',
                    'trigger_phrase': 'work mode',
                    'enabled': True},
                   {'name': 'End Work Day',
                    'description': 'Close work applications and show desktop',
                    'commands': [{'command': 'close_app',
                                  'delay': 1,
                                  'parameters': {'app': 'vscode'}},
                                 {'command': 'show_desktop',
                                  'delay': 0,
                                  'parameters': {}}],
                    'trigger': 'voice',
                    'trigger_phrase': 'end work',
                    'enabled': True}]

        for preset in presets:
            if not any(m.name == preset['name'] for m in self.macros.values()):
                self.create_macro(**preset)

        logger.info("Created preset macros")

    def get_scheduler_status(self) -> Dict:
        """Get scheduler status"""
        return {
            'running': self.running,
            'scheduled_jobs': len(schedule.jobs),
            'total_tasks': len(self.tasks),
            'enabled_tasks': sum(1 for t in self.tasks.values() if t.enabled),
            'total_macros': len(self.macros),
            'enabled_macros': sum(1 for m in self.macros.values() if m.enabled)
        }


# Singleton instance
automation_manager = AutomationManager()
