# Human Tasks:
# 1. Ensure AWS credentials are properly configured
# 2. Review and adjust database instance sizes for your environment
# 3. Verify backup windows don't conflict with peak usage times
# 4. Confirm KMS key permissions are properly set
# 5. Review password policies and rotation requirements

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
  description = "AWS region for database resources"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
}

variable "db_username" {
  description = "Master username for the database cluster"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Master password for the database cluster"
  type        = string
  sensitive   = true
}

# Import network and security module outputs
variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for database placement"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Map of security group IDs"
  type        = map(string)
}

variable "kms_key_ids" {
  description = "Map of KMS key IDs"
  type        = map(string)
}

# Local variables for database configuration
locals {
  # Addressing requirement: Primary Database (7.3.1)
  db_family = "aurora-postgresql14"
  
  # Instance sizes by environment
  instance_sizes = {
    dev     = "db.r6g.large"
    staging = "db.r6g.xlarge"
    prod    = "db.r6g.2xlarge"
  }

  # Backup retention by environment
  backup_retention = {
    dev     = 7
    staging = 14
    prod    = 35
  }

  # Monitoring intervals by environment
  monitoring_interval = {
    dev     = 60
    staging = 30
    prod    = 15
  }

  # Common tags
  common_tags = {
    Environment = var.environment
    Service     = "database"
    ManagedBy   = "terraform"
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  # Addressing requirement: Database Architecture (7.3.2)
  name        = "${var.environment}-db-subnet-group"
  description = "Database subnet group for ${var.environment} environment"
  subnet_ids  = var.private_subnet_ids

  tags = merge(local.common_tags, {
    Name = "${var.environment}-db-subnet-group"
  })
}

# DB Parameter Group
resource "aws_db_parameter_group" "main" {
  # Addressing requirement: Primary Database (7.3.1)
  name        = "${var.environment}-db-parameter-group"
  family      = local.db_family
  description = "Database parameter group for ${var.environment} environment"

  # PostgreSQL optimization parameters
  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/4}"
  }

  parameter {
    name  = "max_connections"
    value = "GREATEST({DBInstanceClassMemory/9531392},5000)"
  }

  parameter {
    name  = "work_mem"
    value = "16384"
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "2097152"
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-db-parameter-group"
  })
}

# Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "main" {
  # Addressing requirement: Primary Database (7.3.1) and High Availability (5.5.1)
  cluster_identifier     = "${var.environment}-aurora-cluster"
  engine                = "aurora-postgresql"
  engine_version        = "14.6"
  database_name         = var.db_name
  master_username       = var.db_username
  master_password       = var.db_password
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_ids["db_security_group_id"]]

  # Backup configuration
  backup_retention_period = lookup(local.backup_retention, var.environment, 7)
  preferred_backup_window = "03:00-04:00"
  
  # Maintenance configuration
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  
  # Encryption configuration
  storage_encrypted = true
  kms_key_id       = var.kms_key_ids["data_key_id"]

  # High availability configuration
  availability_zones = [for subnet in var.private_subnet_ids : data.aws_subnet.selected[subnet].availability_zone]
  
  # Additional settings
  port                   = 5432
  db_cluster_parameter_group_name = aws_db_parameter_group.main.name
  enable_http_endpoint   = false
  deletion_protection    = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.environment}-aurora-final-snapshot"
  apply_immediately      = false

  tags = merge(local.common_tags, {
    Name = "${var.environment}-aurora-cluster"
  })
}

# Aurora PostgreSQL Cluster Instances
resource "aws_rds_cluster_instance" "instances" {
  # Addressing requirement: High Availability (5.5.1)
  count = var.environment == "prod" ? 3 : (var.environment == "staging" ? 2 : 1)

  identifier         = "${var.environment}-aurora-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = lookup(local.instance_sizes, var.environment, "db.r6g.large")
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  # Performance configuration
  monitoring_interval = lookup(local.monitoring_interval, var.environment, 60)
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  
  # Instance configuration
  db_parameter_group_name = aws_db_parameter_group.main.name
  auto_minor_version_upgrade = true
  
  # Performance Insights configuration
  performance_insights_enabled = true
  performance_insights_kms_key_id = var.kms_key_ids["data_key_id"]
  performance_insights_retention_period = var.environment == "prod" ? 731 : 7

  # Additional settings
  publicly_accessible = false
  copy_tags_to_snapshot = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-aurora-instance-${count.index + 1}"
  })
}

# IAM role for enhanced monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.environment}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Data source to get subnet information
data "aws_subnet" "selected" {
  for_each = toset(var.private_subnet_ids)
  id       = each.value
}

# Outputs
output "cluster_endpoint" {
  description = "Writer endpoint of the Aurora cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "Reader endpoint of the Aurora cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_identifier" {
  description = "Identifier of the Aurora cluster"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "database_name" {
  description = "Name of the created database"
  value       = aws_rds_cluster.main.database_name
}