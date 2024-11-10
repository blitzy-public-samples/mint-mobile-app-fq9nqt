# Human Tasks:
# 1. Ensure AWS credentials are properly configured with appropriate permissions
# 2. Verify the S3 bucket for Terraform state exists and is properly configured
# 3. Review and adjust resource sizing and scaling parameters if needed
# 4. Confirm domain names and DNS settings are correctly configured
# 5. Verify KMS key permissions and backup retention policies

# Provider and backend configuration
# Addressing requirement: Production Environment (10.1 Deployment Environment)
terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws" # v4.0
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes" # v2.0
      version = "~> 2.0"
    }
  }

  # Addressing requirement: Infrastructure State Management
  backend "s3" {
    bucket         = "mint-replica-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "mint-replica-terraform-locks"
  }
}

# Local variables
locals {
  environment = "prod"
  region     = "us-west-2"
  
  # Common tags for all resources
  common_tags = {
    Environment = "prod"
    Project     = "mint-replica-lite"
    ManagedBy   = "terraform"
  }
}

# AWS Provider configuration
# Addressing requirement: Cloud Services (10.2.1 AWS Service Configuration)
provider "aws" {
  region = local.region
  default_tags {
    tags = local.common_tags
  }
}

# Network Module
# Addressing requirement: Network Architecture (10.2.2 Network Architecture)
module "network" {
  source = "../modules/network"
  
  providers = {
    aws = aws
  }

  vpc_cidr = "10.0.0.0/16"
  environment = local.environment
  region = local.region
  availability_zones = [
    "us-west-2a",
    "us-west-2b",
    "us-west-2c"
  ]
  tags = local.common_tags
}

# Database Module
# Addressing requirement: Cloud Services (10.2.1 AWS Service Configuration)
module "database" {
  source = "../modules/database"
  
  providers = {
    aws = aws
  }

  environment = local.environment
  vpc_id = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  
  # Production database configuration
  rds_instance_count = 3  # Multi-AZ deployment
  redis_node_count = 3    # Cluster mode enabled
  
  # Database settings
  db_name = "mintreplica"
  db_username = "admin"
  db_password = var.db_master_password # Sensitive value from variables
  
  # Security settings
  security_group_ids = {
    db_security_group_id = aws_security_group.database.id
  }
  kms_key_ids = {
    data_key_id = aws_kms_key.database.id
  }
  
  tags = local.common_tags

  depends_on = [module.network]
}

# API Module
# Addressing requirement: Cloud Services (10.2.1 AWS Service Configuration)
module "api" {
  source = "../modules/api"
  
  providers = {
    aws = aws
  }

  environment = local.environment
  vpc_id = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  
  # API Gateway and domain configuration
  api_domain = "api.mintreplica.com"
  
  # EKS configuration
  eks_cluster_version = "1.24"
  
  # Security settings
  security_group_ids = {
    app_security_group_id = aws_security_group.application.id
  }
  waf_web_acl_id = aws_wafregional_web_acl.main.id
  
  tags = local.common_tags

  depends_on = [module.network]
}

# Security Groups
# Addressing requirement: Network Architecture (10.2.2 Network Architecture)
resource "aws_security_group" "application" {
  name        = "${local.environment}-application-sg"
  description = "Security group for application layer"
  vpc_id      = module.network.vpc_id

  # Allow inbound HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.environment}-application-sg"
  })
}

resource "aws_security_group" "database" {
  name        = "${local.environment}-database-sg"
  description = "Security group for database layer"
  vpc_id      = module.network.vpc_id

  # Allow inbound PostgreSQL from application layer
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.application.id]
  }

  # Allow inbound Redis from application layer
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.application.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.environment}-database-sg"
  })
}

# KMS Keys
# Addressing requirement: Cloud Services (10.2.1 AWS Service Configuration)
resource "aws_kms_key" "database" {
  description             = "KMS key for database encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${local.environment}-database-kms"
  })
}

# WAF Configuration
# Addressing requirement: Cloud Services (10.2.1 AWS Service Configuration)
resource "aws_wafregional_web_acl" "main" {
  name        = "${local.environment}-web-acl"
  metric_name = "${local.environment}WebAcl"

  default_action {
    type = "ALLOW"
  }

  # Rate limiting rule
  rule {
    priority = 1
    rule_id  = aws_wafregional_rate_based_rule.api_rate_limit.id
    type     = "RATE_BASED"

    action {
      type = "BLOCK"
    }
  }

  # SQL injection protection
  rule {
    priority = 2
    rule_id  = aws_wafregional_rule.sql_injection.id
    type     = "REGULAR"

    action {
      type = "BLOCK"
    }
  }

  tags = local.common_tags
}

resource "aws_wafregional_rate_based_rule" "api_rate_limit" {
  name        = "${local.environment}-api-rate-limit"
  metric_name = "${local.environment}ApiRateLimit"
  
  rate_key   = "IP"
  rate_limit = 2000

  tags = local.common_tags
}

resource "aws_wafregional_rule" "sql_injection" {
  name        = "${local.environment}-sql-injection-protection"
  metric_name = "${local.environment}SqlInjectionProtection"

  predicate {
    data_id = aws_wafregional_sql_injection_match_set.sql_injection_match_set.id
    negated = false
    type    = "SqlInjectionMatch"
  }

  tags = local.common_tags
}

resource "aws_wafregional_sql_injection_match_set" "sql_injection_match_set" {
  name = "${local.environment}-sql-injection-match-set"

  sql_injection_match_tuple {
    text_transformation = "URL_DECODE"

    field_to_match {
      type = "QUERY_STRING"
    }
  }

  sql_injection_match_tuple {
    text_transformation = "URL_DECODE"

    field_to_match {
      type = "BODY"
    }
  }
}

# Outputs
output "vpc_id" {
  description = "ID of the production VPC"
  value       = module.network.vpc_id
}

output "api_endpoint" {
  description = "Production API endpoint URL"
  value       = module.api.eks_cluster_endpoint
}

output "database_endpoint" {
  description = "Production database endpoint"
  value       = module.database.cluster_endpoint
}