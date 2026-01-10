FROM ollama/ollama:latest
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ollama list || exit 1

EXPOSE 11434
