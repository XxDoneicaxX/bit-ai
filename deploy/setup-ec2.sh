#!/usr/bin/env bash
# Run this on a fresh EC2 instance (Ubuntu 22.04, GPU drivers already installed
# via the Deep Learning AMI) to set up Ollama + the Bit backend.
#
# Usage: bash setup-ec2.sh
set -euo pipefail

REPO_URL="https://github.com/XxDoneicaxX/bit-ai.git"
APP_DIR="$HOME/bit-ai"
MODEL_NAME="gemma4:e4b"

echo "==> Installing Ollama"
curl -fsSL https://ollama.com/install.sh | sh

echo "==> Pulling the model (this can take a while, it's several GB)"
ollama pull "$MODEL_NAME"

echo "==> Installing Python + git"
sudo apt-get update -y
sudo apt-get install -y python3-pip python3-venv git

if [ -d "$APP_DIR" ]; then
  echo "==> Repo already exists at $APP_DIR, pulling latest"
  git -C "$APP_DIR" pull
else
  echo "==> Cloning repo"
  git clone "$REPO_URL" "$APP_DIR"
fi

echo "==> Setting up Python venv"
cd "$APP_DIR/backend"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

if [ ! -f "$APP_DIR/backend/.env" ]; then
  echo "==> Writing backend/.env (edit ALLOWED_ORIGINS once your frontend is deployed)"
  cat > "$APP_DIR/backend/.env" <<EOF
ALLOWED_ORIGINS=http://localhost:5173
OLLAMA_URL=http://localhost:11434/api/chat
OLLAMA_MODEL=$MODEL_NAME
EOF
else
  echo "==> backend/.env already exists, leaving it alone"
fi

echo "==> Installing systemd service"
sudo cp "$APP_DIR/deploy/bit-backend.service" /etc/systemd/system/bit-backend.service
sudo sed -i "s#__APP_DIR__#$APP_DIR#g; s#__USER__#$(whoami)#g" /etc/systemd/system/bit-backend.service
sudo systemctl daemon-reload
sudo systemctl enable bit-backend
sudo systemctl restart bit-backend

echo "==> Done. Checking status:"
sleep 2
sudo systemctl status bit-backend --no-pager
echo
echo "Backend should be reachable at http://<this-instance-public-ip>:8000/chat"
echo "Remember to open port 8000 in your EC2 security group's inbound rules."
echo "Once your frontend is deployed, update ALLOWED_ORIGINS in $APP_DIR/backend/.env"
echo "and run: sudo systemctl restart bit-backend"
