#!/bin/bash

# Human Tasks Required:
# 1. Set up AWS IAM roles and policies for CloudWatch integration
# 2. Configure DNS entries for Prometheus, Grafana, and AlertManager
# 3. Create and configure SSL/TLS certificates
# 4. Set up PostgreSQL database for Grafana
# 5. Configure notification channels (SMTP, Slack, PagerDuty)
# 6. Review and adjust resource limits and retention policies

# Requirements addressed:
# - 7.5 Development and Deployment Tools: Setup of Prometheus 2.40+ and Grafana
# - 9.3.2 Security Monitoring: Real-time security monitoring and alerting
# - 10.2.1 AWS Service Configuration: AWS infrastructure monitoring

set -euo pipefail

# Default versions
PROMETHEUS_VERSION="2.40.0"
GRAFANA_VERSION="8.5.0"
ALERTMANAGER_VERSION="0.24.0"

# Configuration paths
PROMETHEUS_CONFIG="/etc/prometheus/prometheus.yml"
GRAFANA_CONFIG="/etc/grafana/grafana.ini"
ALERTMANAGER_CONFIG="/etc/alertmanager/alertmanager.yml"
DASHBOARDS_PATH="/var/lib/grafana/dashboards"

# Function to check required environment variables
check_required_env_vars() {
    local required_vars=(
        "GRAFANA_ADMIN_PASSWORD"
        "GRAFANA_SECRET_KEY"
        "PROMETHEUS_RETENTION_DAYS"
        "SMTP_USER"
        "SMTP_PASSWORD"
        "SLACK_WEBHOOK_URL"
        "PAGERDUTY_SERVICE_KEY"
        "AWS_REGION"
        "WORKSPACE_ID"
        "IAM_ROLE_ARN"
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            echo "Error: Required environment variable $var is not set"
            exit 1
        fi
    done
}

# Function to create necessary directories
create_directories() {
    local dirs=(
        "/etc/prometheus"
        "/etc/prometheus/rules"
        "/etc/prometheus/certs"
        "/var/lib/prometheus"
        "/etc/grafana"
        "/etc/grafana/certs"
        "/var/lib/grafana"
        "/var/lib/grafana/dashboards"
        "/etc/alertmanager"
        "/etc/alertmanager/templates"
    )

    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        chmod 755 "$dir"
    done
}

# Function to setup Prometheus
setup_prometheus() {
    local config_path=$1
    local version=$2

    echo "Setting up Prometheus ${version}..."
    
    # Download and extract Prometheus
    wget "https://github.com/prometheus/prometheus/releases/download/v${version}/prometheus-${version}.linux-amd64.tar.gz"
    tar xvf "prometheus-${version}.linux-amd64.tar.gz"
    
    # Install binaries
    cp "prometheus-${version}.linux-amd64/prometheus" /usr/local/bin/
    cp "prometheus-${version}.linux-amd64/promtool" /usr/local/bin/
    
    # Copy configuration
    cp "$config_path" /etc/prometheus/prometheus.yml
    
    # Create systemd service
    cat > /etc/systemd/system/prometheus.service << EOF
[Unit]
Description=Prometheus Monitoring System
Documentation=https://prometheus.io/docs/introduction/overview/
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/var/lib/prometheus \
    --storage.tsdb.retention.time=${PROMETHEUS_RETENTION_DAYS}d \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries \
    --web.listen-address=0.0.0.0:9090 \
    --web.enable-lifecycle

Restart=always
RestartSec=5
LimitNOFILE=65536
NoNewPrivileges=yes
ProtectHome=yes
ProtectSystem=strict
ReadWritePaths=/var/lib/prometheus

[Install]
WantedBy=multi-user.target
EOF

    # Create prometheus user
    useradd --no-create-home --shell /bin/false prometheus || true
    chown -R prometheus:prometheus /var/lib/prometheus /etc/prometheus
    
    # Start service
    systemctl daemon-reload
    systemctl enable prometheus
    systemctl start prometheus
    
    echo "Prometheus setup completed"
}

# Function to setup Grafana
setup_grafana() {
    local config_path=$1
    local version=$2

    echo "Setting up Grafana ${version}..."
    
    # Add Grafana repository
    cat > /etc/yum.repos.d/grafana.repo << EOF
[grafana]
name=grafana
baseurl=https://packages.grafana.com/oss/rpm
repo_gpgcheck=1
enabled=1
gpgcheck=1
gpgkey=https://packages.grafana.com/gpg.key
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
EOF

    # Install Grafana
    yum install -y grafana-${version}
    
    # Copy configuration
    cp "$config_path" /etc/grafana/grafana.ini
    
    # Configure database
    grafana-cli db migrate
    
    # Set admin password
    grafana-cli admin reset-admin-password "${GRAFANA_ADMIN_PASSWORD}"
    
    # Start service
    systemctl daemon-reload
    systemctl enable grafana-server
    systemctl start grafana-server
    
    echo "Grafana setup completed"
}

# Function to setup AlertManager
setup_alertmanager() {
    local config_path=$1
    local version=$2

    echo "Setting up AlertManager ${version}..."
    
    # Download and extract AlertManager
    wget "https://github.com/prometheus/alertmanager/releases/download/v${version}/alertmanager-${version}.linux-amd64.tar.gz"
    tar xvf "alertmanager-${version}.linux-amd64.tar.gz"
    
    # Install binaries
    cp "alertmanager-${version}.linux-amd64/alertmanager" /usr/local/bin/
    cp "alertmanager-${version}.linux-amd64/amtool" /usr/local/bin/
    
    # Copy configuration
    cp "$config_path" /etc/alertmanager/alertmanager.yml
    
    # Create systemd service
    cat > /etc/systemd/system/alertmanager.service << EOF
[Unit]
Description=AlertManager
Documentation=https://prometheus.io/docs/alerting/latest/alertmanager/
After=network-online.target

[Service]
User=alertmanager
Group=alertmanager
Type=simple
ExecStart=/usr/local/bin/alertmanager \
    --config.file=/etc/alertmanager/alertmanager.yml \
    --storage.path=/var/lib/alertmanager \
    --web.listen-address=:9093 \
    --cluster.listen-address=:9094

Restart=always
RestartSec=5
NoNewPrivileges=yes
ProtectHome=yes
ProtectSystem=strict
ReadWritePaths=/var/lib/alertmanager

[Install]
WantedBy=multi-user.target
EOF

    # Create alertmanager user
    useradd --no-create-home --shell /bin/false alertmanager || true
    chown -R alertmanager:alertmanager /var/lib/alertmanager /etc/alertmanager
    
    # Start service
    systemctl daemon-reload
    systemctl enable alertmanager
    systemctl start alertmanager
    
    echo "AlertManager setup completed"
}

# Function to configure default dashboards
configure_dashboards() {
    local dashboard_path=$1
    
    echo "Configuring Grafana dashboards..."
    
    # Create Prometheus data source
    curl -X POST -H "Content-Type: application/json" \
         -d '{"name":"Prometheus","type":"prometheus","url":"http://localhost:9090","access":"proxy","isDefault":true}' \
         http://admin:${GRAFANA_ADMIN_PASSWORD}@localhost:3000/api/datasources
    
    # Import default dashboards
    for dashboard in "${dashboard_path}"/*.json; do
        if [[ -f "$dashboard" ]]; then
            curl -X POST -H "Content-Type: application/json" \
                 -d @"$dashboard" \
                 http://admin:${GRAFANA_ADMIN_PASSWORD}@localhost:3000/api/dashboards/db
        fi
    done
    
    echo "Dashboard configuration completed"
}

# Main setup function
main() {
    echo "Starting monitoring stack setup..."
    
    # Check required environment variables
    check_required_env_vars
    
    # Create necessary directories
    create_directories
    
    # Setup components
    setup_prometheus "$PROMETHEUS_CONFIG" "$PROMETHEUS_VERSION"
    setup_grafana "$GRAFANA_CONFIG" "$GRAFANA_VERSION"
    setup_alertmanager "$ALERTMANAGER_CONFIG" "$ALERTMANAGER_VERSION"
    configure_dashboards "$DASHBOARDS_PATH"
    
    echo "Monitoring stack setup completed successfully"
}

# Execute main function
main "$@"