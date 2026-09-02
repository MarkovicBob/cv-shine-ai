# pyright: reportMissingImports=false, reportMissingModuleSource=false
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, ListFlowable, ListItem
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from models.schemas import OptimizedCV

# Color palette — professional, ATS-safe
DARK = HexColor("#1a1a2e")
ACCENT = HexColor("#2563eb")
GRAY = HexColor("#6b7280")
LIGHT_GRAY = HexColor("#f3f4f6")
LINE_COLOR = HexColor("#e5e7eb")


def build_styles():
    """Build all paragraph styles for the CV."""
    styles = {}

    styles["name"] = ParagraphStyle(
        "name",
        fontName="Helvetica-Bold",
        fontSize=22,
        textColor=DARK,
        leading=28,
        alignment=TA_LEFT,
        spaceAfter=4,
    )
    styles["contact"] = ParagraphStyle(
        "contact",
        fontName="Helvetica",
        fontSize=9,
        textColor=GRAY,
        leading=14,
        alignment=TA_LEFT,
        spaceAfter=2,
    )
    styles["section_header"] = ParagraphStyle(
        "section_header",
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=ACCENT,
        leading=16,
        spaceBefore=14,
        spaceAfter=4,
        textTransform="uppercase",
    )
    styles["job_title"] = ParagraphStyle(
        "job_title",
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=DARK,
        leading=15,
        spaceBefore=8,
        spaceAfter=1,
    )
    styles["company_dates"] = ParagraphStyle(
        "company_dates",
        fontName="Helvetica-Oblique",
        fontSize=9,
        textColor=GRAY,
        leading=14,
        spaceAfter=3,
    )
    styles["bullet"] = ParagraphStyle(
        "bullet",
        fontName="Helvetica",
        fontSize=9.5,
        textColor=DARK,
        leading=14,
        leftIndent=12,
        spaceAfter=2,
    )
    styles["body"] = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=9.5,
        textColor=DARK,
        leading=15,
        spaceAfter=3,
    )
    styles["skills_text"] = ParagraphStyle(
        "skills_text",
        fontName="Helvetica",
        fontSize=9.5,
        textColor=DARK,
        leading=15,
        spaceAfter=2,
    )
    styles["edu_degree"] = ParagraphStyle(
        "edu_degree",
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=DARK,
        leading=14,
        spaceBefore=6,
        spaceAfter=1,
    )
    styles["edu_school"] = ParagraphStyle(
        "edu_school",
        fontName="Helvetica",
        fontSize=9.5,
        textColor=GRAY,
        leading=14,
        spaceAfter=2,
    )
    return styles


def section_divider():
    return HRFlowable(
        width="100%",
        thickness=0.5,
        color=LINE_COLOR,
        spaceAfter=6,
        spaceBefore=2,
    )


def generate_pdf(cv: OptimizedCV) -> bytes:
    """Generate a professional, ATS-safe PDF from OptimizedCV data using ReportLab."""
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        title=f"{cv.name or 'CV'} - Optimized CV",
        author=cv.name or "CVMatch Pro",
        subject="ATS-Optimized CV",
    )

    styles = build_styles()
    story = []

    # ── NAME ──────────────────────────────────────────────
    if cv.name:
        story.append(Paragraph(cv.name, styles["name"]))

    # ── CONTACT INFO ──────────────────────────────────────
    contact_parts = []
    if cv.email:
        contact_parts.append(cv.email)
    if cv.phone:
        contact_parts.append(cv.phone)
    if cv.location:
        contact_parts.append(cv.location)
    if cv.linkedin:
        contact_parts.append(cv.linkedin)

    if contact_parts:
        story.append(Paragraph("  |  ".join(contact_parts), styles["contact"]))

    story.append(Spacer(1, 6))
    story.append(section_divider())

    # ── PROFESSIONAL SUMMARY ──────────────────────────────
    if cv.summary:
        story.append(Paragraph("Professional Summary", styles["section_header"]))
        story.append(section_divider())
        story.append(Paragraph(cv.summary, styles["body"]))
        story.append(Spacer(1, 4))

    # ── EXPERIENCE ────────────────────────────────────────
    if cv.experience:
        story.append(Paragraph("Professional Experience", styles["section_header"]))
        story.append(section_divider())

        for exp in cv.experience:
            # Title | Company — Dates
            title_line = exp.title
            if exp.company:
                title_line += f"  —  {exp.company}"
            story.append(Paragraph(title_line, styles["job_title"]))

            if exp.dates:
                story.append(Paragraph(exp.dates, styles["company_dates"]))

            for bullet in (exp.bullets or []):
                cleaned = bullet.lstrip("•-– ").strip()
                if cleaned:
                    story.append(Paragraph(f"• {cleaned}", styles["bullet"]))

            story.append(Spacer(1, 4))

    # ── EDUCATION ─────────────────────────────────────────
    if cv.education:
        story.append(Paragraph("Education", styles["section_header"]))
        story.append(section_divider())

        for edu in cv.education:
            story.append(Paragraph(edu.degree, styles["edu_degree"]))
            school_dates = edu.school
            if edu.dates:
                school_dates += f"  |  {edu.dates}"
            story.append(Paragraph(school_dates, styles["edu_school"]))
            story.append(Spacer(1, 3))

    # ── SKILLS ────────────────────────────────────────────
    if cv.skills:
        story.append(Paragraph("Technical Skills", styles["section_header"]))
        story.append(section_divider())

        # Group skills into rows of ~5 for readability
        chunk_size = 5
        chunks = [cv.skills[i:i+chunk_size] for i in range(0, len(cv.skills), chunk_size)]
        for chunk in chunks:
            story.append(Paragraph("  •  ".join(chunk), styles["skills_text"]))
        story.append(Spacer(1, 4))

    # ── CERTIFICATIONS ────────────────────────────────────
    if cv.certifications:
        story.append(Paragraph("Certifications", styles["section_header"]))
        story.append(section_divider())
        for cert in cv.certifications:
            story.append(Paragraph(f"• {cert}", styles["bullet"]))
        story.append(Spacer(1, 4))

    # ── BUILD PDF ─────────────────────────────────────────
    doc.build(story)
    buffer.seek(0)
    return buffer.read()
