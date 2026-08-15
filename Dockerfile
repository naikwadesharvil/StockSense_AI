FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    ENABLE_LIVE_DATA=true \
    ENVIRONMENT=production \
    PORT=8000 \
    HOST=0.0.0.0

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code and pre-compiled frontend distribution
COPY . .

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import os, urllib.request; urllib.request.urlopen('http://localhost:' + str(os.environ.get('PORT', 8000)) + '/api/health')" || exit 1

CMD ["python", "run_app.py"]
