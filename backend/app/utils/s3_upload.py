"""
Amazon S3 upload utility for KiitEats.
Handles uploading vendor QR code images (and any other files) to S3.
"""
import uuid
import boto3
from fastapi import UploadFile
from app.core.config import get_settings


def _get_s3_client():
    """Create and return a boto3 S3 client using app settings."""
    settings = get_settings()
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_DEFAULT_REGION,
    )


async def upload_file_to_s3(file: UploadFile, folder: str = "vendor-qr") -> str:
    """
    Upload a file to S3 and return its public URL.

    Args:
        file: FastAPI UploadFile from a multipart form submission.
        folder: S3 key prefix (subfolder).

    Returns:
        The public URL of the uploaded object.
    """
    settings = get_settings()
    s3 = _get_s3_client()

    # Generate a unique key to avoid collisions
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "png"
    key = f"{folder}/{uuid.uuid4().hex}.{ext}"

    contents = await file.read()

    s3.put_object(
        Bucket=settings.AWS_S3_BUCKET_NAME,
        Key=key,
        Body=contents,
        ContentType=file.content_type or "image/png",
    )

    # Construct the public URL (bucket is public)
    url = f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_DEFAULT_REGION}.amazonaws.com/{key}"
    return url
