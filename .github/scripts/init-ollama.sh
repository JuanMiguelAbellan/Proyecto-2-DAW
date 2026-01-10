#!/bin/bash
set -e
apt-get update -y
apt-get install -y docker.io
systemctl enable --now docker
usermod -aG docker ubuntu
docker run -d --restart always -p 11434:11434 --name ollama ollama/ollama:0.3.6-rocm
sleep 30
docker exec ollama ollama pull llama3.2:3b