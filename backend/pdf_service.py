"""
PDF Report Generation Service for SecureVision AI
Generates bilingual (English/Arabic) PDF reports with RTL support
"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_RIGHT, TA_LEFT
from io import BytesIO
from typing import Dict, List, Optional, Tuple, Any
import qrcode
import hashlib
from datetime import datetime
from arabic_reshaper import reshape
from bidi.algorithm import get_display


def arabic_text(text: str) -> str:
    """
    Convert Arabic text to display format with proper RTL.
    
    Args:
        text: Input text in Arabic
        
    Returns:
        Properly formatted Arabic text for display
    """
    if not text:
        return ""
    try:
        reshaped_text = reshape(text)
        bidi_text = get_display(reshaped_text)
        return bidi_text
    except Exception:
        return text


def generate_qr_code(data: str) -> BytesIO:
    """
    Generate QR code as image buffer.
    
    Args:
        data: Data to encode in QR code
        
    Returns:
        BytesIO buffer containing PNG image
    """
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer


def generate_verification_hash(scan_id: str, target: str, timestamp: str) -> str:
    """
    Generate verification hash for report authenticity.
    
    Args:
        scan_id: Unique scan identifier
        target: Scan target (URL/IP/file)
        timestamp: Timestamp of scan
        
    Returns:
        16-character verification hash
    """
    data = f"{scan_id}{target}{timestamp}"
    return hashlib.sha256(data.encode()).hexdigest()[:16]


def get_styles(is_rtl: bool) -> Tuple[ParagraphStyle, ParagraphStyle, ParagraphStyle]:
    """
    Create PDF paragraph styles based on language direction.
    
    Args:
        is_rtl: True for RTL (Arabic), False for LTR (English)
        
    Returns:
        Tuple of (title_style, heading_style, normal_style)
    """
    from reportlab.lib.styles import getSampleStyleSheet
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#00F0FF'),
        spaceAfter=30,
        alignment=TA_RIGHT if is_rtl else TA_LEFT,
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#00F0FF'),
        spaceAfter=12,
        alignment=TA_RIGHT if is_rtl else TA_LEFT,
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        alignment=TA_RIGHT if is_rtl else TA_LEFT,
    )
    
    return title_style, heading_style, normal_style


def create_table(data: List[List[str]], is_rtl: bool, col_widths: Optional[List] = None) -> Table:
    """
    Create styled table for PDF report.
    
    Args:
        data: 2D list of table data
        is_rtl: True for RTL layout
        col_widths: Optional column widths
        
    Returns:
        Styled Table object
    """
    if col_widths is None:
        col_widths = [2*inch, 4*inch]
    
    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#121214')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#00F0FF')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT' if is_rtl else 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#27272A'))
    ]))
    
    return table


def build_header_section(story: List, scan_data: Dict, translations: Dict, 
                        is_rtl: bool, styles: Tuple) -> None:
    """
    Add header section to PDF story.
    
    Args:
        story: PDF story list to append to
        scan_data: Scan information dictionary
        translations: Translation strings
        is_rtl: True for RTL layout
        styles: Tuple of paragraph styles
    """
    title_style, heading_style, _ = styles
    
    # App Name Header
    app_name = "SecureVision AI"
    if is_rtl:
        story.append(Paragraph(arabic_text(app_name), title_style))
    else:
        story.append(Paragraph(app_name, title_style))
    
    # Report Title
    report_title = arabic_text(translations['reportTitle']) if is_rtl else translations['reportTitle']
    story.append(Paragraph(report_title, heading_style))
    story.append(Spacer(1, 20))


def build_scan_details_section(story: List, scan_data: Dict, translations: Dict,
                               is_rtl: bool, styles: Tuple) -> None:
    """
    Add scan details section to PDF story.
    
    Args:
        story: PDF story list to append to
        scan_data: Scan information dictionary
        translations: Translation strings
        is_rtl: True for RTL layout
        styles: Tuple of paragraph styles
    """
    _, heading_style, _ = styles
    
    details_title = arabic_text(translations['scanDetails']) if is_rtl else translations['scanDetails']
    story.append(Paragraph(details_title, heading_style))
    
    scan_info = [
        [arabic_text(translations['scanId']) if is_rtl else translations['scanId'], 
         scan_data.get('id', 'N/A')],
        [arabic_text(translations['dateTime']) if is_rtl else translations['dateTime'], 
         datetime.fromisoformat(scan_data.get('timestamp', datetime.now().isoformat())).strftime('%Y-%m-%d %H:%M:%S')],
        [arabic_text(translations['scanType']) if is_rtl else translations['scanType'], 
         scan_data.get('scan_type', 'N/A').upper()],
        [arabic_text(translations['target']) if is_rtl else translations['target'], 
         scan_data.get('target', 'N/A')],
    ]
    
    if is_rtl:
        scan_info = [[row[1], row[0]] for row in scan_info]
    
    table = create_table(scan_info, is_rtl)
    story.append(table)
    story.append(Spacer(1, 20))


def build_threat_assessment_section(story: List, scan_data: Dict, translations: Dict,
                                    is_rtl: bool, styles: Tuple) -> None:
    """
    Add threat assessment section to PDF story.
    
    Args:
        story: PDF story list to append to
        scan_data: Scan information dictionary
        translations: Translation strings
        is_rtl: True for RTL layout
        styles: Tuple of paragraph styles
    """
    _, heading_style, _ = styles
    
    threat_title = arabic_text(translations['threatAssessment']) if is_rtl else translations['threatAssessment']
    story.append(Paragraph(threat_title, heading_style))
    
    risk_level = scan_data.get('risk_level', 'Unknown')
    risk_level_translated = arabic_text(translations.get(risk_level, risk_level)) if is_rtl else translations.get(risk_level, risk_level)
    
    threat_info = [
        [arabic_text(translations['riskLevel']) if is_rtl else translations['riskLevel'], 
         risk_level_translated],
        [arabic_text(translations['riskScore']) if is_rtl else translations['riskScore'], 
         f"{scan_data.get('risk_score', 0):.1f}%"],
        [arabic_text(translations['confidence']) if is_rtl else translations['confidence'], 
         f"{scan_data.get('confidence', 0)*100:.0f}%"],
    ]
    
    if is_rtl:
        threat_info = [[row[1], row[0]] for row in threat_info]
    
    table = create_table(threat_info, is_rtl)
    story.append(table)
    story.append(Spacer(1, 20))


def build_analysis_section(story: List, scan_data: Dict, translations: Dict,
                          is_rtl: bool, styles: Tuple) -> None:
    """
    Add AI analysis section to PDF story.
    
    Args:
        story: PDF story list to append to
        scan_data: Scan information dictionary
        translations: Translation strings
        is_rtl: True for RTL layout
        styles: Tuple of paragraph styles
    """
    _, heading_style, normal_style = styles
    
    analysis_title = arabic_text(translations['aiAnalysis']) if is_rtl else translations['aiAnalysis']
    story.append(Paragraph(analysis_title, heading_style))
    
    explanation = scan_data.get('explanation', 'No analysis available')
    if is_rtl:
        explanation = arabic_text(explanation)
    
    story.append(Paragraph(explanation, normal_style))
    story.append(Spacer(1, 20))


def build_recommendations_section(story: List, scan_data: Dict, translations: Dict,
                                 is_rtl: bool, styles: Tuple, language: str) -> None:
    """
    Add security recommendations section to PDF story.
    
    Args:
        story: PDF story list to append to
        scan_data: Scan information dictionary
        translations: Translation strings
        is_rtl: True for RTL layout
        styles: Tuple of paragraph styles
        language: Language code ('en' or 'ar')
    """
    _, heading_style, normal_style = styles
    
    rec_title = arabic_text(translations['recommendations']) if is_rtl else translations['recommendations']
    story.append(Paragraph(rec_title, heading_style))
    
    recommendations = get_recommendations(scan_data.get('risk_level', 'Unknown'), language)
    for rec in recommendations:
        rec_text = arabic_text(f"• {rec}") if is_rtl else f"• {rec}"
        story.append(Paragraph(rec_text, normal_style))
        story.append(Spacer(1, 6))
    
    story.append(Spacer(1, 20))


def build_verification_section(story: List, scan_data: Dict, translations: Dict,
                               is_rtl: bool, styles: Tuple) -> None:
    """
    Add report verification section to PDF story.
    
    Args:
        story: PDF story list to append to
        scan_data: Scan information dictionary
        translations: Translation strings
        is_rtl: True for RTL layout
        styles: Tuple of paragraph styles
    """
    import os
    _, heading_style, normal_style = styles
    
    verify_title = arabic_text(translations['verificationInfo']) if is_rtl else translations['verificationInfo']
    story.append(Paragraph(verify_title, heading_style))
    
    # Generate verification hash
    verification_hash = generate_verification_hash(
        scan_data.get('id', ''), 
        scan_data.get('target', ''),
        scan_data.get('timestamp', '')
    )
    
    # QR Code with dynamic URL from environment
    app_url = os.environ.get('APP_URL', 'https://securevision.ai')
    qr_data = f"{app_url}/verify/{scan_data.get('id', '')}"
    qr_buffer = generate_qr_code(qr_data)
    qr_img = Image(qr_buffer, width=1.5*inch, height=1.5*inch)
    
    verify_info = [
        [arabic_text(translations['reportId']) if is_rtl else translations['reportId'], 
         scan_data.get('id', 'N/A')[:16] + '...'],
        [arabic_text(translations['verificationHash']) if is_rtl else translations['verificationHash'], 
         verification_hash],
    ]
    
    if is_rtl:
        verify_info = [[row[1], row[0]] for row in verify_info]
    
    table = create_table(verify_info, is_rtl)
    story.append(table)
    story.append(Spacer(1, 10))
    story.append(qr_img)
    
    qr_desc = arabic_text(translations['scanQR']) if is_rtl else translations['scanQR']
    story.append(Paragraph(qr_desc, normal_style))


def get_default_translations(language: str) -> Dict[str, str]:
    """
    Get default translations for given language.
    
    Args:
        language: Language code ('en' or 'ar')
        
    Returns:
        Dictionary of translation strings
    """
    translations_en = {
        'reportTitle': 'Security Scan Report',
        'scanDetails': 'Scan Details',
        'scanId': 'Scan ID',
        'dateTime': 'Date & Time',
        'scanType': 'Scan Type',
        'target': 'Target',
        'threatAssessment': 'Threat Assessment',
        'riskLevel': 'Risk Level',
        'riskScore': 'Risk Score',
        'confidence': 'Confidence',
        'aiAnalysis': 'AI Threat Analysis',
        'recommendations': 'Security Recommendations',
        'verificationInfo': 'Report Verification',
        'reportId': 'Report ID',
        'verificationHash': 'Verification Hash',
        'scanQR': 'Scan QR code to verify report authenticity',
        'generatedBy': 'Generated by',
        'page': 'Page',
        'Safe': 'Safe',
        'Suspicious': 'Suspicious',
        'Malicious': 'Malicious',
    }
    
    translations_ar = {
        'reportTitle': 'تقرير فحص أمني',
        'scanDetails': 'تفاصيل الفحص',
        'scanId': 'معرف الفحص',
        'dateTime': 'التاريخ والوقت',
        'scanType': 'نوع الفحص',
        'target': 'الهدف',
        'threatAssessment': 'تقييم التهديد',
        'riskLevel': 'مستوى المخاطر',
        'riskScore': 'درجة المخاطر',
        'confidence': 'الثقة',
        'aiAnalysis': 'تحليل التهديد بالذكاء الاصطناعي',
        'recommendations': 'التوصيات الأمنية',
        'verificationInfo': 'التحقق من التقرير',
        'reportId': 'معرف التقرير',
        'verificationHash': 'رمز التحقق',
        'scanQR': 'امسح رمز QR للتحقق من صحة التقرير',
        'generatedBy': 'تم إنشاؤه بواسطة',
        'page': 'صفحة',
        'Safe': 'آمن',
        'Suspicious': 'مشبوه',
        'Malicious': 'ضار',
    }
    
    return translations_ar if language == 'ar' else translations_en


def create_pdf_report(scan_data: Dict[str, Any], language: str = 'en', 
                     translations: Optional[Dict[str, str]] = None) -> BytesIO:
    """
    Generate PDF report in specified language with proper RTL/LTR formatting.
    
    Args:
        scan_data: Dictionary containing scan information
        language: 'en' or 'ar'
        translations: Optional dictionary of translated strings
    
    Returns:
        BytesIO buffer containing the generated PDF
    """
    buffer = BytesIO()
    is_rtl = language == 'ar'
    
    # Setup document
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=72, 
        leftMargin=72,
        topMargin=72, 
        bottomMargin=18
    )
    
    # Get translations
    if not translations:
        translations = get_default_translations(language)
    
    # Get styles
    styles = get_styles(is_rtl)
    
    # Build PDF story
    story = []
    
    build_header_section(story, scan_data, translations, is_rtl, styles)
    build_scan_details_section(story, scan_data, translations, is_rtl, styles)
    build_threat_assessment_section(story, scan_data, translations, is_rtl, styles)
    build_analysis_section(story, scan_data, translations, is_rtl, styles)
    build_recommendations_section(story, scan_data, translations, is_rtl, styles, language)
    build_verification_section(story, scan_data, translations, is_rtl, styles)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return buffer


def get_recommendations(risk_level: str, language: str = 'en') -> List[str]:
    """
    Get security recommendations based on risk level.
    
    Args:
        risk_level: Risk level ('Safe', 'Suspicious', 'Malicious')
        language: Language code ('en' or 'ar')
        
    Returns:
        List of recommendation strings
    """
    recommendations_en = {
        'Safe': [
            'Continue monitoring this target regularly',
            'Maintain current security protocols',
            'Keep security software up to date',
        ],
        'Suspicious': [
            'Exercise caution when interacting with this target',
            'Verify authenticity through alternative channels',
            'Enable additional security monitoring',
            'Consider blocking if suspicious activity persists',
        ],
        'Malicious': [
            'DO NOT interact with this target',
            'Block access immediately',
            'Report to security team',
            'Scan all systems that may have been exposed',
            'Change credentials if any were shared',
        ]
    }
    
    recommendations_ar = {
        'Safe': [
            'استمر في مراقبة هذا الهدف بانتظام',
            'حافظ على بروتوكولات الأمان الحالية',
            'حافظ على تحديث برامج الأمان',
        ],
        'Suspicious': [
            'توخ الحذر عند التفاعل مع هذا الهدف',
            'تحقق من الأصالة عبر قنوات بديلة',
            'قم بتفعيل مراقبة أمنية إضافية',
            'فكر في الحظر إذا استمر النشاط المشبوه',
        ],
        'Malicious': [
            'لا تتفاعل مع هذا الهدف',
            'احظر الوصول فوراً',
            'أبلغ فريق الأمن',
            'افحص جميع الأنظمة التي قد تكون معرضة',
            'غير بيانات الاعتماد إذا تم مشاركتها',
        ]
    }
    
    recs = recommendations_ar if language == 'ar' else recommendations_en
    return recs.get(risk_level, recs.get('Suspicious', []))
