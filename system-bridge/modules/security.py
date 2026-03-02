import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, Callable
from config import DANGEROUS_COMMANDS, CONFIRMATION_TIMEOUT
from utils.logger import log_command, log_system_event


class SecurityManager:
    """Manage command confirmations and security checks"""

    def __init__(self):
        self.pending_confirmations: Dict[str, dict] = {}
        self.confirmation_callbacks: Dict[str, Callable] = {}

    def is_dangerous(self, command_key: str, command_text: str) -> bool:
        """Check if command requires confirmation"""
        command_lower = command_text.lower()

        # Check against dangerous command keywords
        for dangerous in DANGEROUS_COMMANDS:
            if dangerous in command_key.lower() or dangerous in command_lower:
                return True

        return False

    def request_confirmation(self, command_key: str, command_text: str,
                             language: str, details: dict) -> str:
        """
        Request user confirmation for dangerous command
        Returns confirmation_id
        """
        confirmation_id = str(uuid.uuid4())
        expires_at = datetime.now() + timedelta(seconds=CONFIRMATION_TIMEOUT)

        self.pending_confirmations[confirmation_id] = {
            'command_key': command_key,
            'command_text': command_text,
            'language': language,
            'details': details,
            'expires_at': expires_at,
            'confirmed': None  # None=pending, True=confirmed, False=rejected
        }

        log_system_event("CONFIRMATION_REQUESTED", {
            'confirmation_id': confirmation_id,
            'command': command_key,
            'timeout': CONFIRMATION_TIMEOUT
        })

        # Start timeout timer
        asyncio.create_task(self._handle_timeout(confirmation_id))

        return confirmation_id

    async def _handle_timeout(self, confirmation_id: str):
        """Handle confirmation timeout"""
        await asyncio.sleep(CONFIRMATION_TIMEOUT)

        if confirmation_id in self.pending_confirmations:
            confirmation = self.pending_confirmations[confirmation_id]
            if confirmation['confirmed'] is None:
                confirmation['confirmed'] = False

                log_system_event("CONFIRMATION_TIMEOUT", {
                    'confirmation_id': confirmation_id,
                    'command': confirmation['command_key']
                })

                # Notify via callback if registered
                if confirmation_id in self.confirmation_callbacks:
                    callback = self.confirmation_callbacks[confirmation_id]
                    await callback(confirmation_id, False, "timeout")

    def confirm_command(self, confirmation_id: str, approved: bool) -> bool:
        """User confirms or rejects command"""
        if confirmation_id not in self.pending_confirmations:
            return False

        confirmation = self.pending_confirmations[confirmation_id]

        # Check if already decided
        if confirmation['confirmed'] is not None:
            return False

        # Check if expired
        if datetime.now() > confirmation['expires_at']:
            confirmation['confirmed'] = False
            return False

        confirmation['confirmed'] = approved

        log_command(
            confirmation['command_text'],
            confirmation['command_key'],
            success=approved,
            details={'confirmed': approved, 'confirmation_id': confirmation_id}
        )

        return True

    def get_confirmation_status(self, confirmation_id: str) -> Optional[bool]:
        """Get status of confirmation: None=pending, True=confirmed, False=rejected/timeout"""
        if confirmation_id not in self.pending_confirmations:
            return None
        return self.pending_confirmations[confirmation_id]['confirmed']

    def register_callback(self, confirmation_id: str, callback: Callable):
        """Register async callback for confirmation result"""
        self.confirmation_callbacks[confirmation_id] = callback

    def get_confirmation_details(self, confirmation_id: str) -> Optional[dict]:
        """Get confirmation request details"""
        return self.pending_confirmations.get(confirmation_id)

    def cleanup_old_confirmations(self):
        """Remove expired confirmations"""
        now = datetime.now()
        expired = [
            cid for cid, conf in self.pending_confirmations.items()
            if now > conf['expires_at'] + timedelta(minutes=5)
        ]
        for cid in expired:
            del self.pending_confirmations[cid]
            if cid in self.confirmation_callbacks:
                del self.confirmation_callbacks[cid]


# Singleton instance
security = SecurityManager()
