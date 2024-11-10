# Human Tasks:
# 1. Ensure AWS credentials are properly configured for staging environment
# 2. Verify S3 bucket exists for Terraform state storage
# 3. Review and adjust resource sizing based on staging workload requirements
# 4. Confirm domain certificates are provisioned in AWS Certificate Manager
# 5. Verify KMS key permissions are properly configured

# Provider and backend configuration
terraform {
  # Addressing requirement: Infrastructure Security (5.4)
  required_version = ">= 1.0.0"
  
  backend "s3" {
    bucket         = "mint-replica-lite-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }

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
}

# Local variables
locals {
  environment = "staging"
  region     = "us-west-2"
  
  # Common tags for all resources
  common_tags = {
    Environment = "staging"
    Project     = "mint-replica-lite"
    ManagedBy   = "terraform"
  }
}

# AWS Provider configuration
provider "aws" {
  region = local.region
  default_tags {
    tags = local.common_tags
  }
}

# Random string for unique resource names
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Network Module
module "network" {
  # Addressing requirement: Network Architecture (5.2.2)
  source = "../modules/network"
  
  providers = {
    aws = aws
  }

  environment = local.environment
  vpc_cidr    = "10.1.0.0/16"  # Staging VPC CIDR block
  
  # Multi-AZ configuration for high availability
  availability_zones = [
    "us-west-2a",
    "us-west-2b",
    "us-west-2c"
  ]
  
  # Subnet CIDR blocks
  private_subnet_cidrs = [
    "10.1.1.0/24",
    "10.1.2.0/24",
    "10.1.3.0/24"
  ]
  public_subnet_cidrs = [
    "10.1.11.0/24",
    "10.1.12.0/24",
    "10.1.13.0/24"
  ]
}

# Database Module
module "database" {
  # Addressing requirement: Primary Database (7.3.1)
  source = "../modules/database"
  
  providers = {
    aws = aws
  }

  environment = local.environment
  vpc_id      = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  
  # Database configuration
  rds_instance_count = 2  # Fixed 2-node deployment for staging
  redis_node_count   = 2  # Redis cluster with 2 nodes
  
  # Database settings
  db_name = "mintreplica_staging"
  engine_version = "14.6"
  instance_class = "db.r6g.xlarge"
  
  # Backup and security configuration
  backup_retention_period = 7
  storage_encrypted      = true
  
  depends_on = [module.network]
}

# API Module
module "api" {
  # Addressing requirement: API Gateway Layer (5.2.2)
  source = "../modules/api"
  
  providers = {
    aws = aws
  }

  environment = local.environment
  vpc_id      = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  
  # API Gateway and domain configuration
  domain_name = "api-staging.mintreplica.com"
  
  # EKS configuration
  eks_cluster_version    = "1.24"
  node_group_min_size   = 2  # Fixed 2-node deployment for staging
  node_group_max_size   = 2
  node_group_desired_size = 2
  
  depends_on = [module.network]
}

# Outputs
output "vpc_id" {
  description = "ID of the staging VPC"
  value       = module.network.vpc_id
}

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.api.api_gateway_stage_name
}

output "database_endpoint" {
  description = "Primary database endpoint"
  value       = module.database.cluster_endpoint
}

output "database_reader_endpoint" {
  description = "Database reader endpoint"
  value       = module.database.cluster_reader_endpoint
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.api.eks_cluster_endpoint
}

output "load_balancer_dns" {
  description = "Application load balancer DNS name"
  value       = module.api.load_balancer_dns
}