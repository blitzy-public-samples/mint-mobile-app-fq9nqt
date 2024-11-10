#!/bin/bash

# Human Tasks:
# 1. Create AWS KMS key for backup encryption and configure access
# 2. Set up IAM roles with necessary S3 bucket permissions
# 3. Configure PostgreSQL connection credentials in environment
# 4. Set up Kubernetes service account with required permissions
# 5. Verify backup storage buckets exist in all specified tiers

# Requirements addressed:
# - 1.1 System Overview: Implementation of automated backup and disaster recovery systems
# - 5.2.4 Data Architecture: Implementation of tiered backup system with hot, warm, and cold storage

# Enable strict mode
set -euo pipefail

# Version information for required tools
# aws-cli: v2.0+
# postgresql-client: v14+
# kubernetes-cli: v1.24+

# Trap errors and cleanup
trap cleanup EXIT
trap 'echo "Error on line $LINENO"' ERR

# Global Variables
declare -A STORAGE_TIERS=(
    ["HOT"]="s3://mintreplica-hot-backup"
    ["WARM"]="s3://mintreplica-warm-backup"
    ["COLD"]="s3://mintreplica-cold-backup"
)

declare -A RETENTION_PERIODS=(
    ["HOT"]="7"
    ["WARM"]="30"
    ["COLD"]="365"
)

declare -A BACKUP_TYPES=(
    ["FULL"]="complete system backup"
    ["DATABASE"]="database only"
    ["OBJECTS"]="object storage only"
    ["CONFIG"]="configuration only"
)

# Utility Functions
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

cleanup() {
    log "Cleaning up temporary files..."
    rm -rf /tmp/backup-* || true
}

