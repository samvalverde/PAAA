"""
PDF Generation Service

This module provides functionality to generate PDF reports from analytics results.
Moved from Temporal folder to proper backend services module.
"""

import io
from datetime import datetime
from typing import List, Tuple, Dict, Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak,
)

import matplotlib.pyplot as plt


# ==========================
#  Helpers de formato
# ==========================

FECHA_REPORTE = datetime.now().strftime("%d/%m/%Y")


def _encabezado_later_pages(canvas, doc):
    """Encabezado para todas las páginas excepto la portada."""
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillGray(0.5)

    texto = f"PAAA | {FECHA_REPORTE}"
    x = doc.leftMargin
    y = A4[1] - 1.2 * cm  # un poco más arriba del contenido
    canvas.drawString(x, y, texto)

    # Número de página
    canvas.drawRightString(
        A4[0] - doc.rightMargin,
        1.2 * cm,
        f"Página {doc.page}",
    )

    canvas.restoreState()


def _portada_canvas(canvas, doc):
    """No dibujamos encabezado en portada."""
    pass


def _get_styles():
    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="TituloPortada",
            parent=styles["Title"],
            alignment=TA_CENTER,
            fontSize=24,
            spaceAfter=20,
        )
    )

    styles.add(
        ParagraphStyle(
            name="SubtituloPortada",
            parent=styles["Normal"],
            alignment=TA_CENTER,
            fontSize=12,
            spaceAfter=6,
        )
    )

    styles.add(
        ParagraphStyle(
            name="TituloSeccion",
            parent=styles["Heading1"],
            alignment=TA_LEFT,
            fontSize=16,
            spaceBefore=12,
            spaceAfter=6,
        )
    )

    styles.add(
        ParagraphStyle(
            name="SubtituloSeccion",
            parent=styles["Heading2"],
            alignment=TA_LEFT,
            fontSize=12,
            spaceBefore=8,
            spaceAfter=4,
        )
    )

    styles.add(
        ParagraphStyle(
            name="TextoNormal",
            parent=styles["Normal"],
            fontSize=10,
            leading=13,
        )
    )

    styles.add(
        ParagraphStyle(
            name="TextoCentrado",
            parent=styles["Normal"],
            fontSize=10,
            alignment=TA_CENTER,
        )
    )

    return styles


def _formatear_filtros(filtros: Dict[str, Any]) -> str:
    """Convierte el dict de filtros en una cadena legible."""
    partes = []
    for nombre, valor in filtros.items():
        if isinstance(valor, dict):
            gte = valor.get("gte")
            lte = valor.get("lte")
            if gte is not None and lte is not None:
                partes.append(f"{nombre}: {gte} a {lte}")
            elif gte is not None:
                partes.append(f"{nombre}: desde {gte}")
            elif lte is not None:
                partes.append(f"{nombre}: hasta {lte}")
            else:
                partes.append(f"{nombre}: {valor}")
        else:
            partes.append(f"{nombre}: {valor}")
    return "; ".join(partes) if partes else "Sin filtros"


def _tabla_sencilla(headers: List[str], rows: List[List[Any]]) -> Table:
    """Construye una tabla con encabezado gris."""
    data = [headers] + rows
    tabla = Table(data, hAlign="LEFT")
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
            ]
        )
    )
    return tabla


def _grafico_distribucion(dist: Dict[str, float], titulo: str) -> Image:
    """Genera un gráfico de barras a partir de una distribución y lo devuelve como Image."""
    etiquetas = list(dist.keys())
    valores = list(dist.values())

    # Si hay demasiadas categorías, evitamos el gráfico
    if len(etiquetas) == 0 or len(etiquetas) > 20:
        return None

    fig, ax = plt.subplots(figsize=(6, 3))
    ax.bar(range(len(etiquetas)), valores)
    ax.set_xticks(range(len(etiquetas)))
    ax.set_xticklabels(etiquetas, rotation=45, ha="right")
    ax.set_title(titulo)
    ax.set_ylabel("Frecuencia")

    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="PNG", dpi=150)
    plt.close(fig)
    buf.seek(0)

    img = Image(buf, width=16 * cm, height=8 * cm)
    return img


