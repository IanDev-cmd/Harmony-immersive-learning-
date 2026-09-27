FROM python:3.12.8-slim-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential g++ gcc libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    CHROMA_DIR=/app/chroma_db \
    SITE_DIR=/site \
    PORT=10000

COPY Aqua-ask-/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY Aqua-ask-/ .
COPY index.html agent-bridge.js site-chrome.js /site/
COPY Guardians-of-the-Ocean /site/Guardians-of-the-Ocean
COPY mobile /site/mobile
COPY Aqua-ask-/aquaask.html /site/Aqua-ask-/aquaask.html
COPY Aqua-ask-/h2o-assets /site/Aqua-ask-/h2o-assets

RUN rm -rf /app/chroma_db \
    && python -c "from app import ENGINE; n = ENGINE.ensure_ready(); assert n > 0, n; print('linux chroma chunks', n)"

EXPOSE 10000
CMD ["python", "docker_entrypoint.py"]
