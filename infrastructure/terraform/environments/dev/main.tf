# Human Tasks:
# 1. Ensure AWS credentials are properly configured with appropriate permissions
# 2. Verify the S3 bucket for Terraform state exists and is properly configured
# 3. Review and adjust resource sizing for development environment if needed
# 4. Confirm domain name settings match your requirements
# 5. Verify AWS region matches your deployment strategy

# Provider and backend configuration
# Addressing requirement: Infrastructure as Code (7.5 Development and Deployment Tools)
terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws" # v4.0
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random" # v3.0
      version = "~> 3.0"
    }
  }

  # Addressing requirement: Infrastructure as Code (7.5)
  backend "s3" {
    bucket         = "mint-replica-terraform-state-dev"
    key            = "dev/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "mint-replica-terraform-locks"
  }
}

# AWS Provider configuration
provider "aws" {
  region = var.aws_region
}

# Local variables
locals {
  environment = "dev"
  region     = var.aws_region
  
  # Common tags for all resources
  common_tags = {
    Environment = "development"
    Project     = "mint-replica-lite"
    ManagedBy   = "terraform"
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for deploying resources"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "domain_name" {
  description = "Domain name for the development environment"
  type        = string
  default     = "dev.mintreplica.com"
}

# Network Module
# Addressing requirement: Development Environment (10.1)
module "network" {
  source = "../../modules/network"

  environment = local.environment
  region      = local.region
  vpc_cidr    = var.vpc_cidr
  tags        = local.common_tags

  # Development environment uses single AZ for cost optimization
  availability_zones = ["${local.region}a"]
}

# Database Module
# Addressing requirement: Cloud Services Configuration (10.2.1)
module "database" {
  source = "../../modules/database"

  environment = local.environment
  vpc_id      = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  
  # Development environment configuration
  rds_instance_count = 1  # Single node for development
  redis_node_count   = 1  # Single node for development
  
  # Database configuration
  db_name     = "mintreplica_dev"
  db_username = "admin"
  db_password = random_password.database_password.result
  
  tags = local.common_tags

  depends_on = [module.network]
}

# API Module
# Addressing requirement: Cloud Services Configuration (10.2.1)
module "api" {
  source = "../../modules/api"

  environment = local.environment
  vpc_id      = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  domain_name = var.domain_name
  
  # EKS configuration for development
  eks_cluster_version = "1.24"
  eks_node_group_config = {
    desired_size = 1
    min_size     = 1
    max_size     = 2
    instance_types = ["t3.medium"]
  }
  
  tags = local.common_tags

  depends_on = [module.network]
}

# Random password generation for database
resource "random_password" "database_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "database_endpoint" {
  description = "Primary RDS Aurora cluster endpoint"
  value       = module.database.rds_cluster_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Primary Redis cluster endpoint"
  value       = module.database.redis_primary_endpoint
  sensitive   = true
}

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.api.api_endpoint
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.api.eks_cluster_endpoint
  sensitive   = true
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.api.eks_cluster_name
}