def _agregar_analisis(story, analisis: str, styles):
    if not analisis:
        return
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("Análisis automático", styles["SubtituloSeccion"]))
    for parrafo in analisis.strip().split("\n\n"):
        story.append(Paragraph(parrafo.replace("\n", "<br/>"), styles["TextoNormal"]))
        story.append(Spacer(1, 0.1 * cm))


# ==========================
#  Secciones por tipo
# ==========================

def _seccion_poblacion(story, poblacion: Dict[str, Any], styles):
    dataset = poblacion.get("dataset", "-")
    programa = poblacion.get("programa", "-")
    filtros = poblacion.get("filtros", {}) or {}
    n = poblacion.get("n", None)

    filtros_txt = _formatear_filtros(filtros)

    headers = ["Dataset", "Programa", "Filtros", "Tamaño de la población (n)"]
    rows = [[dataset, programa, filtros_txt, n]]

    story.append(Paragraph("Población objetivo", styles["SubtituloSeccion"]))
    story.append(_tabla_sencilla(headers, rows))
    story.append(Spacer(1, 0.3 * cm))


def _seccion_kpis(story, kpis: Dict[str, Any], styles):
    if not kpis:
        return
    story.append(Paragraph("Indicadores clave", styles["SubtituloSeccion"]))

    headers = ["Indicador", "Valor"]
    rows = []
    for k, v in kpis.items():
        rows.append([str(k), str(v)])

    story.append(_tabla_sencilla(headers, rows))
    story.append(Spacer(1, 0.3 * cm))


def _seccion_tablas(story, tablas: Dict[str, Any], styles):
    if not tablas:
        return
    story.append(Paragraph("Tablas de resultados", styles["SubtituloSeccion"]))

    for nombre_tabla, filas in tablas.items():
        story.append(
            Paragraph(
                nombre_tabla.replace("_", " "),
                styles["TextoNormal"],
            )
        )
        if not filas:
            story.append(Paragraph("Sin datos", styles["TextoNormal"]))
            continue

        # Obtenemos encabezados de la primera fila
        headers = list(filas[0].keys())
        rows = [[fila.get(h, "") for h in headers] for fila in filas]

        story.append(_tabla_sencilla(headers, rows))
        story.append(Spacer(1, 0.3 * cm))


def _seccion_distribuciones(story, distribuciones: Dict[str, Dict[str, float]], styles):
    if not distribuciones:
        return

    story.append(Paragraph("Distribuciones", styles["SubtituloSeccion"]))

    for nombre_var, dist in distribuciones.items():
        titulo = nombre_var.replace("_", " ")
        story.append(Paragraph(f"Variable: {titulo}", styles["TextoNormal"]))

        # Tabla de distribución
        headers = ["Categoría", "Frecuencia"]
        rows = [[cat, valor] for cat, valor in dist.items()]
        story.append(_tabla_sencilla(headers, rows))
        story.append(Spacer(1, 0.1 * cm))

        # Gráfico si es posible
        grafico = _grafico_distribucion(dist, titulo)
        if grafico is not None:
            story.append(grafico)
            story.append(Spacer(1, 0.4 * cm))


def _es_question_detail(resultado_json: Dict[str, Any]) -> bool:
    kpis = (resultado_json.get("resultados") or {}).get("kpis") or {}
    return "variable" in kpis


def _seccion_pregunta_detalle(story, idx: int, resultado_json: Dict[str, Any], analisis: str, styles):
    poblacion = resultado_json.get("poblacion", {}) or {}
    resultados = resultado_json.get("resultados", {}) or {}
    kpis = resultados.get("kpis", {}) or {}
    tablas = resultados.get("tablas", {}) or {}
    distribuciones = resultados.get("distribuciones", {}) or {}

    enunciado = resultado_json.get("enunciado") or kpis.get("variable", f"Pregunta {idx}")

    story.append(
        Paragraph(f"Pregunta {idx}: {enunciado}", styles["TituloSeccion"])
    )
    story.append(Spacer(1, 0.2 * cm))

    _seccion_poblacion(story, poblacion, styles)
    _seccion_kpis(story, kpis, styles)
    _seccion_tablas(story, tablas, styles)
    _seccion_distribuciones(story, distribuciones, styles)
    _agregar_analisis(story, analisis, styles)


