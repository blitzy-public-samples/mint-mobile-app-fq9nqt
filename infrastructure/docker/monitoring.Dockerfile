# Human Tasks:
# 1. Verify AWS IAM roles and permissions for CloudWatch integration
# 2. Configure alert notification channels (Slack, PagerDuty, Email)
# 3. Set up SSL/TLS certificates for secure communication
# 4. Review and adjust resource limits based on usage patterns
# 5. Configure network security groups for metrics collection ports

# Stage 1: Prometheus Base
# Requirements addressed: 7.5 Development and Deployment Tools - Prometheus 2.40+ for metrics collection
FROM prom/prometheus:v2.40.0 as prometheus-base
COPY infrastructure/config/prometheus.yml /etc/prometheus/prometheus.yml
RUN mkdir -p /etc/prometheus/rules \
    && mkdir -p /etc/prometheus/certs \
    && chown -R nobody:nobody /etc/prometheus /prometheus

# Stage 2: Grafana Base
# Requirements addressed: 7.5 Development and Deployment Tools - Grafana for visualization
FROM grafana/grafana:8.0.0 as grafana-base
COPY infrastructure/config/grafana.ini /etc/grafana/grafana.ini
RUN mkdir -p /etc/grafana/provisioning/datasources \
    && mkdir -p /etc/grafana/provisioning/dashboards \
    && mkdir -p /etc/grafana/certs \
    && mkdir -p /var/lib/grafana/dashboards \
    && chown -R grafana:grafana /etc/grafana /var/lib/grafana

# Stage 3: AlertManager Base
# Requirements addressed: 9.3.2 Security Monitoring - Real-time monitoring and alert management
FROM prom/alertmanager:v0.24.0 as alertmanager-base
COPY infrastructure/config/alertmanager.yml /etc/alertmanager/alertmanager.yml
RUN mkdir -p /etc/alertmanager/templates \
    && chown -R alertmanager:alertmanager /etc/alertmanager /alertmanager

# Stage 4: Final Monitoring Image
FROM ubuntu:20.04

# Install required packages
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Copy binaries and configurations from previous stages
COPY --from=prometheus-base /bin/prometheus /bin/prometheus
COPY --from=prometheus-base /etc/prometheus /etc/prometheus
COPY --from=prometheus-base /prometheus /prometheus

COPY --from=grafana-base /usr/share/grafana /usr/share/grafana
COPY --from=grafana-base /etc/grafana /etc/grafana
COPY --from=grafana-base /var/lib/grafana /var/lib/grafana

COPY --from=alertmanager-base /bin/alertmanager /bin/alertmanager
COPY --from=alertmanager-base /etc/alertmanager /etc/alertmanager
COPY --from=alertmanager-base /alertmanager /alertmanager

# Set environment variables
# Requirements addressed: 10.2.1 AWS Service Configuration - Collection and storage of cloud infrastructure metrics
ENV PROMETHEUS_STORAGE_PATH=/prometheus \
    PROMETHEUS_RETENTION_TIME=15d \
    GRAFANA_HOME=/usr/share/grafana \
    GF_PATHS_CONFIG=/etc/grafana/grafana.ini \
    GF_PATHS_DATA=/var/lib/grafana \
    ALERTMANAGER_CONFIG_FILE=/etc/alertmanager/alertmanager.yml \
    ALERTMANAGER_STORAGE_PATH=/alertmanager

# Create necessary users
RUN groupadd -r prometheus && useradd -r -g prometheus prometheus \
    && groupadd -r grafana && useradd -r -g grafana grafana \
    && groupadd -r alertmanager && useradd -r -g alertmanager alertmanager

# Set correct permissions
RUN chown -R prometheus:prometheus /prometheus /etc/prometheus \
    && chown -R grafana:grafana /usr/share/grafana /etc/grafana /var/lib/grafana \
    && chown -R alertmanager:alertmanager /alertmanager /etc/alertmanager

# Configure supervisor
COPY <<EOF /etc/supervisor/conf.d/monitoring.conf
[supervisord]
nodaemon=true

[program:prometheus]
command=/bin/prometheus --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus
user=prometheus
autorestart=true
startretries=3
startsecs=10
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:grafana]
command=/usr/share/grafana/bin/grafana-server --config=/etc/grafana/grafana.ini
user=grafana
autorestart=true
startretries=3
startsecs=10
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:alertmanager]
command=/bin/alertmanager --config.file=/etc/alertmanager/alertmanager.yml --storage.path=/alertmanager
user=alertmanager
autorestart=true
startretries=3
startsecs=10
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
EOF

# Health check script
COPY <<EOF /usr/local/bin/healthcheck.sh
#!/bin/bash
set -e

# Check Prometheus
if ! curl -sf http://localhost:9090/-/healthy > /dev/null; then
    exit 1
fi

# Check Grafana
if ! curl -sf http://localhost:3000/api/health > /dev/null; then
    exit 1
fi

# Check AlertManager
if ! curl -sf http://localhost:9093/-/healthy > /dev/null; then
    exit 1
fi

exit 0
EOF

RUN chmod +x /usr/local/bin/healthcheck.sh

# Expose ports
EXPOSE 9090 3000 9093

# Set up volumes
VOLUME ["/prometheus", "/var/lib/grafana", "/alertmanager"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ["/usr/local/bin/healthcheck.sh"]

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]