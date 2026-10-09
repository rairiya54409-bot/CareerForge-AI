from pathlib import Path

from docx import Document
from pypdf import PdfReader


def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)

    text_parts = []

    for page in reader.pages:
        text = page.extract_text()

        if text:
            text_parts.append(text)

    return "\n".join(text_parts).strip()


def extract_text_from_docx(file_path: str) -> str:
    document = Document(file_path)

    text_parts = []

    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            text_parts.append(paragraph.text.strip())

    return "\n".join(text_parts).strip()


def extract_resume_text(file_path: str) -> str:
    extension = Path(file_path).suffix.lower()

    if extension == ".pdf":
        return extract_text_from_pdf(file_path)

    if extension == ".docx":
        return extract_text_from_docx(file_path)

    raise ValueError(
        "Unsupported file type. Only PDF and DOCX are supported."
    )