def _seccion_general(story, resultado_json: Dict[str, Any], analisis: str, styles):
    poblacion = resultado_json.get("poblacion", {}) or {}
    resultados = resultado_json.get("resultados", {}) or {}
    kpis = resultados.get("kpis", {}) or {}
    tablas = resultados.get("tablas", {}) or {}
    distribuciones = resultados.get("distribuciones", {}) or {}

    story.append(
        Paragraph("Resumen general de la población", styles["TituloSeccion"])
    )
    story.append(Spacer(1, 0.2 * cm))

    _seccion_poblacion(story, poblacion, styles)
    _seccion_kpis(story, kpis, styles)
    _seccion_tablas(story, tablas, styles)
    _seccion_distribuciones(story, distribuciones, styles)
    _agregar_analisis(story, analisis, styles)


# ==========================
#  Funciones públicas
# ==========================

def generar_pdf_detalles(
    conjuntos: List[Tuple[Dict[str, Any], str]],
    output_path: str,
) -> None:
    """
    Genera un PDF con una portada y N secciones de preguntas detalladas.

    conjuntos: lista de tuplas (resultado_json, analisis_str)
    output_path: ruta del archivo PDF a escribir.
    """
    styles = _get_styles()
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    story = []

    # ===== Portada =====
    story.append(Spacer(1, 6 * cm))
    story.append(Paragraph("Reporte de preguntas detalladas", styles["TituloPortada"]))

    # Tomamos dataset y programa de la primera pregunta si existen
    if conjuntos:
        primera_poblacion = (conjuntos[0][0].get("poblacion") or {})
        dataset = primera_poblacion.get("dataset", "N/A")
        programa = primera_poblacion.get("programa", "N/A")
    else:
        dataset = "N/A"
        programa = "N/A"

    story.append(
        Paragraph(f"Dataset: {dataset} | Programa: {programa}", styles["SubtituloPortada"])
    )
    story.append(Paragraph(f"Fecha: {FECHA_REPORTE}", styles["SubtituloPortada"]))
    story.append(Spacer(1, 1 * cm))
    story.append(
        Paragraph("Plataforma de Analítica para Acreditación Académica (PAAA)", styles["SubtituloPortada"])
    )

    story.append(PageBreak())

    # ===== Preguntas =====
    for idx, (resultado_json, analisis) in enumerate(conjuntos, start=1):
        _seccion_pregunta_detalle(story, idx, resultado_json, analisis, styles)
        story.append(PageBreak())

    # Construimos el PDF
    doc.build(
        story,
        onFirstPage=_portada_canvas,
        onLaterPages=_encabezado_later_pages,
    )


def generar_pdf_general(
    resultado_json: Dict[str, Any],
    analisis: str,
    output_path: str,
) -> None:
    """
    Genera un PDF con una portada y una sección de resumen general (un solo json).
    """
    styles = _get_styles()
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    story = []

    # ===== Portada =====
    poblacion = resultado_json.get("poblacion", {}) or {}
    dataset = poblacion.get("dataset", "N/A")
    programa = poblacion.get("programa", "N/A")

    story.append(Spacer(1, 6 * cm))
    story.append(Paragraph("Reporte general de resultados", styles["TituloPortada"]))
    story.append(
        Paragraph(f"Dataset: {dataset} | Programa: {programa}", styles["SubtituloPortada"])
    )
    story.append(Paragraph(f"Fecha: {FECHA_REPORTE}", styles["SubtituloPortada"]))
    story.append(
        Paragraph("Plataforma de Analítica para Acreditación Académica (PAAA)", styles["SubtituloPortada"])
    )
    story.append(PageBreak())

    # ===== Sección general =====
    _seccion_general(story, resultado_json, analisis, styles)

    doc.build(
        story,
        onFirstPage=_portada_canvas,
        onLaterPages=_encabezado_later_pages,
    )