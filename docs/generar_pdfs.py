#!/usr/bin/env python3
"""Genera PDFs de la documentación con referencias genéricas (sin nombre de organización)."""

import re
import markdown
from weasyprint import HTML, CSS

DOCS_DIR = "/home/nicolas/Repositorios/pagina-hockey-bariloche/docs"

REPLACEMENTS = [
    ("Hockey Pista Bariloche", "Hockey Pista"),
    ("hockeybariloche.com.ar", "tu-dominio.com.ar"),
    ("/pagina-hockey-bariloche/", "/pagina-hockey/"),
]

CSS_STYLES = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.6;
    color: #1a1a2e;
    background: white;
    margin: 0;
    padding: 0;
}

@page {
    size: A4;
    margin: 2cm 2cm 2.5cm 2cm;
    @bottom-center {
        content: "Sistema de Gestión Hockey Pista  —  Pág. " counter(page) " de " counter(pages);
        font-size: 8pt;
        color: #888;
    }
}

h1 {
    font-size: 20pt;
    font-weight: 700;
    color: #1a3a5c;
    border-bottom: 3px solid #1a6fb5;
    padding-bottom: 10px;
    margin-bottom: 20px;
    margin-top: 0;
}

h2 {
    font-size: 14pt;
    font-weight: 700;
    color: #1a3a5c;
    border-left: 4px solid #1a6fb5;
    padding-left: 10px;
    margin-top: 28px;
    margin-bottom: 12px;
    page-break-after: avoid;
}

h3 {
    font-size: 11pt;
    font-weight: 600;
    color: #2c5282;
    margin-top: 20px;
    margin-bottom: 8px;
    page-break-after: avoid;
}

h4 {
    font-size: 10pt;
    font-weight: 600;
    color: #2c5282;
    margin-top: 16px;
    margin-bottom: 6px;
    page-break-after: avoid;
}

p { margin-bottom: 10px; }

ul, ol {
    margin-left: 22px;
    margin-bottom: 10px;
}
li { margin-bottom: 3px; }

code {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 8.5pt;
    background: #f0f4f8;
    border: 1px solid #d0dde8;
    border-radius: 3px;
    padding: 1px 4px;
    color: #c0392b;
}

pre {
    background: #f8f9fa;
    border: 1px solid #d0dde8;
    border-radius: 5px;
    padding: 12px 14px;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 8pt;
    line-height: 1.5;
    overflow: visible;
    white-space: pre-wrap;
    word-break: break-all;
    margin-bottom: 12px;
    page-break-inside: avoid;
}

pre code {
    background: none;
    border: none;
    padding: 0;
    color: #2d3748;
    font-size: inherit;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
    font-size: 9pt;
    page-break-inside: avoid;
}

th {
    background: #1a3a5c;
    color: white;
    padding: 6px 10px;
    text-align: left;
    font-weight: 600;
    font-size: 8.5pt;
}

td {
    padding: 5px 10px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
}

tr:nth-child(even) td { background: #f7fafc; }

blockquote {
    border-left: 4px solid #1a6fb5;
    background: #ebf4ff;
    padding: 8px 14px;
    margin: 10px 0;
    font-size: 9.5pt;
    color: #2c5282;
    border-radius: 0 4px 4px 0;
    page-break-inside: avoid;
}

blockquote p { margin: 0; }

hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 20px 0;
}

em { font-style: italic; color: #555; font-size: 8.5pt; }

a { color: #1a6fb5; text-decoration: none; }
"""


def apply_replacements(text: str) -> str:
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    return text


def md_to_pdf(input_path: str, output_path: str) -> None:
    with open(input_path, encoding="utf-8") as f:
        raw = f.read()

    content = apply_replacements(raw)

    extensions = ["tables", "fenced_code", "codehilite", "toc", "nl2br"]
    body_html = markdown.markdown(content, extensions=extensions)

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
</head>
<body>
{body_html}
</body>
</html>"""

    HTML(string=html, base_url=DOCS_DIR).write_pdf(
        output_path,
        stylesheets=[CSS(string=CSS_STYLES)],
    )
    print(f"  Generado: {output_path}")


if __name__ == "__main__":
    files = [
        ("documentacion-tecnica.md", "documentacion-tecnica.pdf"),
        ("manual-usuario.md", "manual-usuario.pdf"),
    ]
    print("Generando PDFs...")
    for md_file, pdf_file in files:
        md_to_pdf(f"{DOCS_DIR}/{md_file}", f"{DOCS_DIR}/{pdf_file}")
    print("Listo.")
