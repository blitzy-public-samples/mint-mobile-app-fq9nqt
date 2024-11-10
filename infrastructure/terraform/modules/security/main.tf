# Human Tasks:
# 1. Review and adjust WAF rules based on specific security requirements
# 2. Verify KMS key policies align with organizational security standards
# 3. Review IAM roles and policies for principle of least privilege
# 4. Confirm security group rules match application architecture requirements
# 5. Ensure all required tags are properly configured

# Provider version constraints
terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for security resources"
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
  description = "ID of the VPC"
  type        = string
}

# Local variables for security configuration
locals {
  name_prefix = "${var.environment}-${var.service_name}"
  
  common_tags = {
    Environment = var.environment
    Service     = var.service_name
    ManagedBy   = "terraform"
  }

  # WAF rule configurations
  waf_rules = [
    {
      name     = "SQLInjectionRule"
      priority = 1
      action   = "block"
      statement = {
        sql_injection_match_statement = {
          field_to_match = {
            body = {}
          }
          text_transformation = [
            {
              priority = 1
              type     = "URL_DECODE"
            },
            {
              priority = 2
              type     = "HTML_ENTITY_DECODE"
            }
          ]
        }
      }
    },
    {
      name     = "XSSRule"
      priority = 2
      action   = "block"
      statement = {
        xss_match_statement = {
          field_to_match = {
            body = {}
          }
          text_transformation = [
            {
              priority = 1
              type     = "URL_DECODE"
            },
            {
              priority = 2
              type     = "HTML_ENTITY_DECODE"
            }
          ]
        }
      }
    },
    {
      name     = "RateLimitRule"
      priority = 3
      action   = "block"
      statement = {
        rate_based_statement = {
          limit              = 2000
          aggregate_key_type = "IP"
        }
      }
    }
  ]
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  # Addressing requirement: Security Architecture (5.4)
  name        = "${local.name_prefix}-web-acl"
  description = "WAF Web ACL for API and application protection"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  dynamic "rule" {
    for_each = local.waf_rules
    content {
      name     = rule.value.name
      priority = rule.value.priority

      override_action {
        none {}
      }

      statement {
        dynamic "sql_injection_match_statement" {
          for_each = try([rule.value.statement.sql_injection_match_statement], [])
          content {
            field_to_match {
              body {}
            }
            text_transformation {
              priority = 1
              type     = "URL_DECODE"
            }
          }
        }

        dynamic "xss_match_statement" {
          for_each = try([rule.value.statement.xss_match_statement], [])
          content {
            field_to_match {
              body {}
            }
            text_transformation {
              priority = 1
              type     = "URL_DECODE"
            }
          }
        }

        dynamic "rate_based_statement" {
          for_each = try([rule.value.statement.rate_based_statement], [])
          content {
            limit              = rate_based_statement.value.limit
            aggregate_key_type = rate_based_statement.value.aggregate_key_type
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name               = rule.value.name
        sampled_requests_enabled  = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "${local.name_prefix}-web-acl"
    sampled_requests_enabled  = true
  }

  tags = local.common_tags
}

# Security Groups
resource "aws_security_group" "app" {
  # Addressing requirement: Security Architecture (5.4)
  name        = "${local.name_prefix}-app-sg"
  description = "Security group for application tier"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from ALB"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-sg"
  })
}

resource "aws_security_group" "db" {
  # Addressing requirement: Security Architecture (5.4)
  name        = "${local.name_prefix}-db-sg"
  description = "Security group for database tier"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Database access from application tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-sg"
  })
}

# KMS Keys
resource "aws_kms_key" "data" {
  # Addressing requirement: Data Security (9.2)
  description             = "KMS key for data encryption"
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
        Action = [
          "kms:*"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:CallerAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-key"
  })
}

resource "aws_kms_key" "secrets" {
  # Addressing requirement: Data Security (9.2)
  description             = "KMS key for secrets encryption"
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
        Action = [
          "kms:*"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:CallerAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secrets-key"
  })
}

# IAM Roles
resource "aws_iam_role" "app" {
  # Addressing requirement: Authentication and Authorization (9.1)
  name = "${local.name_prefix}-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role" "api" {
  # Addressing requirement: Authentication and Authorization (9.1)
  name = "${local.name_prefix}-api-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policies
resource "aws_iam_policy" "app" {
  # Addressing requirement: Authentication and Authorization (9.1)
  name = "${local.name_prefix}-app-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.data.arn,
          aws_kms_key.secrets.arn
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "api" {
  # Addressing requirement: Authentication and Authorization (9.1)
  name = "${local.name_prefix}-api-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "execute-api:Invoke"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role Policy Attachments
resource "aws_iam_role_policy_attachment" "app" {
  policy_arn = aws_iam_policy.app.arn
  role       = aws_iam_role.app.name
}

resource "aws_iam_role_policy_attachment" "api" {
  policy_arn = aws_iam_policy.api.arn
  role       = aws_iam_role.api.name
}

# Data Sources
data "aws_caller_identity" "current" {}

# Outputs
output "waf_web_acl_id" {
  description = "ID of the created WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "security_group_ids" {
  description = "Map of created security group IDs"
  value = {
    app_security_group_id = aws_security_group.app.id
    db_security_group_id  = aws_security_group.db.id
  }
}

output "kms_key_ids" {
  description = "Map of created KMS key IDs"
  value = {
    data_key_id    = aws_kms_key.data.id
    secret_key_id  = aws_kms_key.secrets.id
  }
}

output "iam_role_arns" {
  description = "Map of created IAM role ARNs"
  value = {
    app_role_arn = aws_iam_role.app.arn
    api_role_arn = aws_iam_role.api.arn
  }
}