import os
import io
import base64
import asyncio
import subprocess
import pyperclip
from pathlib import Path
from typing import Dict, List, Optional, Union, Any, cast
from PIL import Image, ImageFilter, ImageEnhance
import pytesseract
from PyPDF2 import PdfMerger, PdfReader, PdfWriter
from pdf2image import convert_from_path
import pyautogui

from modules.bilingual_parser import parser
from utils.platform_utils import is_windows, is_macos, is_linux
from utils.logger import logger, log_command


class MediaProcessor:
    """OCR, PDF, and Image processing tools"""

    def __init__(self):
        # Configure tesseract path for Windows
        if is_windows():
            possible_tesseract_paths = [
                r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
            ]
            for path in possible_tesseract_paths:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    break

    # ==================== OCR FUNCTIONS ====================

    async def extract_text_from_image(
            self,
            image_path: str,
            language: str = 'en') -> Dict:
        """Extract text from image file"""
        try:
            path = Path(image_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'OCR_IMAGE',
                    'error': 'Image file not found',
                    'response': 'Image file not found'
                }

            # Open image
            image = Image.open(path)

            # Extract text
            text = pytesseract.image_to_string(image)

            # Clean up
            text = text.strip()

            log_command(f'OCR on {path.name}', 'ocr_image', True)

            return {
                'success': True,
                'action_type': 'OCR_IMAGE',
                'file': str(path),
                'text': text,
                'text_preview': text[:200] + '...' if len(text) > 200 else text,
                'response': f'Extracted {len(text)} characters from image'
            }

        except Exception as e:
            logger.error(f'Error extracting text from image: {e}')
            return {
                'success': False,
                'action_type': 'OCR_IMAGE',
                'error': str(e),
                'response': 'Failed to extract text from image'
            }

    async def extract_text_from_pdf(
            self,
            pdf_path: str,
            page_number: Optional[int] = None,
            language: str = 'en') -> Dict:
        """Extract text from PDF file"""
        try:
            path = Path(pdf_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'OCR_PDF',
                    'error': 'PDF file not found',
                    'response': 'PDF file not found'
                }

            # Try PyPDF2 first for text-based PDFs
            try:
                reader = PdfReader(str(path))
                text = ""

                if page_number is not None:
                    # Extract specific page
                    if 0 <= page_number < len(reader.pages):
                        text = reader.pages[page_number].extract_text()
                    else:
                        return {
                            'success': False,
                            'action_type': 'OCR_PDF',
                            'error': f'Invalid page number. PDF has {len(reader.pages)} pages',
                            'response': 'Invalid page number'
                        }
                else:
                    # Extract all pages
                    for page in reader.pages:
                        text += page.extract_text() + "\n"

                if text.strip():
                    log_command(f'PDF text extract from {path.name}', 'ocr_pdf', True)
                    return {
                        'success': True,
                        'action_type': 'OCR_PDF',
                        'file': str(path),
                        'text': text,
                        'text_preview': text[:200] + '...' if len(text) > 200 else text,
                        'pages': len(reader.pages),
                        'response': f'Extracted text from {len(reader.pages)} pages'
                    }
            except BaseException:
                pass  # Fall through to OCR

            # Use OCR for scanned PDFs
            images = convert_from_path(
                str(path),
                first_page=page_number,
                last_page=page_number)

            if not images:
                return {
                    'success': False,
                    'action_type': 'OCR_PDF',
                    'error': 'Could not convert PDF to images',
                    'response': 'Failed to process PDF'
                }

            text = ""
            for image in images:
                text += pytesseract.image_to_string(image) + "\n"

            log_command(f'OCR on PDF {path.name}', 'ocr_pdf', True)

            return {
                'success': True,
                'action_type': 'OCR_PDF',
                'file': str(path),
                'text': text,
                'text_preview': text[:200] + '...' if len(text) > 200 else text,
                'response': f'Extracted {len(text)} characters from PDF'
            }

        except Exception as e:
            logger.error(f'Error extracting text from PDF: {e}')
            return {
                'success': False,
                'action_type': 'OCR_PDF',
                'error': str(e),
                'response': 'Failed to extract text from PDF'
            }

    async def extract_text_from_screenshot(self, language: str = 'en') -> Dict:
        """Take screenshot and extract text"""
        try:
            # Take screenshot
            screenshot = pyautogui.screenshot()

            # Extract text
            text = pytesseract.image_to_string(screenshot)
            text = text.strip()

            log_command('OCR on screenshot', 'ocr_screenshot', True)

            return {
                'success': True,
                'action_type': 'OCR_SCREENSHOT',
                'text': text,
                'text_preview': text[:200] + '...' if len(text) > 200 else text,
                'response': f'Extracted {len(text)} characters from screen'
            }

        except Exception as e:
            logger.error(f'Error extracting text from screenshot: {e}')
            return {
                'success': False,
                'action_type': 'OCR_SCREENSHOT',
                'error': str(e),
                'response': 'Failed to extract text from screen'
            }

    # ==================== PDF TOOLS ====================

    async def merge_pdfs(
            self,
            pdf_files: List[str],
            output_path: str,
            language: str = 'en') -> Dict:
        """Merge multiple PDFs into one"""
        try:
            merger = PdfMerger()

            for pdf_file in pdf_files:
                path = Path(pdf_file).expanduser().resolve()
                if path.exists():
                    merger.append(str(path))

            output = Path(output_path).expanduser().resolve()
            merger.write(str(output))
            merger.close()

            log_command(f'merge {len(pdf_files)} PDFs', 'pdf_merge', True)

            return {
                'success': True,
                'action_type': 'PDF_MERGE',
                'output': str(output),
                'files_merged': len(pdf_files),
                'response': f'Merged {len(pdf_files)} PDFs into {output.name}'
            }

        except Exception as e:
            logger.error(f'Error merging PDFs: {e}')
            return {
                'success': False,
                'action_type': 'PDF_MERGE',
                'error': str(e),
                'response': 'Failed to merge PDFs'
            }

    async def split_pdf(
            self,
            pdf_path: str,
            pages: List[int],
            output_path: str,
            language: str = 'en') -> Dict:
        """Extract specific pages from PDF"""
        try:
            path = Path(pdf_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'PDF_SPLIT',
                    'error': 'PDF file not found',
                    'response': 'PDF file not found'
                }

            reader = PdfReader(str(path))
            writer = PdfWriter()

            for page_num in pages:
                if 0 <= page_num < len(reader.pages):
                    writer.add_page(reader.pages[page_num])

            output = Path(output_path).expanduser().resolve()
            with open(output, 'wb') as output_file:
                writer.write(output_file)

            log_command(f'split PDF {path.name}', 'pdf_split', True)

            return {
                'success': True,
                'action_type': 'PDF_SPLIT',
                'output': str(output),
                'pages': len(pages),
                'response': f'Extracted {len(pages)} pages to {output.name}'
            }

        except Exception as e:
            logger.error(f'Error splitting PDF: {e}')
            return {
                'success': False,
                'action_type': 'PDF_SPLIT',
                'error': str(e),
                'response': 'Failed to split PDF'
            }

    async def pdf_to_images(
            self,
            pdf_path: str,
            output_folder: Optional[str] = None,
            dpi: int = 200,
            language: str = 'en') -> Dict:
        """Convert PDF pages to images"""
        try:
            path = Path(pdf_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'PDF_TO_IMAGES',
                    'error': 'PDF file not found',
                    'response': 'PDF file not found'
                }

            # Determine output folder
            if output_folder:
                output_dir = Path(output_folder).expanduser().resolve()
            else:
                output_dir = path.parent / f'{path.stem}_images'

            output_dir.mkdir(exist_ok=True)

            # Convert PDF to images
            images = convert_from_path(str(path), dpi=dpi)

            saved_files = []
            for i, image in enumerate(images):
                image_path = output_dir / f'page_{i + 1:03d}.png'
                image.save(str(image_path), 'PNG')
                saved_files.append(str(image_path))

            log_command(f'PDF to images: {path.name}', 'pdf_to_images', True)

            return {
                'success': True,
                'action_type': 'PDF_TO_IMAGES',
                'output_folder': str(output_dir),
                'images_created': len(saved_files),
                'files': saved_files,
                'response': f'Converted PDF to {len(saved_files)} images'
            }

        except Exception as e:
            logger.error(f'Error converting PDF to images: {e}')
            return {
                'success': False,
                'action_type': 'PDF_TO_IMAGES',
                'error': str(e),
                'response': 'Failed to convert PDF to images'
            }

    async def images_to_pdf(
            self,
            image_paths: List[str],
            output_path: str,
            language: str = 'en') -> Dict:
        """Convert images to PDF"""
        try:
            images = []

            for img_path in image_paths:
                path = Path(img_path).expanduser().resolve()
                if path.exists():
                    img = Image.open(path)
                    # Convert to RGB if necessary
                    if img.mode in ('RGBA', 'LA', 'P'):
                        img = img.convert('RGB')
                    images.append(img)

            if not images:
                return {
                    'success': False,
                    'action_type': 'IMAGES_TO_PDF',
                    'error': 'No valid images found',
                    'response': 'No valid images found'
                }

            output = Path(output_path).expanduser().resolve()

            # Save as PDF
            if len(images) > 1:
                images[0].save(
                    str(output),
                    'PDF',
                    resolution=100.0,
                    save_all=True,
                    append_images=list(
                        images[i] for i in range(
                            1,
                            len(images))))
            else:
                images[0].save(str(output), 'PDF', resolution=100.0)

            log_command(f'images to PDF: {len(images)} images', 'images_to_pdf', True)

            return {
                'success': True,
                'action_type': 'IMAGES_TO_PDF',
                'output': str(output),
                'images': len(image_paths),
                'response': f'Created PDF from {len(image_paths)} images'
            }

        except Exception as e:
            logger.error(f'Error converting images to PDF: {e}')
            return {
                'success': False,
                'action_type': 'IMAGES_TO_PDF',
                'error': str(e),
                'response': 'Failed to create PDF'
            }

    # ==================== IMAGE TOOLS ====================

    async def convert_image(
            self,
            input_path: str,
            output_path: str,
            format: Optional[str] = None,
            language: str = 'en') -> Dict:
        """Convert image to different format"""
        try:
            path = Path(input_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'CONVERT_IMAGE',
                    'error': 'Image file not found',
                    'response': 'Image file not found'
                }

            # Open image
            image = Image.open(path)

            # Determine output format
            suffix = str(Path(output_path).suffix)
            if not format:
                format = suffix[1:].upper() if suffix else "PNG"

            # Convert RGBA to RGB for JPEG
            if format.upper() in [
                    'JPEG', 'JPG'] and image.mode in (
                    'RGBA', 'LA', 'P'):
                image = image.convert('RGB')

            # Save
            output = Path(output_path).expanduser().resolve()
            image.save(str(output), format.upper())

            log_command(f'convert image {path.name} to {format}', 'convert_image', True)

            return {
                'success': True,
                'action_type': 'CONVERT_IMAGE',
                'input': str(path),
                'output': str(output),
                'format': format.upper(),
                'response': f'Converted {path.name} to {format.upper()}'
            }

        except Exception as e:
            logger.error(f'Error converting image: {e}')
            return {
                'success': False,
                'action_type': 'CONVERT_IMAGE',
                'error': str(e),
                'response': 'Failed to convert image'
            }

    async def resize_image(
            self,
            input_path: str,
            output_path: str,
            width: Optional[int] = None,
            height: Optional[int] = None,
            maintain_aspect: bool = True,
            language: str = 'en') -> Dict:
        """Resize image dimensions"""
        try:
            path = Path(input_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'RESIZE_IMAGE',
                    'error': 'Image file not found',
                    'response': 'Image file not found'
                }

            image = Image.open(path)
            original_size = image.size

            # Calculate new size
            if maintain_aspect and (width and height):
                image.thumbnail((width, height), Image.Resampling.LANCZOS)
            elif width and height:
                image = image.resize((width, height), Image.Resampling.LANCZOS)
            elif width:
                ratio = width / original_size[0]
                height = int(original_size[1] * ratio)
                image = image.resize((width, height), Image.Resampling.LANCZOS)
            elif height:
                ratio = height / original_size[1]
                width = int(original_size[0] * ratio)
                image = image.resize((width, height), Image.Resampling.LANCZOS)
            else:
                return {
                    'success': False,
                    'action_type': 'RESIZE_IMAGE',
                    'error': 'Width or height required',
                    'response': 'Please specify width or height'
                }

            # Save
            output = Path(output_path).expanduser().resolve()
            image.save(str(output))

            log_command(f'resize image {path.name}', 'resize_image', True)

            return {
                'success': True,
                'action_type': 'RESIZE_IMAGE',
                'input': str(path),
                'output': str(output),
                'original_size': original_size,
                'new_size': image.size,
                'response': f'Resized from {original_size} to {image.size}'
            }

        except Exception as e:
            logger.error(f'Error resizing image: {e}')
            return {
                'success': False,
                'action_type': 'RESIZE_IMAGE',
                'error': str(e),
                'response': 'Failed to resize image'
            }

    async def compress_image(
            self,
            input_path: str,
            output_path: str,
            quality: int = 85,
            language: str = 'en') -> Dict:
        """Compress image file size"""
        try:
            path = Path(input_path).expanduser().resolve()

            if not path.exists():
                return {
                    'success': False,
                    'action_type': 'COMPRESS_IMAGE',
                    'error': 'Image file not found',
                    'response': 'Image file not found'
                }

            image = Image.open(path)
            original_size = path.stat().st_size

            # Save with compression
            output = Path(output_path).expanduser().resolve()

            if path.suffix.lower() in ['.jpg', '.jpeg']:
                image.save(str(output), 'JPEG', quality=quality, optimize=True)
            elif path.suffix.lower() == '.png':
                image.save(str(output), 'PNG', optimize=True)
            else:
                image.save(str(output), optimize=True)

            new_size = output.stat().st_size
            reduction = ((original_size - new_size) / original_size) * 100

            log_command(f'compress image {path.name}', 'compress_image', True)

            return {
                'success': True,
                'action_type': 'COMPRESS_IMAGE',
                'input': str(path),
                'output': str(output),
                'original_size': original_size,
                'new_size': new_size,
                'reduction_percent': float(
                    round(
                        reduction,
                        1)) if reduction >= 0 else 0.0,
                'response': f'Compressed by {reduction:.1f}% ({self._format_size(original_size)} → {self._format_size(new_size)})'}

        except Exception as e:
            logger.error(f'Error compressing image: {e}')
            return {
                'success': False,
                'action_type': 'COMPRESS_IMAGE',
                'error': str(e),
                'response': 'Failed to compress image'
            }

    async def batch_images_to_pdf(
            self,
            source_folder: str,
            output_name: str = "batch_images.pdf",
            language: str = 'en') -> Dict:
        """Convert all images in a folder to a single PDF"""
        try:
            folder = Path(source_folder).expanduser().resolve()
            if not folder.exists() or not folder.is_dir():
                return {
                    'success': False,
                    'error': 'Folder not found',
                    'response': 'Source folder not found'}

            image_extensions = ['.png', '.jpg', '.jpeg', '.bmp', '.gif']
            image_paths = [str(f) for f in folder.iterdir()
                           if f.suffix.lower() in image_extensions]

            if not image_paths:
                return {'success': False, 'error': 'No images found',
                        'response': 'No images found in the specified folder'}

            output_path = folder / output_name
            return await self.images_to_pdf(image_paths, str(output_path), language)
        except Exception as e:
            logger.error(f'Error in batch images to PDF: {e}')
            return {'success': False, 'error': str(e)}

    async def scan_folder(
            self,
            folder_path: str,
            file_type: str = "all",
            language: str = 'en') -> Dict:
        """Scan folder for specific file types (media, pdf, etc.)"""
        try:
            folder = Path(folder_path).expanduser().resolve()
            if not folder.exists() or not folder.is_dir():
                return {'success': False, 'error': 'Folder not found'}

            extensions = {
                "media": [
                    '.png',
                    '.jpg',
                    '.jpeg',
                    '.mp4',
                    '.mp3',
                    '.wav',
                    '.mov'],
                "pdf": ['.pdf'],
                "doc": [
                    '.doc',
                    '.docx',
                    '.txt',
                    '.rtf'],
                "all": []}

            target_exts = extensions.get(file_type.lower(), [])
            found_files = []

            for root, _, files in os.walk(folder):
                for file in files:
                    if not target_exts or Path(
                            file).suffix.lower() in target_exts:
                        found_files.append({
                            'name': file,
                            'path': os.path.join(root, file),
                            'size': os.path.getsize(os.path.join(root, file))
                        })

            # Limit results for performance
            limited_files = list(found_files[i]
                                 for i in range(min(100, len(found_files))))

            return {
                'success': True,
                'action_type': 'SCAN_FOLDER',
                'folder': folder_path,
                'type': file_type,
                'files': limited_files,
                'count': len(found_files),
                'response': f'Found {len(found_files)} {file_type} files in {folder.name}'}
        except Exception as e:
            logger.error(f'Error scanning folder: {e}')
            return {'success': False, 'error': str(e)}

    async def make_drawing(self, language: str = 'en') -> Dict:
        """Open a drawing application (MS Paint fallback)"""
        try:
            if is_windows():
                os.startfile('mspaint.exe')  # type: ignore
            elif is_macos():
                subprocess.run(['open', '-a', 'Preview'])
            else:
                subprocess.run(['pinta'])

            return {
                'success': True,
                'action_type': 'MAKE_DRAWING',
                'response': 'Drawing app opened'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    async def get_selected_text(self, language: str = 'en') -> Dict:
        """Get currently selected text on screen (via clipboard)"""
        try:
            # Press Ctrl+C (or Cmd+C)
            if is_macos():
                pyautogui.hotkey('command', 'c')
            else:
                pyautogui.hotkey('ctrl', 'c')

            # Wait a bit for clipboard update
            await asyncio.sleep(0.5)

            selected_text = pyperclip.paste()

            return {
                'success': True,
                'action_type': 'GET_SELECTED_TEXT',
                'text': selected_text,
                'response': f'Retrieved selected text: "{selected_text[:50]}..."'
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    async def read_pdf(
            self,
            pdf_path: str,
            page_number: Optional[int] = None,
            language: str = 'en') -> Dict:
        """Read PDF content aloud (via frontend TTS)"""
        result = await self.extract_text_from_pdf(pdf_path, page_number, language)
        if result['success']:
            text = result['text']
            # Limit text length for reading
            read_limit = 2000
            read_text = text[:read_limit] + \
                "..." if len(text) > read_limit else text

            return {
                'success': True,
                'action_type': 'READ_TEXT',
                'text': read_text,
                'file': pdf_path,
                'response': (
                    f"Reading PDF: {Path(pdf_path).name}"
                    if language == 'en'
                    else f"PDF पढ़ रहा हूँ: {Path(pdf_path).name}"
                )
            }
        return result

    async def narrate_screen(self, language: str = 'en') -> Dict:
        """Narrate what's currently on screen"""
        result = await self.extract_text_from_screenshot(language)
        if result['success']:
            text = result['text']
            if not text.strip():
                return {
                    'success': True,
                    'action_type': 'READ_TEXT',
                    'text': (
                        'The screen appears to be empty '
                        'or has no recognizable text.'
                    ),
                    'response': 'Screen is empty'
                }

            # Narrate the text
            return {
                'success': True,
                'action_type': 'READ_TEXT',
                'text': f"On your screen, I see: {text[:1000]}",
                'response': "Narrating screen content"
            }
        return result

    async def get_screen_summary(self, language: str = 'en') -> Dict:
        """Get a summary of what's on screen"""
        # This would ideally use a Vision LLM, but for now we use OCR
        result = await self.extract_text_from_screenshot(language)
        if result['success']:
            text = result['text']
            # Simple summarization: first few lines or key words
            lines = [
                line.strip()
                for line in str(text).split('\n')
                if line.strip()
            ]
            summary = ", ".join(cast(Any, lines)[:5]) if lines else "None"

            return {
                'success': True,
                'summary': summary,
                'response': f"Screen summary: {summary}"
            }
        return result

    async def draw_shape(
            self,
            shape: str = "circle",
            language: str = 'en') -> Dict:
        """Draw a simple shape using mouse automation"""
        try:
            import math

            # Start position (center of screen)
            sw, sh = pyautogui.size()
            cx, cy = sw // 2, sh // 2

            pyautogui.moveTo(cx, cy)
            pyautogui.mouseDown()

            if shape.lower() == "circle":
                radius = 100
                for i in range(0, 361, 10):
                    angle = math.radians(i)
                    x = cx + radius * math.cos(angle)
                    y = cy + radius * math.sin(angle)
                    pyautogui.moveTo(x, y)
            elif shape.lower() == "square":
                size = 200
                pyautogui.dragRel(size, 0)
                pyautogui.dragRel(0, size)
                pyautogui.dragRel(-size, 0)
                pyautogui.dragRel(0, -size)

            pyautogui.mouseUp()

            return {
                'success': True,
                'action_type': 'DRAW_SHAPE',
                'shape': shape,
                'response': f"Drew a {shape}"
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def _format_size(self, size_bytes: int) -> str:
        """Format bytes to human readable"""
        for unit in ['B', 'KB', 'MB']:
            if size_bytes < 1024:
                return f'{size_bytes:.1f} {unit}'
            size_bytes = int(size_bytes / 1024)
        return f'{size_bytes:.1f} GB'


# Singleton instance
media_processor = MediaProcessor()
