from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from pydantic import BaseModel, Field
from typing import List
import re

from app.core.database import get_database
from app.core.security import get_current_user, require_roles
from app.utils.token_generator import generate_token_number, generate_verification_id
from app.schemas.food_schema import TransactionResponse
from app.models.payment import transaction_document, COLLECTION_NAME as TXN_COLLECTION
from app.core.ws_manager import manager as ws_manager

router = APIRouter(prefix="/payments", tags=["Payments"])


# ── Schemas ──────────────────────────────────────────────────────────────

class PaymentWebhook(BaseModel):
    """Simulated UPI payment webhook payload."""
    order_id: str = Field(..., examples=["64abc..."])
    payment_status: str = Field(..., pattern="^(success|failed)$", examples=["success"])
    transaction_id: str = Field(default="", examples=["TXN123456"])


class VerifyDelivery(BaseModel):
    """Vendor verifies delivery using token + verification ID."""
    token_number: int = Field(..., examples=[1])
    verification_id: str = Field(..., examples=["A1B2C3D4"])


class UTRSubmission(BaseModel):
    """Student submits UTR after UPI payment."""
    order_id: str = Field(..., examples=["64abc..."])
    utr_number: str = Field(..., min_length=12, max_length=12, examples=["123456789012"])


class AutoVerifyPayload(BaseModel):
    """Google Apps Script sends UTR + amount for auto-verification."""
    utr_number: str = Field(..., min_length=12, max_length=12, examples=["123456789012"])
    amount: float = Field(..., gt=0, examples=[150.00])


# ── Routes ───────────────────────────────────────────────────────────────

