#!/bin/bash

# Create and activate a virtual env
if [ ! -d ".requirements" ]; then
    echo "Creating virtual environment in '.requirements/'..."
    python3 -m venv .requirements/ || { echo "Failed to create virtual environment."; exit 1; }
fi

source .requirements/bin/activate || { echo "Failed to activate virtual environment."; exit 1; }

echo ""
echo "Installing dependencies..."

# Install Python dependencies
if [ -f requirements.txt ]; then
    python3 -m pip install -r requirements.txt || exit 1
else
    echo "No requirements to install..."
fi

# Start generating env.py by copying the main repository's sample_env.py
if [ -f sample_env.py ]; then
    echo ""
    echo "Creating env.py from main repository's sample_env.py..."
    cp sample_env.py env.py || { echo "Failed to create env.py."; exit 1; }
fi
