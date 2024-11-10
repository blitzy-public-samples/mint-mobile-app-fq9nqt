#!/bin/bash

# Human Tasks Required:
# 1. Configure AWS credentials with appropriate permissions for EKS cluster management
# 2. Set up monitoring alert channels (email, Slack, PagerDuty) for rollback notifications
# 3. Configure DNS entries for blue-green deployment switching
# 4. Set up external logging aggregation for rollback tracking
# 5. Review and adjust resource quotas for rollback environments
# 6. Configure backup retention policies for rollback points
# 7. Set up health check endpoints for validation

# Requirements addressed:
# - 5.6 Deployment Architecture: Support rollback between Production, Staging and Development environments
# - 10.5.3 Deployment Strategy: Handle rollback in blue-green deployment setup with < 5 minute RTO
# - 7.5 Development and Deployment Tools: Integration with Kubernetes 1.24+ for container orchestration rollbacks

set -euo pipefail

# Source required dependencies
source "$(dirname "$0")/deploy.sh"
source "$(dirname "$0")/monitoring-setup.sh"

# Global variables from specification
MAX_RETRY_ATTEMPTS=3
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_LOCK_FILE="/tmp/rollback.lock"

# Function to perform rollback with blue-green deployment strategy
perform_rollback() {
    local environment=$1
    local version=$2
    local exit_code=1

    echo "Starting rollback process for environment: $environment to version: $version"

    # Validate prerequisites
    if ! validate_prerequisites "$environment"; then
        echo "Error: Prerequisites validation failed"
        return 1
    }

    # Acquire rollback lock
    if ! mkdir "$ROLLBACK_LOCK_FILE" 2>/dev/null; then
        echo "Error: Another rollback process is running"
        return 1
    }
    trap 'rm -rf "$ROLLBACK_LOCK_FILE"' EXIT

    # Verify Kubernetes cluster connectivity
    if ! kubectl cluster-info &>/dev/null; then
        echo "Error: Unable to connect to Kubernetes cluster"
        return 1
    }

    # Check if rollback version exists
    if ! kubectl rollout history deployment -n "$environment" | grep -q "$version"; then
        echo "Error: Rollback version $version not found in deployment history"
        return 1
    }

    echo "Initiating blue-green deployment rollback..."

    # Scale down current (green) deployment
    if ! kubectl scale deployment -n "$environment" --replicas=0 \
        -l app.kubernetes.io/version="$(kubectl get deployment -n "$environment" -o jsonpath='{.metadata.labels.version}')"; then
        echo "Error: Failed to scale down current deployment"
        return 1
    }

    # Restore previous (blue) version
    if ! kubectl rollout undo deployment -n "$environment" --to-revision="$version"; then
        echo "Error: Failed to restore previous version"
        return 1
    }

    # Wait for rollback to complete
    if ! kubectl rollout status deployment -n "$environment" --timeout="${HEALTH_CHECK_TIMEOUT}s"; then
        echo "Error: Rollback deployment failed to stabilize"
        return 1
    }

    # Validate health of rolled back services
    if ! validate_health "$environment" "$MONITORING_ENDPOINTS"; then
        echo "Error: Health validation failed after rollback"
        return 1
    }

    # Update DNS/routing for blue-green switch
    if ! kubectl patch service main -n "$environment" -p "{\"spec\":{\"selector\":{\"version\":\"$version\"}}}"; then
        echo "Error: Failed to update service routing"
        return 1
    }

    # Clean up resources from failed deployment
    if ! cleanup_resources "$environment" "$version"; then
        echo "Warning: Resource cleanup encountered issues"
    fi

    echo "Rollback completed successfully"
    exit_code=0
    return $exit_code
}

# Function to validate health of rolled back services
validate_health() {
    local environment=$1
    local endpoints=$2
    local retry_count=0

    echo "Validating health of rolled back services..."

    # Check API endpoints with retry mechanism
    while [ $retry_count -lt $MAX_RETRY_ATTEMPTS ]; do
        local all_healthy=true

        # Verify API endpoints
        for endpoint in $(echo "$endpoints" | jq -r '.api[]'); do
            if ! curl -sf "$endpoint/health" &>/dev/null; then
                all_healthy=false
                break
            fi
        done

        # Check database connectivity
        if ! kubectl exec -n "$environment" deploy/api -- pg_isready -h "$DB_HOST" -U "$DB_USER"; then
            all_healthy=false
        fi

        # Verify Redis cache
        if ! kubectl exec -n "$environment" deploy/api -- redis-cli -h "$REDIS_HOST" ping; then
            all_healthy=false
        fi

        # Check RabbitMQ
        if ! kubectl exec -n "$environment" deploy/api -- rabbitmqctl status; then
            all_healthy=false
        fi

        # Setup and check Prometheus metrics
        if ! setup_prometheus; then
            all_healthy=false
        fi

        # Verify AlertManager status
        if ! setup_alertmanager; then
            all_healthy=false
        fi

        if [ "$all_healthy" = true ]; then
            echo "Health validation successful"
            return 0
        fi

        retry_count=$((retry_count + 1))
        echo "Health check attempt $retry_count failed, retrying..."
        sleep 10
    done

    echo "Error: Health validation failed after $MAX_RETRY_ATTEMPTS attempts"
    return 1
}

# Function to clean up resources from failed deployment
cleanup_resources() {
    local environment=$1
    local version=$2

    echo "Cleaning up resources from failed deployment..."

    # Remove failed deployment pods
    kubectl delete pods -n "$environment" \
        -l app.kubernetes.io/version!="$version" \
        --grace-period=30

    # Clean up ConfigMaps
    kubectl delete configmap -n "$environment" \
        -l app.kubernetes.io/version!="$version"

    # Remove temporary volumes and PVCs
    kubectl delete pvc -n "$environment" \
        -l app.kubernetes.io/version!="$version"

    # Update deployment history
    kubectl annotate deployment -n "$environment" \
        kubernetes.io/change-cause="Rollback to version $version"

    # Clean up monitoring resources
    for endpoint in $(echo "$MONITORING_ENDPOINTS" | jq -r '.monitoring[]'); do
        curl -X DELETE "$endpoint" || true
    done

    # Remove stale service endpoints
    kubectl delete endpoints -n "$environment" \
        -l app.kubernetes.io/version!="$version"

    echo "Resource cleanup completed"
    return 0
}

# Main execution
main() {
    if [ $# -lt 2 ]; then
        echo "Usage: $0 <environment> <version>"
        echo "Example: $0 production v1.2.3"
        exit 1
    fi

    local environment=$1
    local version=$2

    # Execute rollback
    if perform_rollback "$environment" "$version"; then
        echo "Rollback completed successfully"
        exit 0
    else
        echo "Rollback failed"
        exit 1
    fi
}

# Execute main if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi