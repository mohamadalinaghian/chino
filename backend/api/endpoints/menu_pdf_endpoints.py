# backend/api/endpoints/menu_pdf_endpoints.py
from io import BytesIO

import arabic_reshaper
from apps.menu.models import Menu, MenuCategory
from bidi.algorithm import get_display
from django.http import HttpResponse
from ninja import Router
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A6
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

# Router
router_menu_pdf = Router(tags=["menu"])

# Font registration
FONT_PATH = "/app/assets/fonts/Vazirmatn-Regular.ttf"
FONT_NAME = "Vazir"
pdfmetrics.registerFont(TTFont(FONT_NAME, FONT_PATH))

# Colors (Cappuccino palette - choice I)
PAGE_BG = HexColor("#EFE3D1")  # background
CARD_BG = HexColor("#FFFFFF")  # card background
BORDER_COLOR = HexColor("#B88A63")  # border / warm brown
SHADOW_COLOR = HexColor("#00000012")  # subtle shadow (semi-transparent)
CATEGORY_COLOR = HexColor("#5A4230")  # category text color
DIVIDER_COLOR = HexColor("#B88A63")  # divider (same as border)

# Layout constants (medium compact — choice B)
PAGE_MARGIN_TOP = 15
PAGE_MARGIN_BOTTOM = 15
PAGE_MARGIN_LEFT = 12
PAGE_MARGIN_RIGHT = 12

# Card paddings (reduced ~35%)
CARD_PADDING_LEFT = 9
CARD_PADDING_RIGHT = 9
CARD_PADDING_TOP = 8
CARD_PADDING_BOTTOM = 9

# Spacing
SPACER_AFTER_HEADER = 10
SPACER_BETWEEN_ITEMS = 8
SPACER_BETWEEN_CATEGORIES = 18
DIVIDER_TOP_BOTTOM = 12

# Shadow offset (reduced)
SHADOW_OFFSET_X = 3
SHADOW_OFFSET_Y = -3

# Card corner radius
CARD_RADIUS = 6


# Paragraph styles
def build_styles():
    return {
        "header": ParagraphStyle(
            name="header",
            fontName=FONT_NAME,
            fontSize=20,
            leading=24,
            alignment=TA_CENTER,
            textColor=CATEGORY_COLOR,
            spaceAfter=SPACER_AFTER_HEADER,
        ),
        "category_title": ParagraphStyle(
            name="category_title",
            fontName=FONT_NAME,
            fontSize=14,
            leading=18,
            alignment=TA_RIGHT,
            textColor=CATEGORY_COLOR,
            spaceBefore=6,
            spaceAfter=6,
        ),
        "category_desc": ParagraphStyle(
            name="category_desc",
            fontName=FONT_NAME,
            fontSize=9,
            leading=12,
            alignment=TA_RIGHT,
            textColor=HexColor("#666666"),
            spaceAfter=8,
        ),
        "item_name": ParagraphStyle(
            name="item_name",
            fontName=FONT_NAME,
            fontSize=11,
            leading=13,
            alignment=TA_RIGHT,
            textColor=HexColor("#333333"),
            spaceAfter=4,
        ),
        "item_desc": ParagraphStyle(
            name="item_desc",
            fontName=FONT_NAME,
            fontSize=9,
            leading=11,
            alignment=TA_RIGHT,
            textColor=HexColor("#666666"),
            spaceAfter=6,
        ),
    }


# RTL helper
def shape_rtl(text: str) -> str:
    if not text:
        return ""
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)


