# ── Stage 1: Build React frontend ────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (better Docker cache)
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

# Copy frontend source and build
COPY frontend/ .
RUN npm run build


# ── Stage 2: FastAPI backend + static files ──────────────────────────────
FROM python:3.10-slim
WORKDIR /app

# System deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Non-root user (required by Hugging Face Spaces)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Python dependencies
COPY --chown=user backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy backend application code
COPY --chown=user backend/app ./app
COPY --chown=user backend/seed_data.py ./seed_data.py

# Copy built React frontend from Stage 1
COPY --from=builder --chown=user /app/dist ./static

# Hugging Face Spaces expects port 7860
EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
