FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create necessary directories
RUN mkdir -p storage/pdfs

# Expose port
EXPOSE 5000

# Run the app
CMD ["python", "app.py"]