# Main endpoint
@router_menu_pdf.get(
    "/lightweight-pdf", summary="Beautiful Persian Café Menu PDF (single long page)"
)
def lightweight_pdf(request):
    """
    Generate a single long-page PDF (auto-height) containing the whole menu.
    Uses manual canvas drawing after measuring content with Paragraph.wrap().
    """

    # Query content
    categories = list(MenuCategory.objects.order_by("order"))
    items_qs = (
        Menu.objects.filter(is_available=True, show_in_menu=True)
        .select_related("category", "name")
        .order_by("category__order", "order")
    )

    grouped = {}
    for item in items_qs:
        grouped.setdefault(item.category_id, []).append(item)

    styles = build_styles()

    # Paper width (A6 width) and minimal height (use at least standard A6 height)
    page_width_pt = A6[0]
    min_page_height_pt = A6[1]

    # Usable width inside margins
    usable_width = page_width_pt - PAGE_MARGIN_LEFT - PAGE_MARGIN_RIGHT

    # Card width (leave extra space for shadow offset)
    card_width = usable_width
    card_inner_width = card_width - (CARD_PADDING_LEFT + CARD_PADDING_RIGHT)

    # Prepare flow measuring
    elements_to_draw = []  # list of dicts: {type, h, data...}
    total_height = 0

    # Header
    header_para = Paragraph(shape_rtl("کافه چینو"), styles["header"])
    w, h = header_para.wrap(usable_width, 1000)
    elements_to_draw.append({"type": "header", "para": header_para, "w": w, "h": h})
    total_height += h + SPACER_AFTER_HEADER

    # Iterate categories and items to compute heights
    for cat in categories:
        # Category title
        cat_title_para = Paragraph(shape_rtl(cat.title or ""), styles["category_title"])
        w, h = cat_title_para.wrap(usable_width, 1000)
        elements_to_draw.append(
            {"type": "category_title", "para": cat_title_para, "w": w, "h": h}
        )
        total_height += h

        # Category description (optional)
        if cat.description:
            cat_desc_para = Paragraph(
                shape_rtl(cat.description), styles["category_desc"]
            )
            w, h = cat_desc_para.wrap(usable_width, 1000)
            elements_to_draw.append(
                {"type": "category_desc", "para": cat_desc_para, "w": w, "h": h}
            )
            total_height += h

        cat_items = grouped.get(cat.id, [])
        if not cat_items:
            # small spacer when no items
            total_height += SPACER_BETWEEN_ITEMS
            elements_to_draw.append({"type": "spacer", "h": SPACER_BETWEEN_ITEMS})
            continue

        for mi in cat_items:
            prod_name = getattr(mi.name, "name", "") or ""
            desc = mi.description or ""

            name_para = Paragraph(shape_rtl(prod_name), styles["item_name"])
            nw, nh = name_para.wrap(card_inner_width, 1000)

            desc_para = Paragraph(shape_rtl(desc) if desc else " ", styles["item_desc"])
            dw, dh = desc_para.wrap(card_inner_width, 1000)

            # card content height = paddings + para heights
            card_content_height = CARD_PADDING_TOP + nh + dh + CARD_PADDING_BOTTOM

            # Add shadow offset spacing, and item-to-item spacing
            total_card_space = (
                card_content_height + SPACER_BETWEEN_ITEMS + abs(SHADOW_OFFSET_Y)
            )

            elements_to_draw.append(
                {
                    "type": "item_card",
                    "name_para": name_para,
                    "desc_para": desc_para,
                    "card_h": card_content_height,
                    "name_h": nh,
                    "desc_h": dh,
                }
            )

            total_height += total_card_space

        # Divider between categories
        total_height += DIVIDER_TOP_BOTTOM * 2 + 1  # line + top/bottom padding
        elements_to_draw.append({"type": "divider", "h": DIVIDER_TOP_BOTTOM * 2 + 1})

    # Fallback if no menu content (ensure some text)
    only_paragraphs = [
        e
        for e in elements_to_draw
        if e["type"] in ("header", "category_title", "category_desc", "item_card")
    ]
    if len(only_paragraphs) <= 1:
        empty_para = Paragraph(shape_rtl("منویی موجود نیست"), styles["category_title"])
        w, h = empty_para.wrap(usable_width, 1000)
        elements_to_draw.append({"type": "empty", "para": empty_para, "w": w, "h": h})
        total_height += h

    # Add top & bottom margins
    total_height += PAGE_MARGIN_TOP + PAGE_MARGIN_BOTTOM

    # Ensure at least the minimal A6 page height
    page_height_pt = max(min_page_height_pt, total_height)

    # Create canvas with computed single-page size
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=(page_width_pt, page_height_pt))

    # Draw background full page
    c.saveState()
    c.setFillColor(PAGE_BG)
    c.rect(0, 0, page_width_pt, page_height_pt, fill=1, stroke=0)
    c.restoreState()

    # Starting y (top of content)
    y = page_height_pt - PAGE_MARGIN_TOP

    # Draw elements in order
    for e in elements_to_draw:
        etype = e["type"]

        if etype == "header":
            para = e["para"]
            w, h = para.wrap(usable_width, 1000)
            # center horizontally
            x = PAGE_MARGIN_LEFT + (usable_width - w) / 2
            # draw at y-h (wrap uses top-down)
            para.drawOn(c, x, y - h)
            y -= h + SPACER_AFTER_HEADER

        elif etype in ("category_title", "category_desc"):
            para = e["para"]
            w, h = para.wrap(usable_width, 1000)
            # right-aligned within margins
            x = PAGE_MARGIN_LEFT
            # Paragraph is RTL and alignment is TA_RIGHT, wrap has produced width w which equals usable_width
            para.drawOn(c, x, y - h)
            y -= h

        elif etype == "spacer":
            y -= e["h"]

        elif etype == "item_card":
            # card outer coordinates (x,y) => bottom-left of the card rectangle
            card_h = e["card_h"]
            card_w = card_width

            # compute positions
            x_card = PAGE_MARGIN_LEFT
            y_card_bottom = y - card_h  # because y is top cursor
            # Draw shadow (slightly offset)
            c.saveState()
            c.setFillColor(SHADOW_COLOR)
            # shadow rect: offset by SHADOW_OFFSET_X, SHADOW_OFFSET_Y
            c.roundRect(
                x_card + SHADOW_OFFSET_X,
                y_card_bottom + SHADOW_OFFSET_Y,
                card_w,
                card_h,
                CARD_RADIUS,
                fill=1,
                stroke=0,
            )
            c.restoreState()

            # Draw card background and border
            c.saveState()
            c.setFillColor(CARD_BG)
            c.setStrokeColor(BORDER_COLOR)
            c.setLineWidth(1)
            c.roundRect(
                x_card, y_card_bottom, card_w, card_h, CARD_RADIUS, fill=1, stroke=1
            )
            c.restoreState()

            # Draw inner paragraphs: name then desc
            name_para = e["name_para"]
            desc_para = e["desc_para"]
            # inner x start (left of text box). Because we use RTL Paragraphs aligned right,
            # we place them at x_inner and give full inner width (card_inner_width)
            x_inner = x_card + CARD_PADDING_LEFT
            # y position: start from top inside card
            y_inner_top = y_card_bottom + card_h - CARD_PADDING_TOP

            # name
            nw, nh = name_para.wrap(card_inner_width, 1000)
            # draw name: for right alignment inside the inner width, drawOn at x_inner, y_inner_top - nh
            name_para.drawOn(c, x_inner, y_inner_top - nh)
            # desc
            dw, dh = desc_para.wrap(card_inner_width, 1000)
            desc_para.drawOn(c, x_inner, y_inner_top - nh - dh)

            # move cursor down: account for card height plus small item spacing and absolute shadow Y
            y -= card_h + SPACER_BETWEEN_ITEMS + abs(SHADOW_OFFSET_Y)

        elif etype == "divider":
            # draw a horizontal line across usable width, with top/bottom padding already accounted in measured height
            # place it at y - DIVIDER_TOP_BOTTOM (line center)
            y_line = y - DIVIDER_TOP_BOTTOM
            x1 = PAGE_MARGIN_LEFT + 0
            x2 = PAGE_MARGIN_LEFT + usable_width
            c.saveState()
            c.setStrokeColor(DIVIDER_COLOR)
            c.setLineWidth(1.2)
            c.line(x1, y_line, x2, y_line)
            c.restoreState()
            y -= e["h"]

        elif etype == "empty":
            para = e["para"]
            w, h = para.wrap(usable_width, 1000)
            para.drawOn(c, PAGE_MARGIN_LEFT, y - h)
            y -= h

        else:
            # unknown type: skip safe
            continue

    # Finalize PDF
    c.showPage()
    c.save()

    pdf_bytes = buffer.getvalue()
    buffer.close()

    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="chino_menu_long.pdf"'
    return response
