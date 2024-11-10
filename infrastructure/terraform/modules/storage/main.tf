# Human Tasks:
# 1. Ensure AWS credentials are properly configured
# 2. Review and adjust bucket lifecycle policies based on data retention requirements
# 3. Verify KMS key permissions are properly set for bucket encryption
# 4. Confirm VPC endpoint configurations match network architecture
# 5. Review bucket policies and access controls for security compliance

# Provider version constraints
terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws" # v4.0
      version = "~> 4.0"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for storage resources"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "service_name" {
  description = "Name of the service"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for VPC endpoint configuration"
  type        = string
}

variable "kms_key_ids" {
  description = "KMS key IDs for bucket encryption"
  type = object({
    data_key_id    = string
    secret_key_id  = string
  })
}

# Local variables for storage configuration
locals {
  # Addressing requirement: Object Storage (7.2.2)
  bucket_names = {
    app       = "${var.environment}-${var.service_name}-app-data"
    backup    = "${var.environment}-${var.service_name}-backups"
    analytics = "${var.environment}-${var.service_name}-analytics"
  }

  # Addressing requirement: Backup Storage (5.2.4)
  lifecycle_rules = {
    hot = {
      enabled = true
      prefix  = "hot/"
      transitions = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        }
      ]
    }
    warm = {
      enabled = true
      prefix  = "warm/"
      transitions = [
        {
          days          = 90
          storage_class = "GLACIER"
        }
      ]
    }
    cold = {
      enabled = true
      prefix  = "cold/"
      transitions = [
        {
          days          = 180
          storage_class = "DEEP_ARCHIVE"
        }
      ]
    }
  }

  common_tags = {
    Environment = var.environment
    Service     = var.service_name
    ManagedBy   = "terraform"
  }
}

# S3 Buckets
resource "aws_s3_bucket" "app" {
  # Addressing requirement: Object Storage (7.2.2)
  bucket = local.bucket_names.app
  force_destroy = false

  tags = merge(local.common_tags, {
    Name = "Application Data Storage"
  })
}

resource "aws_s3_bucket" "backup" {
  # Addressing requirement: Backup Storage (5.2.4)
  bucket = local.bucket_names.backup
  force_destroy = false

  tags = merge(local.common_tags, {
    Name = "Backup Storage"
  })
}

resource "aws_s3_bucket" "analytics" {
  # Addressing requirement: Analytics Storage (5.1)
  bucket = local.bucket_names.analytics
  force_destroy = false

  tags = merge(local.common_tags, {
    Name = "Analytics Data Storage"
  })
}

# Versioning Configuration
resource "aws_s3_bucket_versioning" "app" {
  # Addressing requirement: Data Security (9.2)
  bucket = aws_s3_bucket.app.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "backup" {
  bucket = aws_s3_bucket.backup.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "analytics" {
  bucket = aws_s3_bucket.analytics.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle Rules
resource "aws_s3_bucket_lifecycle_rule" "backup_hot" {
  # Addressing requirement: Backup Storage (5.2.4)
  bucket = aws_s3_bucket.backup.id
  id     = "hot-storage-tier"
  prefix = local.lifecycle_rules.hot.prefix
  status = local.lifecycle_rules.hot.enabled ? "Enabled" : "Disabled"

  dynamic "transition" {
    for_each = local.lifecycle_rules.hot.transitions
    content {
      days          = transition.value.days
      storage_class = transition.value.storage_class
    }
  }
}

resource "aws_s3_bucket_lifecycle_rule" "backup_warm" {
  bucket = aws_s3_bucket.backup.id
  id     = "warm-storage-tier"
  prefix = local.lifecycle_rules.warm.prefix
  status = local.lifecycle_rules.warm.enabled ? "Enabled" : "Disabled"

  dynamic "transition" {
    for_each = local.lifecycle_rules.warm.transitions
    content {
      days          = transition.value.days
      storage_class = transition.value.storage_class
    }
  }
}

resource "aws_s3_bucket_lifecycle_rule" "backup_cold" {
  bucket = aws_s3_bucket.backup.id
  id     = "cold-storage-tier"
  prefix = local.lifecycle_rules.cold.prefix
  status = local.lifecycle_rules.cold.enabled ? "Enabled" : "Disabled"

  dynamic "transition" {
    for_each = local.lifecycle_rules.cold.transitions
    content {
      days          = transition.value.days
      storage_class = transition.value.storage_class
    }
  }
}

# Encryption Configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "app" {
  # Addressing requirement: Data Security (9.2)
  bucket = aws_s3_bucket.app.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_ids.data_key_id
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_ids.data_key_id
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "analytics" {
  bucket = aws_s3_bucket.analytics.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_ids.data_key_id
      sse_algorithm     = "aws:kms"
    }
  }
}

# Public Access Block
resource "aws_s3_bucket_public_access_block" "app" {
  # Addressing requirement: Data Security (9.2)
  bucket = aws_s3_bucket.app.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "backup" {
  bucket = aws_s3_bucket.backup.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "analytics" {
  bucket = aws_s3_bucket.analytics.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# VPC Endpoint for S3
resource "aws_vpc_endpoint" "s3" {
  # Addressing requirement: Network Architecture (5.2.2)
  vpc_id       = var.vpc_id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-s3-vpc-endpoint"
  })
}

# Bucket Policies
resource "aws_s3_bucket_policy" "app" {
  # Addressing requirement: Data Security (9.2)
  bucket = aws_s3_bucket.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "EnforceSSLOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.app.arn,
          "${aws_s3_bucket.app.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "backup" {
  bucket = aws_s3_bucket.backup.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "EnforceSSLOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.backup.arn,
          "${aws_s3_bucket.backup.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "analytics" {
  bucket = aws_s3_bucket.analytics.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "EnforceSSLOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.analytics.arn,
          "${aws_s3_bucket.analytics.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# Outputs
output "app_bucket" {
  description = "Application data storage bucket details"
  value = {
    id  = aws_s3_bucket.app.id
    arn = aws_s3_bucket.app.arn
  }
}

output "backup_bucket" {
  description = "Backup storage bucket details with hot, warm, and cold tiers"
  value = {
    id  = aws_s3_bucket.backup.id
    arn = aws_s3_bucket.backup.arn
  }
}

output "analytics_bucket" {
  description = "Analytics data storage bucket details"
  value = {
    id  = aws_s3_bucket.analytics.id
    arn = aws_s3_bucket.analytics.arn
  }
}