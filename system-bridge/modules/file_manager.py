import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from fuzzywuzzy import fuzz, process

from modules.bilingual_parser import parser
from utils.platform_utils import is_windows, is_macos, is_linux, run_command
from utils.logger import logger, log_command


class FileManager:
    """Cross-platform file system manager"""

    def __init__(self):
        self.quick_access_paths = self._get_quick_access_paths()

    def _get_quick_access_paths(self) -> Dict[str, Path]:
        """Get common folder paths"""
        home = Path.home()
        paths = {
            'home': home,
            'downloads': home / 'Downloads',
            'documents': home / 'Documents',
            'desktop': home / 'Desktop',
            'pictures': home / 'Pictures',
            'videos': home / 'Videos',
            'music': home / 'Music',
        }
        return paths

    def _get_folder_path(self, folder_name: str) -> Optional[Path]:
        """Resolve folder name to path (supports fuzzy matching)"""
        folder_lower = folder_name.lower()

        # Direct match
        for key, path in self.quick_access_paths.items():
            if key in folder_lower or folder_lower in key:
                return path

        # Fuzzy match
        keys = list(self.quick_access_paths.keys())
        best_match = process.extractOne(
            folder_lower, keys, scorer=fuzz.partial_ratio)
        if best_match and best_match[1] >= 70:
            return self.quick_access_paths[best_match[0]]

        # Try as direct path
        try:
            path = Path(folder_name).expanduser().resolve()
            if path.exists():
                return path
        except BaseException:
            pass

        return None

    async def open_folder(
            self,
            folder_name: str,
            language: str = 'en') -> Dict:
        """Open folder in file explorer"""
        try:
            folder_path = self._get_folder_path(folder_name)

            if not folder_path or not folder_path.exists():
                return {
                    'success': False,
                    'action_type': 'OPEN_FOLDER',
                    'error': f'Folder not found: {folder_name}',
                    'response': f'Folder {folder_name} not found'
                }

            # Open folder based on platform
            if is_windows():
                os.startfile(folder_path)
            elif is_macos():
                subprocess.run(['open', str(folder_path)])
            else:
                subprocess.run(['xdg-open', str(folder_path)])

            log_command(f'open folder {folder_name}', 'open_folder', True)

            return {
                'success': True,
                'action_type': 'OPEN_FOLDER',
                'folder': str(folder_path),
                'response': parser.get_response(
                    'app_opened',
                    language,
                    folder_name)}

        except Exception as e:
            logger.error(f'Error opening folder {folder_name}: {e}')
            return {
                'success': False,
                'action_type': 'OPEN_FOLDER',
                'error': str(e),
                'response': f'Failed to open folder {folder_name}'
            }

    async def list_files(
            self,
            folder_name: str = None,
            pattern: str = '*',
            language: str = 'en') -> Dict:
        """List files in folder with optional pattern matching"""
        try:
            if folder_name:
                folder_path = self._get_folder_path(folder_name)
            else:
                folder_path = Path.home()

            if not folder_path or not folder_path.exists():
                return {
                    'success': False,
                    'action_type': 'LIST_FILES',
                    'error': 'Folder not found',
                    'response': 'Folder not found'
                }

            files = []
            folders = []

            for item in folder_path.iterdir():
                try:
                    stat = item.stat()
                    info = {
                        'name': item.name,
                        'path': str(item),
                        'size': stat.st_size if item.is_file() else None,
                        'modified': datetime.fromtimestamp(
                            stat.st_mtime).isoformat(),
                        'is_file': item.is_file(),
                        'is_dir': item.is_dir()}

                    if item.is_dir():
                        folders.append(info)
                    elif pattern == '*' or item.match(pattern):
                        files.append(info)

                except (PermissionError, OSError):
                    continue

            # Sort: folders first, then files
            all_items = folders + files

            return {
                'success': True,
                'action_type': 'LIST_FILES',
                'folder': str(folder_path),
                'items': all_items[:50],  # Limit to 50 items
                'total_count': len(all_items),
                'response': f'Found {len(folders)} folders and {len(files)} files'
            }

        except Exception as e:
            logger.error(f'Error listing files: {e}')
            return {
                'success': False,
                'action_type': 'LIST_FILES',
                'error': str(e),
                'response': 'Failed to list files'
            }

    async def search_files(
            self,
            search_name: str,
            folder_name: str = None,
            language: str = 'en') -> Dict:
        """Search for files by name"""
        try:
            if folder_name:
                folder_path = self._get_folder_path(folder_name)
            else:
                folder_path = Path.home()

            if not folder_path or not folder_path.exists():
                return {
                    'success': False,
                    'action_type': 'SEARCH_FILES',
                    'error': 'Folder not found',
                    'response': 'Folder not found'
                }

            matches = []
            search_lower = search_name.lower()

            # Search recursively (limit depth)
            for root, dirs, files in os.walk(folder_path):
                # Limit recursion depth
                depth = root.count(os.sep) - str(folder_path).count(os.sep)
                if depth > 3:
                    del dirs[:]
                    continue

                for item in files + dirs:
                    item_lower = item.lower()
                    if search_lower in item_lower or fuzz.partial_ratio(
                            search_lower, item_lower) >= 70:
                        full_path = Path(root) / item
                        try:
                            stat = full_path.stat()
                            matches.append({
                                'name': item,
                                'path': str(full_path),
                                'size': stat.st_size if full_path.is_file() else None,
                                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                                'is_file': full_path.is_file()
                            })
                        except BaseException:
                            continue

                if len(matches) >= 20:
                    break

            return {
                'success': True,
                'action_type': 'SEARCH_FILES',
                'search_term': search_name,
                'folder': str(folder_path),
                'matches': matches[:20],
                'count': len(matches),
                'response': f'Found {len(matches)} matches for "{search_name}"'
            }

        except Exception as e:
            logger.error(f'Error searching files: {e}')
            return {
                'success': False,
                'action_type': 'SEARCH_FILES',
                'error': str(e),
                'response': 'Failed to search files'
            }

    async def create_folder(
            self,
            folder_name: str,
            parent_path: str = None,
            language: str = 'en') -> Dict:
        """Create new folder"""
        try:
            if parent_path:
                parent = self._get_folder_path(parent_path)
            else:
                parent = Path.home()

            if not parent:
                parent = Path.home()

            new_folder = parent / folder_name

            # Create folder
            new_folder.mkdir(parents=True, exist_ok=True)

            log_command(f'create folder {folder_name}', 'create_folder', True)

            return {
                'success': True,
                'action_type': 'CREATE_FOLDER',
                'path': str(new_folder),
                'response': f'Created folder: {folder_name}'
            }

        except Exception as e:
            logger.error(f'Error creating folder {folder_name}: {e}')
            return {
                'success': False,
                'action_type': 'CREATE_FOLDER',
                'error': str(e),
                'response': f'Failed to create folder {folder_name}'
            }

    async def delete_file(
            self,
            file_path: str,
            language: str = 'en',
            confirmed: bool = False) -> Dict:
        """Delete file or folder (with confirmation)"""
        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'action_type': 'DELETE_FILE',
                'file': file_path,
                'response': f'Are you sure you want to delete "{file_path}"?',
                'confirmation_context': {
                    'command': 'delete_file',
                    'file_path': file_path}}

        try:
            path = Path(file_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'DELETE_FILE',
                    'error': 'File not found',
                    'response': 'File not found'
                }

            # Move to trash instead of permanent delete
            if is_windows():
                # Use Windows Recycle Bin
                import winshell
                winshell.delete_file(str(path), allow_undo=True)
            elif is_macos():
                # Move to Trash
                trash_path = Path.home() / '.Trash' / path.name
                shutil.move(str(path), str(trash_path))
            else:
                # Linux - move to ~/.local/share/Trash/files
                trash_path = Path.home() / '.local/share/Trash/files' / path.name
                shutil.move(str(path), str(trash_path))

            log_command(f'delete file {file_path}', 'delete_file', True)

            return {
                'success': True,
                'action_type': 'DELETE_FILE',
                'file': str(path),
                'response': f'Moved to trash: {path.name}'
            }

        except Exception as e:
            logger.error(f'Error deleting file {file_path}: {e}')
            return {
                'success': False,
                'action_type': 'DELETE_FILE',
                'error': str(e),
                'response': f'Failed to delete {file_path}'
            }

    async def copy_file(
            self,
            source: str,
            destination: str,
            language: str = 'en') -> Dict:
        """Copy file or folder"""
        try:
            src_path = Path(source).expanduser().resolve()
            dst_path = Path(destination).expanduser().resolve()

            if not src_path.exists():
                return {
                    'success': False,
                    'action_type': 'COPY_FILE',
                    'error': 'Source not found',
                    'response': 'Source file not found'
                }

            if src_path.is_dir():
                shutil.copytree(
                    src_path,
                    dst_path / src_path.name,
                    dirs_exist_ok=True)
            else:
                shutil.copy2(src_path, dst_path)

            log_command(f'copy {source} to {destination}', 'copy_file', True)

            return {
                'success': True,
                'action_type': 'COPY_FILE',
                'source': str(src_path),
                'destination': str(dst_path),
                'response': f'Copied {src_path.name}'
            }

        except Exception as e:
            logger.error(f'Error copying file: {e}')
            return {
                'success': False,
                'action_type': 'COPY_FILE',
                'error': str(e),
                'response': 'Failed to copy file'
            }

    async def move_file(
            self,
            source: str,
            destination: str,
            language: str = 'en') -> Dict:
        """Move file or folder"""
        try:
            src_path = Path(source).expanduser().resolve()
            dst_path = Path(destination).expanduser().resolve()

            if not src_path.exists():
                return {
                    'success': False,
                    'action_type': 'MOVE_FILE',
                    'error': 'Source not found',
                    'response': 'Source file not found'
                }

            shutil.move(str(src_path), str(dst_path))

            log_command(f'move {source} to {destination}', 'move_file', True)

            return {
                'success': True,
                'action_type': 'MOVE_FILE',
                'source': str(src_path),
                'destination': str(dst_path),
                'response': f'Moved {src_path.name}'
            }

        except Exception as e:
            logger.error(f'Error moving file: {e}')
            return {
                'success': False,
                'action_type': 'MOVE_FILE',
                'error': str(e),
                'response': 'Failed to move file'
            }

    async def rename_file(
            self,
            old_path: str,
            new_name: str,
            language: str = 'en') -> Dict:
        """Rename file or folder"""
        try:
            src_path = Path(old_path).expanduser().resolve()

            if not src_path.exists():
                return {
                    'success': False,
                    'action_type': 'RENAME_FILE',
                    'error': 'File not found',
                    'response': 'File not found'
                }

            new_path = src_path.parent / new_name
            src_path.rename(new_path)

            log_command(
                f'rename {old_path} to {new_name}',
                'rename_file',
                True)

            return {
                'success': True,
                'action_type': 'RENAME_FILE',
                'old_name': src_path.name,
                'new_name': new_name,
                'response': f'Renamed to {new_name}'
            }

        except Exception as e:
            logger.error(f'Error renaming file: {e}')
            return {
                'success': False,
                'action_type': 'RENAME_FILE',
                'error': str(e),
                'response': 'Failed to rename file'
            }

    async def get_file_info(
            self,
            file_path: str,
            language: str = 'en') -> Dict:
        """Get file information"""
        try:
            path = Path(file_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'FILE_INFO',
                    'error': 'File not found',
                    'response': 'File not found'
                }

            stat = path.stat()

            info = {
                'name': path.name,
                'path': str(path),
                'size': stat.st_size,
                'size_human': self._format_size(stat.st_size),
                'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'accessed': datetime.fromtimestamp(stat.st_atime).isoformat(),
                'is_file': path.is_file(),
                'is_dir': path.is_dir(),
                'extension': path.suffix if path.is_file() else None
            }

            return {
                'success': True,
                'action_type': 'FILE_INFO',
                'info': info,
                'response': f'Name: {info["name"]}, Size: {info["size_human"]}'
            }

        except Exception as e:
            logger.error(f'Error getting file info: {e}')
            return {
                'success': False,
                'action_type': 'FILE_INFO',
                'error': str(e),
                'response': 'Failed to get file info'
            }

    def _format_size(self, size_bytes: int) -> str:
        """Format bytes to human readable"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024:
                return f'{size_bytes:.1f} {unit}'
            size_bytes /= 1024
        return f'{size_bytes:.1f} PB'

    # Quick access methods
    async def open_downloads(self, language: str = 'en') -> Dict:
        return await self.open_folder('downloads', language)

    async def open_documents(self, language: str = 'en') -> Dict:
        return await self.open_folder('documents', language)

    async def open_desktop(self, language: str = 'en') -> Dict:
        return await self.open_folder('desktop', language)

    async def open_pictures(self, language: str = 'en') -> Dict:
        return await self.open_folder('pictures', language)


# Singleton instance
file_manager = FileManager()
