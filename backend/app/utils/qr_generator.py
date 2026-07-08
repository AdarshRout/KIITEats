"""
UPI QR Code Generator — creates a UPI payment QR code as a base64 string.
"""
import io
import base64
import qrcode
from app.core.config import get_settings

settings = get_settings()


def generate_upi_qr(
    amount: float,
    order_id: str,
    note: str = "KiitEats Order Payment",
) -> str:
    """
    Generate a UPI payment QR code and return it as a base64-encoded PNG string.

    The UPI deep link format:
    upi://pay?pa=<merchant_id>&pn=<merchant_name>&am=<amount>&tn=<note>&tr=<ref>
    """
    upi_url = (
        f"upi://pay?"
        f"pa={settings.UPI_MERCHANT_ID}"
        f"&pn={settings.UPI_MERCHANT_NAME}"
        f"&am={amount:.2f}"
        f"&tn={note}"
        f"&tr={order_id}"
        f"&cu=INR"
    )

    # Generate QR code image
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(upi_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    b64_string = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return f"data:image/png;base64,{b64_string}"
