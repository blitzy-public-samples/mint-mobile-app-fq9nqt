#!/bin/bash

# Human Tasks Required:
# 1. Configure AWS credentials with appropriate permissions for EKS, RDS, ElastiCache, etc.
# 2. Set up SSL/TLS certificates for all environments
# 3. Configure DNS entries in Route53 for all environments
# 4. Create and configure secrets in AWS Secrets Manager
# 5. Set up monitoring alert channels (email, Slack, PagerDuty)
# 6. Review and adjust resource quotas per environment
# 7. Configure backup retention policies
# 8. Set up external logging aggregation (if required)

# Requirements addressed:
# - 5.6 Deployment Architecture: Implements deployment workflow for production, staging and development
# - 7.5 Development and Deployment Tools: Handles automated deployment with GitHub Actions
# - 10.1 Deployment Environment: Manages cloud-native deployment with Kubernetes orchestration

set -euo pipefail

# Source monitoring setup functions
source "$(dirname "$0")/monitoring-setup.sh"

# Default configurations
ENVIRONMENTS=("dev" "staging" "prod")
AWS_REGIONS=("us-east-1" "us-west-2")
APP_VERSION=${VERSION:-latest}
DEPLOYMENT_TIMEOUT=600
ROLLBACK_TIMEOUT=300

# Function to validate prerequisites
validate_prerequisites() {
    local environment=$1
    echo "Validating prerequisites for $environment environment..."

    # Check required CLI tools
    local required_tools=("kubectl" "aws" "helm" "docker")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo "Error: $tool is not installed"
            return 1
        fi
    done

    # Verify AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "Error: Invalid AWS credentials"
        return 1
    fi

    # Validate Kubernetes context
    if ! kubectl config get-contexts | grep -q "$environment"; then
        echo "Error: Kubernetes context for $environment not found"
        return 1
    }

    # Check required configuration files
    local required_configs=(
        "infrastructure/kubernetes/base/namespace.yaml"
        "infrastructure/kubernetes/base/resourcequota.yaml"
        "infrastructure/kubernetes/monitoring/prometheus.yaml"
    )
    for config in "${required_configs[@]}"; do
        if [[ ! -f "$config" ]]; then
            echo "Error: Required configuration file $config not found"
            return 1
        fi
    done

    # Verify Docker registry access
    if ! docker info &> /dev/null; then
        echo "Error: Docker daemon not running"
        return 1
    }

    echo "Prerequisites validation completed successfully"
    return 0
}

# Function to setup infrastructure
setup_infrastructure() {
    local environment=$1
    local region=$2
    echo "Setting up infrastructure for $environment in $region..."

    # Create/Update EKS cluster
    if ! aws eks describe-cluster --name "mintreplica-$environment" --region "$region" &> /dev/null; then
        echo "Creating EKS cluster for $environment..."
        aws eks create-cluster \
            --name "mintreplica-$environment" \
            --region "$region" \
            --role-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:role/eks-cluster-role" \
            --resources-vpc-config subnetIds="${SUBNET_IDS}",securityGroupIds="${SECURITY_GROUP_IDS}" \
            --kubernetes-version 1.24
    fi

    # Configure VPC and networking
    aws ec2 create-vpc-endpoint \
        --vpc-id "${VPC_ID}" \
        --service-name "com.amazonaws.${region}.s3" \
        --route-table-ids "${ROUTE_TABLE_IDS}"

    # Setup RDS instances
    aws rds create-db-instance \
        --db-instance-identifier "mintreplica-${environment}" \
        --db-instance-class "db.r6g.xlarge" \
        --engine "postgres" \
        --master-username "${DB_USERNAME}" \
        --master-user-password "${DB_PASSWORD}" \
        --allocated-storage 100 \
        --backup-retention-period 7 \
        --multi-az true

    # Configure Redis clusters
    aws elasticache create-cache-cluster \
        --cache-cluster-id "mintreplica-${environment}" \
        --cache-node-type "cache.r6g.large" \
        --engine "redis" \
        --num-cache-nodes 3 \
        --az-mode "cross-az"

    # Setup S3 buckets
    aws s3api create-bucket \
        --bucket "mintreplica-${environment}-assets" \
        --region "$region" \
        --create-bucket-configuration LocationConstraint="$region"

    # Configure CloudFront
    aws cloudfront create-distribution \
        --origin-domain-name "mintreplica-${environment}-assets.s3.amazonaws.com" \
        --default-root-object "index.html"

    # Setup WAF rules
    aws wafv2 create-web-acl \
        --name "mintreplica-${environment}" \
        --scope REGIONAL \
        --default-action Block={} \
        --rules file://infrastructure/aws/waf-rules.json \
        --region "$region"

    echo "Infrastructure setup completed successfully"
    return 0
}

