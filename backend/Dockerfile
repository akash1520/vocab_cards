FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml .
COPY app ./app
COPY alembic.ini .
COPY alembic ./alembic
COPY scripts/start.sh ./scripts/start.sh

RUN pip install --no-cache-dir . \
  && chmod +x scripts/start.sh

ENV PORT=8000
EXPOSE 8000

CMD ["scripts/start.sh"]
