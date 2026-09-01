FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir \
       numpy==2.0.2 \
       pandas==2.3.3 \
       xgboost==2.1.4

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PYTHON_PATH=/opt/venv/bin/python

EXPOSE 10000

CMD ["npm", "start"]
