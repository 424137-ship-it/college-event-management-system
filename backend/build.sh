#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

# Install python dependencies
pip install -r requirements.txt

# Collect static files for Django Admin & REST framework
python manage.py collectstatic --no-input

# Run database migrations
python manage.py migrate

# Optional: seed initial admin & sample data if needed
python seed_harshax.py || true