# Function to deploy application
deploy_application() {
    local environment=$1
    local version=$2
    echo "Deploying application version $version to $environment..."

    # Apply namespace configurations
    kubectl apply -f infrastructure/kubernetes/base/namespace.yaml

    # Deploy database migrations
    echo "Running database migrations..."
    kubectl create job "db-migrate-${version}" \
        --from=cronjob/db-migration \
        -n "mintreplica-${environment}"

    # Deploy backend services
    kubectl apply -f infrastructure/kubernetes/base/deployment.yaml \
        -n "mintreplica-${environment}" \
        --set image.tag="$version" \
        --set environment="$environment"

    # Configure API gateway
    kubectl apply -f infrastructure/kubernetes/base/ingress.yaml \
        -n "mintreplica-${environment}"

    # Setup monitoring stack
    setup_prometheus
    setup_grafana
    setup_alertmanager

    # Configure auto-scaling
    kubectl apply -f infrastructure/kubernetes/base/hpa.yaml \
        -n "mintreplica-${environment}"

    # Setup logging
    kubectl apply -f infrastructure/kubernetes/monitoring/logging.yaml \
        -n "mintreplica-${environment}"

    echo "Application deployment completed successfully"
    return 0
}

# Function to verify deployment
verify_deployment() {
    local environment=$1
    echo "Verifying deployment in $environment environment..."

    # Check pod status
    if ! kubectl wait --for=condition=ready pod \
        -l app=mintreplica \
        -n "mintreplica-${environment}" \
        --timeout=300s; then
        echo "Error: Pods failed to reach ready state"
        return 1
    fi

    # Verify service endpoints
    local endpoints=("api" "auth" "web")
    for endpoint in "${endpoints[@]}"; do
        if ! curl -sf "https://${endpoint}.${environment}.mintreplica.com/health" &> /dev/null; then
            echo "Error: $endpoint health check failed"
            return 1
        fi
    done

    # Validate database connections
    if ! kubectl exec -it \
        deploy/api \
        -n "mintreplica-${environment}" \
        -- npm run db:health; then
        echo "Error: Database connection check failed"
        return 1
    fi

    # Check monitoring metrics
    if ! curl -sf "http://prometheus:9090/-/healthy" &> /dev/null; then
        echo "Error: Prometheus health check failed"
        return 1
    fi

    # Verify SSL/TLS
    if ! openssl s_client -connect "api.${environment}.mintreplica.com:443" \
        -servername "api.${environment}.mintreplica.com" &> /dev/null; then
        echo "Error: SSL/TLS verification failed"
        return 1
    fi

    echo "Deployment verification completed successfully"
    return 0
}

# Function to handle deployment rollback
rollback_deployment() {
    local environment=$1
    local previous_version=$2
    echo "Rolling back deployment in $environment to version $previous_version..."

    # Stop current deployment
    kubectl rollout stop \
        deployment/api \
        -n "mintreplica-${environment}"

    # Revert database migrations
    kubectl create job "db-rollback-${previous_version}" \
        --from=cronjob/db-migration \
        -n "mintreplica-${environment}" \
        -- --command="rollback"

    # Restore previous version
    kubectl rollout undo \
        deployment/api \
        -n "mintreplica-${environment}" \
        --to-revision="$previous_version"

    # Verify rollback
    if ! verify_deployment "$environment"; then
        echo "Error: Rollback verification failed"
        return 1
    fi

    # Update deployment status
    kubectl annotate deployment/api \
        -n "mintreplica-${environment}" \
        kubernetes.io/change-cause="Rollback to version $previous_version"

    # Notify monitoring systems
    curl -X POST "${ALERT_WEBHOOK}" \
        -H "Content-Type: application/json" \
        -d "{\"message\":\"Deployment rollback to version $previous_version completed in $environment\"}"

    echo "Rollback completed successfully"
    return 0
}

# Main deployment function
main() {
    local environment=$1
    local version=$2
    local region=$3

    echo "Starting deployment process..."

    # Validate prerequisites
    if ! validate_prerequisites "$environment"; then
        echo "Error: Prerequisites validation failed"
        exit 1
    fi

    # Setup infrastructure
    if ! setup_infrastructure "$environment" "$region"; then
        echo "Error: Infrastructure setup failed"
        exit 2
    fi

    # Deploy application
    if ! deploy_application "$environment" "$version"; then
        echo "Error: Application deployment failed"
        rollback_deployment "$environment" "$PREVIOUS_VERSION"
        exit 3
    fi

    # Verify deployment
    if ! verify_deployment "$environment"; then
        echo "Error: Deployment verification failed"
        rollback_deployment "$environment" "$PREVIOUS_VERSION"
        exit 4
    fi

    echo "Deployment completed successfully"
}

# Script execution
if [[ $# -lt 3 ]]; then
    echo "Usage: $0 <environment> <version> <region>"
    exit 1
fi

main "$1" "$2" "$3"