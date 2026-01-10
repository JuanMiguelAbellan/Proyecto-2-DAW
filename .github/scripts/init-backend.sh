#!/bin/bash
set -e
apt-get update -y
apt-get install -y docker.io
systemctl enable --now docker
usermod -aG docker ubuntu

# Clona tu repo (vacío al principio; lo llenas después)
cd /home/ubuntu
[ ! -d app ] && sudo -u ubuntu git clone https://github.com/TU_USUARIO/iadocuments.git app
cd app

# Build & run
docker build -t iad-app -f backend/Dockerfile.app .
docker run -d --restart always -p 3000:3000 --name iad-app \
  -e DB_HOST=${{ secrets.RDS_ENDPOINT }} \
  -e DB_USER=root \
  -e DB_PASS=RootPass2024! \
  -e DB_NAME=iadocuments \
  -e OLLAMA_URL=http://OLLAMA_IP:11434 \
  -e S3_BUCKET=${{ secrets.S3_BUCKET }} \
  iad-app