verify_prerequisites() {
    log "Verifying prerequisites..."
    command -v aws >/dev/null 2>&1 || { echo "aws-cli is required but not installed"; exit 1; }
    command -v pg_dump >/dev/null 2>&1 || { echo "pg_dump is required but not installed"; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required but not installed"; exit 1; }
}

verify_aws_credentials() {
    log "Verifying AWS credentials..."
    aws sts get-caller-identity >/dev/null || { echo "AWS credentials not configured"; exit 1; }
}

generate_backup_id() {
    echo "backup-$(date +%Y%m%d-%H%M%S)-${RANDOM}"
}

# Backup Functions
backup_database() {
    local storage_tier=$1
    local retention_period=$2
    local backup_id=$(generate_backup_id)
    local temp_dir="/tmp/${backup_id}"
    
    log "Starting database backup to ${storage_tier} tier..."
    
    mkdir -p "${temp_dir}"
    
    # Create consistent database snapshot
    pg_dump --format=custom \
            --compress=9 \
            --file="${temp_dir}/database.dump" \
            --verbose \
            "${DATABASE_URL}"
    
    # Encrypt backup using AWS KMS
    aws kms encrypt \
        --key-id "${KMS_KEY_ID}" \
        --input-file "${temp_dir}/database.dump" \
        --output-file "${temp_dir}/database.dump.encrypted"
    
    # Upload to S3 with metadata
    aws s3 cp \
        "${temp_dir}/database.dump.encrypted" \
        "${STORAGE_TIERS[${storage_tier}]}/database/${backup_id}/" \
        --metadata "retention=${retention_period},checksum=$(sha256sum ${temp_dir}/database.dump.encrypted | cut -d' ' -f1)"
    
    log "Database backup completed: ${backup_id}"
    echo "${backup_id}"
}

backup_object_storage() {
    local bucket_name=$1
    local storage_tier=$2
    local backup_id=$(generate_backup_id)
    
    log "Starting object storage backup of ${bucket_name} to ${storage_tier} tier..."
    
    # Create backup manifest
    aws s3api list-objects-v2 \
        --bucket "${bucket_name}" \
        --output json > "/tmp/${backup_id}-manifest.json"
    
    # Copy objects with versioning
    aws s3 sync \
        "s3://${bucket_name}" \
        "${STORAGE_TIERS[${storage_tier}]}/objects/${backup_id}/" \
        --source-region "${AWS_REGION}" \
        --metadata "backup_source=${bucket_name}"
    
    # Enable cross-region replication
    aws s3api put-bucket-replication \
        --bucket "${STORAGE_TIERS[${storage_tier}]#s3://}" \
        --replication-configuration file://replication-config.json
    
    log "Object storage backup completed: ${backup_id}"
    echo "${backup_id}"
}

backup_k8s_resources() {
    local namespace=$1
    local resource_types=$2
    local backup_id=$(generate_backup_id)
    local temp_dir="/tmp/${backup_id}"
    
    log "Starting Kubernetes resources backup for namespace ${namespace}..."
    
    mkdir -p "${temp_dir}"
    
    # Export resource definitions
    for resource in ${resource_types//,/ }; do
        kubectl get "${resource}" \
            -n "${namespace}" \
            -o yaml > "${temp_dir}/${resource}.yaml"
    done
    
    # Backup secrets separately with encryption
    kubectl get secrets \
        -n "${namespace}" \
        -o yaml | \
        aws kms encrypt \
            --key-id "${KMS_KEY_ID}" \
            --plaintext fileb://-  \
            --output text \
            --query CiphertextBlob > "${temp_dir}/secrets.encrypted"
    
    # Create backup archive
    tar -czf "${temp_dir}/k8s-backup.tar.gz" -C "${temp_dir}" .
    
    # Upload to S3
    aws s3 cp \
        "${temp_dir}/k8s-backup.tar.gz" \
        "${STORAGE_TIERS[HOT]}/kubernetes/${backup_id}/"
    
    log "Kubernetes resources backup completed: ${backup_id}"
    echo "${backup_id}"
}

rotate_backups() {
    local storage_tier=$1
    
    log "Starting backup rotation for ${storage_tier} tier..."
    
    # List existing backups
    aws s3 ls "${STORAGE_TIERS[${storage_tier}]}" --recursive | \
    while read -r line; do
        local backup_date=$(echo "$line" | awk '{print $1}')
        local backup_path=$(echo "$line" | awk '{print $4}')
        local retention_days=${RETENTION_PERIODS[${storage_tier}]}
        
        # Check if backup has expired
        if [[ $(date -d "${backup_date}" +%s) -lt $(date -d "-${retention_days} days" +%s) ]]; then
            if [[ ${storage_tier} == "HOT" ]]; then
                # Move to WARM tier
                aws s3 mv \
                    "${STORAGE_TIERS[HOT]}/${backup_path}" \
                    "${STORAGE_TIERS[WARM]}/${backup_path}"
            elif [[ ${storage_tier} == "WARM" ]]; then
                # Move to COLD tier
                aws s3 mv \
                    "${STORAGE_TIERS[WARM]}/${backup_path}" \
                    "${STORAGE_TIERS[COLD]}/${backup_path}"
            else
                # Delete expired COLD tier backups
                aws s3 rm "${STORAGE_TIERS[COLD]}/${backup_path}"
            fi
        fi
    done
    
    log "Backup rotation completed for ${storage_tier} tier"
    return 0
}

# Main backup orchestration function
backup_all() {
    local backup_id=$(generate_backup_id)
    log "Starting full system backup with ID: ${backup_id}"
    
    # Verify prerequisites
    verify_prerequisites
    verify_aws_credentials
    
    # Database backup
    local db_backup_id=$(backup_database "HOT" "${RETENTION_PERIODS[HOT]}")
    
    # Object storage backup
    local obj_backup_id=$(backup_object_storage "mintreplica-production" "HOT")
    
    # Kubernetes resources backup
    local k8s_backup_id=$(backup_k8s_resources "default" "deployments,services,configmaps")
    
    # Rotate backups in all tiers
    for tier in "${!STORAGE_TIERS[@]}"; do
        rotate_backups "${tier}"
    done
    
    # Create backup manifest
    cat > "/tmp/${backup_id}-manifest.json" <<EOF
{
    "backup_id": "${backup_id}",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "components": {
        "database": "${db_backup_id}",
        "object_storage": "${obj_backup_id}",
        "kubernetes": "${k8s_backup_id}"
    },
    "status": "completed"
}
EOF
    
    # Upload manifest
    aws s3 cp \
        "/tmp/${backup_id}-manifest.json" \
        "${STORAGE_TIERS[HOT]}/manifests/${backup_id}-manifest.json"
    
    log "Full system backup completed successfully"
    echo "${backup_id}"
}

# Main execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    backup_all
fi