# Human Tasks:
# 1. Review and adjust CloudWatch log retention periods based on compliance requirements
# 2. Verify Prometheus and Grafana workspace configurations match your monitoring needs
# 3. Review alert thresholds and adjust based on application behavior
# 4. Configure notification endpoints for SNS topics
# 5. Ensure IAM roles and policies align with security requirements

# Provider version constraints
terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for monitoring resources"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 90
}

variable "vpc_id" {
  description = "ID of the VPC where monitoring resources will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for monitoring components"
  type        = list(string)
}

variable "app_security_group_id" {
  description = "Security group ID for application components"
  type        = string
}

# Local variables for monitoring configuration
locals {
  # Addressing requirement: Application Monitoring (7.4)
  monitoring_namespace = "${var.environment}-monitoring"
  
  # Set retention periods based on environment
  log_retention_days = {
    prod = 90
    staging = 60
    dev = 30
  }

  # Alert thresholds
  alert_thresholds = {
    cpu_utilization    = 80
    memory_utilization = 85
    error_rate        = 5
    latency_p95       = 500
  }

  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "monitoring"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  # Addressing requirement: Logging (7.4)
  name              = "/aws/application/${var.environment}"
  retention_in_days = lookup(local.log_retention_days, var.environment, var.retention_days)
  kms_key_id       = aws_kms_key.logs.arn

  tags = merge(local.common_tags, {
    Name = "${var.environment}-application-logs"
  })
}

resource "aws_cloudwatch_log_group" "system" {
  # Addressing requirement: Logging (7.4)
  name              = "/aws/system/${var.environment}"
  retention_in_days = lookup(local.log_retention_days, var.environment, var.retention_days)
  kms_key_id       = aws_kms_key.logs.arn

  tags = merge(local.common_tags, {
    Name = "${var.environment}-system-logs"
  })
}

# KMS Key for log encryption
resource "aws_kms_key" "logs" {
  # Addressing requirement: Security Monitoring (9.3.2)
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "*"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# Prometheus Workspace
resource "aws_prometheus_workspace" "main" {
  # Addressing requirement: Application Monitoring (7.4)
  alias = "${var.environment}-prometheus"

  logging_configuration {
    log_group_arn = "${aws_cloudwatch_log_group.system.arn}:*"
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-prometheus"
  })
}

# Grafana Workspace
resource "aws_grafana_workspace" "main" {
  # Addressing requirement: Application Monitoring (7.4)
  name                  = "${var.environment}-grafana"
  account_access_type   = "CURRENT_ACCOUNT"
  authentication_providers = ["AWS_SSO"]
  permission_type       = "SERVICE_MANAGED"
  role_arn             = aws_iam_role.grafana.arn

  data_sources = ["PROMETHEUS", "CLOUDWATCH"]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-grafana"
  })
}

# IAM Role for Grafana
resource "aws_iam_role" "grafana" {
  name = "${var.environment}-grafana-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "grafana.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  # Addressing requirement: Application Monitoring (7.4)
  alarm_name          = "${var.environment}-high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name        = "CPUUtilization"
  namespace          = "AWS/ECS"
  period             = 300
  statistic          = "Average"
  threshold          = local.alert_thresholds.cpu_utilization
  alarm_description  = "High CPU utilization"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-cpu-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  # Addressing requirement: Security Monitoring (9.3.2)
  alarm_name          = "${var.environment}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name        = "5XXError"
  namespace          = "AWS/ApiGateway"
  period             = 300
  statistic          = "Average"
  threshold          = local.alert_thresholds.error_rate
  alarm_description  = "High API error rate"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-error-alarm"
  })
}

# SNS Topics for Alerts
resource "aws_sns_topic" "alerts" {
  # Addressing requirement: Security Monitoring (9.3.2)
  name              = "${var.environment}-monitoring-alerts"
  kms_master_key_id = aws_kms_key.sns.arn

  tags = merge(local.common_tags, {
    Name = "${var.environment}-alerts-topic"
  })
}

# KMS Key for SNS encryption
resource "aws_kms_key" "sns" {
  description             = "KMS key for SNS topic encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

# Security Group for Monitoring Components
resource "aws_security_group" "monitoring" {
  name        = "${var.environment}-monitoring-sg"
  description = "Security group for monitoring components"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 9090
    to_port         = 9090
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
    description     = "Prometheus access"
  }

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
    description     = "Grafana access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-monitoring-sg"
  })
}

# Outputs
output "prometheus_workspace_id" {
  description = "ID of the created Prometheus workspace"
  value       = aws_prometheus_workspace.main.id
}

output "grafana_workspace_id" {
  description = "ID of the created Grafana workspace"
  value       = aws_grafana_workspace.main.id
}

output "log_group_names" {
  description = "Map of created CloudWatch log group names"
  value = {
    application = aws_cloudwatch_log_group.application.name
    system      = aws_cloudwatch_log_group.system.name
  }
}

output "alarm_arns" {
  description = "Map of created CloudWatch alarm ARNs"
  value = {
    cpu_utilization = aws_cloudwatch_metric_alarm.cpu_utilization.arn
    error_rate      = aws_cloudwatch_metric_alarm.error_rate.arn
  }
}

output "sns_topic_arns" {
  description = "Map of created SNS topic ARNs"
  value = {
    alerts = aws_sns_topic.alerts.arn
  }
}