@router.post("/webhook")
async def payment_webhook(
    data: PaymentWebhook,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Webhook endpoint called by the UPI payment gateway after payment.
    On success: updates payment status, generates token & verification ID,
    and records the transaction.
    """
    if not ObjectId.is_valid(data.order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")

    order = await db.orders.find_one({"_id": ObjectId(data.order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["payment_status"] == "paid":
        return {"message": "Payment already processed"}

    if data.payment_status == "success":
        # Generate token number and verification ID
        token_num = await generate_token_number(db, order["vendor_id"])
        ver_id = generate_verification_id()

        await db.orders.update_one(
            {"_id": ObjectId(data.order_id)},
            {
                "$set": {
                    "payment_status": "paid",
                    "token_number": token_num,
                    "verification_id": ver_id,
                    "transaction_id": data.transaction_id,
                }
            },
        )

        # Record transaction in payment_transactions collection
        txn_doc = transaction_document(
            order_id=data.order_id,
            vendor_id=order["vendor_id"],
            user_id=order["user_id"],
            amount=order.get("total_amount", 0),
            transaction_id=data.transaction_id,
            status="success",
            items=order.get("items", []),
            token_number=token_num,
        )
        await db[TXN_COLLECTION].insert_one(txn_doc)

        return {
            "message": "Payment confirmed",
            "token_number": token_num,
            "verification_id": ver_id,
        }
    else:
        await db.orders.update_one(
            {"_id": ObjectId(data.order_id)},
            {"$set": {"payment_status": "failed"}},
        )

        # Record failed transaction
        txn_doc = transaction_document(
            order_id=data.order_id,
            vendor_id=order["vendor_id"],
            user_id=order["user_id"],
            amount=order.get("total_amount", 0),
            transaction_id=data.transaction_id,
            status="failed",
            items=order.get("items", []),
        )
        await db[TXN_COLLECTION].insert_one(txn_doc)

        return {"message": "Payment failed"}


# ── UTR Submission (Trust-Based Soft-Success) ────────────────────────────

@router.post("/submit-utr")
async def submit_utr(
    data: UTRSubmission,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """
    Student submits the 12-digit UTR after making UPI payment.
    Order is immediately pushed to kitchen (soft-success) and flagged
    as 'verification_pending' for background verification.
    """
    if not ObjectId.is_valid(data.order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")

    # Validate UTR format (12 digits)
    if not re.match(r"^\d{12}$", data.utr_number):
        raise HTTPException(status_code=400, detail="UTR must be exactly 12 digits")

    order = await db.orders.find_one({"_id": ObjectId(data.order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["payment_status"] == "paid":
        return {
            "message": "Payment already verified",
            "token_number": order.get("token_number"),
            "verification_id": order.get("verification_id"),
        }

    # Check for duplicate UTR
    existing = await db.orders.find_one({
        "utr_number": data.utr_number,
        "_id": {"$ne": ObjectId(data.order_id)},
    })
    if existing:
        raise HTTPException(status_code=400, detail="This UTR has already been used for another order")

    # Trust-based: generate token immediately, mark verification_pending
    token_num = await generate_token_number(db, order["vendor_id"])
    ver_id = generate_verification_id()

    await db.orders.update_one(
        {"_id": ObjectId(data.order_id)},
        {
            "$set": {
                "payment_status": "verification_pending",
                "utr_number": data.utr_number,
                "token_number": token_num,
                "verification_id": ver_id,
                "payment_method": "upi_intent",
            }
        },
    )

    # Record transaction as verification_pending
    txn_doc = transaction_document(
        order_id=data.order_id,
        vendor_id=order["vendor_id"],
        user_id=order["user_id"],
        amount=order.get("total_amount", 0),
        transaction_id=f"UTR_{data.utr_number}",
        status="verification_pending",
        items=order.get("items", []),
        token_number=token_num,
        utr_number=data.utr_number,
        verification_method="utr_submit",
    )
    await db[TXN_COLLECTION].insert_one(txn_doc)

    # Broadcast real-time update so user tracking page refreshes
    await ws_manager.broadcast_order_update(data.order_id, {
        "type": "order_update",
        "order_id": data.order_id,
        "status": "pending",
        "payment_status": "verification_pending",
        "token_number": token_num,
        "verification_id": ver_id,
    })

    return {
        "message": "UTR submitted. Order pushed to kitchen — verification in progress.",
        "token_number": token_num,
        "verification_id": ver_id,
        "payment_status": "verification_pending",
    }


# ── Manual Vendor Approval ───────────────────────────────────────────────

@router.post("/manual-approve/{order_id}")
async def manual_approve(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """
    Vendor manually approves payment after visually verifying
    the student's phone screen (bypass automation).
    """
    if current_user["role"] not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Only vendors can manually approve payments")

    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")

    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["payment_status"] == "paid":
        return {"message": "Payment already verified"}

    # Generate token if not already present
    token_num = order.get("token_number")
    ver_id = order.get("verification_id")
    if not token_num:
        token_num = await generate_token_number(db, order["vendor_id"])
        ver_id = generate_verification_id()

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "payment_status": "paid",
                "token_number": token_num,
                "verification_id": ver_id,
            }
        },
    )

    # Update or create transaction record
    await db[TXN_COLLECTION].update_one(
        {"order_id": order_id},
        {
            "$set": {
                "status": "success",
                "verification_method": "manual",
            }
        },
        upsert=False,
    )

    # If no transaction exists yet, create one
    existing_txn = await db[TXN_COLLECTION].find_one({"order_id": order_id})
    if not existing_txn:
        txn_doc = transaction_document(
            order_id=order_id,
            vendor_id=order["vendor_id"],
            user_id=order["user_id"],
            amount=order.get("total_amount", 0),
            transaction_id=f"MANUAL_{order_id}",
            status="success",
            items=order.get("items", []),
            token_number=token_num,
            verification_method="manual",
        )
        await db[TXN_COLLECTION].insert_one(txn_doc)

    return {
        "message": "Payment manually approved by vendor",
        "token_number": token_num,
        "verification_id": ver_id,
    }


# ── Auto-Verify via Google Apps Script ───────────────────────────────────

@router.post("/auto-verify")
async def auto_verify(
    data: AutoVerifyPayload,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Called by Google Apps Script after finding a matching bank credit alert.
    Matches UTR + amount to a pending order and marks it as paid.
    """
    # Find order with matching UTR and verification_pending status
    order = await db.orders.find_one({
        "utr_number": data.utr_number,
        "payment_status": "verification_pending",
    })

    if not order:
        raise HTTPException(
            status_code=404,
            detail="No pending order found with this UTR",
        )

    # Verify amount matches (allow ±1 rupee tolerance for rounding)
    if abs(order["total_amount"] - data.amount) > 1.0:
        raise HTTPException(
            status_code=400,
            detail=f"Amount mismatch: expected ₹{order['total_amount']}, got ₹{data.amount}",
        )

    await db.orders.update_one(
        {"_id": order["_id"]},
        {"$set": {"payment_status": "paid"}},
    )

    # Update transaction record
    await db[TXN_COLLECTION].update_one(
        {"order_id": str(order["_id"]), "utr_number": data.utr_number},
        {
            "$set": {
                "status": "success",
                "verification_method": "auto_gmail",
            }
        },
    )

    return {
        "message": "Payment verified via bank alert",
        "order_id": str(order["_id"]),
    }


@router.post("/verify-delivery")
async def verify_delivery(
    data: VerifyDelivery,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """
    Vendor verifies delivery by entering the student's token number
    and verification ID. Marks order as delivered.
    """
    # Only vendors can verify
    if current_user["role"] not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Only vendors can verify delivery")

    # Find the order by token + verification ID (accept both paid and verification_pending)
    order = await db.orders.find_one({
        "token_number": data.token_number,
        "verification_id": data.verification_id,
        "payment_status": {"$in": ["paid", "verification_pending"]},
    })

    if not order:
        raise HTTPException(
            status_code=404,
            detail="No matching order found. Check token number and verification ID.",
        )

    if order["status"] == "delivered":
        return {"message": "Order already delivered"}

    # Mark as delivered
    await db.orders.update_one(
        {"_id": order["_id"]},
        {"$set": {"status": "delivered"}},
    )

    # Broadcast completion to user's tracking page
    order_id_str = str(order["_id"])
    await ws_manager.broadcast_order_update(order_id_str, {
        "type": "order_update",
        "order_id": order_id_str,
        "status": "delivered",
        "payment_status": order.get("payment_status"),
        "token_number": order.get("token_number"),
        "verification_id": order.get("verification_id"),
    })

    return {
        "message": "Delivery verified! Order marked as delivered.",
        "order_id": order_id_str,
    }


@router.get("/vendor/transactions", response_model=List[TransactionResponse])
async def get_vendor_transactions(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_roles("vendor", "admin")),
):
    """Get all payment transactions for the current vendor, sorted by newest first."""
    # Find the vendor for this user
    vendor = await db.vendors.find_one({"owner_user_id": current_user["_id"]})
    if not vendor:
        return []

    vendor_id = str(vendor["_id"])
    transactions = await db[TXN_COLLECTION].find(
        {"vendor_id": vendor_id}
    ).sort("created_at", -1).to_list(200)

    for t in transactions:
        t["_id"] = str(t["_id"])

    return transactions


@router.get("/qr/{order_id}")
async def get_payment_qr(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Get payment details for a specific order including the static QR code."""
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")

    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["payment_status"] == "paid":
        return {"message": "Already paid", "token_number": order.get("token_number")}

    # Return static QR image — served from frontend public directory
    return {
        "order_id": order_id,
        "qr_image_url": "/qr.jpeg",
        "amount": order["total_amount"],
    }


