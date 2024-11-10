# Human Tasks:
# 1. Ensure AWS credentials are properly configured
# 2. Verify the domain certificate exists in AWS Certificate Manager
# 3. Review and adjust EKS node instance types based on workload requirements
# 4. Confirm API Gateway throttling limits are appropriate for your use case
# 5. Verify WAF rules align with security requirements

# Provider version constraints
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
}

# Variables
variable "aws_region" {
  description = "AWS region for API infrastructure"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "api_domain" {
  description = "Domain name for the API"
  type        = string
}

variable "eks_cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
}

# Data sources for network and security dependencies
data "aws_vpc" "main" {
  id = var.vpc_id
}

data "aws_subnets" "private" {
  filter {
    name   = "subnet-id"
    values = var.private_subnet_ids
  }
}

# Local variables for configuration
locals {
  # Addressing requirement: API Gateway Layer (5.2.2)
  api_gateway_stages = {
    dev = {
      throttling_rate_limit  = 1000
      throttling_burst_limit = 500
    }
    staging = {
      throttling_rate_limit  = 2000
      throttling_burst_limit = 1000
    }
    prod = {
      throttling_rate_limit  = 5000
      throttling_burst_limit = 2000
    }
  }

  # Addressing requirement: Service Layer Architecture (5.2.3)
  eks_config = {
    cluster_name    = "${var.environment}-api-cluster"
    node_group_name = "${var.environment}-api-nodes"
    instance_types  = ["t3.medium", "t3.large"]
    desired_size    = var.environment == "prod" ? 3 : 2
    min_size        = var.environment == "prod" ? 3 : 1
    max_size        = var.environment == "prod" ? 10 : 5
  }

  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "api"
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "main" {
  # Addressing requirement: API Gateway Layer (5.2.2)
  name = "${var.environment}-api"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }

  binary_media_types = ["multipart/form-data", "application/octet-stream"]

  tags = local.common_tags
}

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  # Addressing requirement: API Gateway Layer (5.2.2)
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id  = aws_api_gateway_rest_api.main.id
  stage_name   = var.environment

  variables = {
    "environmentName" = var.environment
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip            = "$context.identity.sourceIp"
      caller        = "$context.identity.caller"
      user          = "$context.identity.user"
      requestTime   = "$context.requestTime"
      httpMethod    = "$context.httpMethod"
      resourcePath  = "$context.resourcePath"
      status        = "$context.status"
      protocol      = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = local.common_tags
}

# API Gateway Method Settings
resource "aws_api_gateway_method_settings" "main" {
  # Addressing requirement: API Gateway Layer (5.2.2)
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    throttling_rate_limit  = local.api_gateway_stages[var.environment].throttling_rate_limit
    throttling_burst_limit = local.api_gateway_stages[var.environment].throttling_burst_limit
    metrics_enabled       = true
    logging_level        = "INFO"
    data_trace_enabled   = var.environment != "prod"
    caching_enabled      = var.environment == "prod"
  }
}

# API Gateway WAF Association
resource "aws_wafregional_web_acl_association" "main" {
  # Addressing requirement: API Gateway Layer (5.2.2)
  resource_arn = aws_api_gateway_stage.main.arn
  web_acl_id   = var.waf_web_acl_id
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  # Addressing requirement: Service Layer Architecture (5.2.3)
  name     = local.eks_config.cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.eks_cluster_version

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = false
    security_group_ids      = [var.security_group_ids["app_security_group_id"]]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_cloudwatch_log_group.eks_cluster
  ]
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  # Addressing requirement: Deployment Architecture (5.6)
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = local.eks_config.node_group_name
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = var.private_subnet_ids
  instance_types  = local.eks_config.instance_types

  scaling_config {
    desired_size = local.eks_config.desired_size
    min_size     = local.eks_config.min_size
    max_size     = local.eks_config.max_size
  }

  update_config {
    max_unavailable = 1
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.eks_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry
  ]
}

# Application Load Balancer
resource "aws_lb" "api" {
  # Addressing requirement: Deployment Architecture (5.6)
  name               = "${var.environment}-api-lb"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [var.security_group_ids["app_security_group_id"]]
  subnets           = var.private_subnet_ids

  enable_deletion_protection = var.environment == "prod"

  access_logs {
    bucket  = aws_s3_bucket.lb_logs.id
    prefix  = "api-lb"
    enabled = true
  }

  tags = local.common_tags
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.environment}-api"
  retention_in_days = var.environment == "prod" ? 30 : 7
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${local.eks_config.cluster_name}/cluster"
  retention_in_days = var.environment == "prod" ? 30 : 7
  tags              = local.common_tags
}

# KMS Key for EKS encryption
resource "aws_kms_key" "eks" {
  description             = "KMS key for EKS cluster encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                   = local.common_tags
}

# S3 Bucket for Load Balancer Logs
resource "aws_s3_bucket" "lb_logs" {
  bucket = "${var.environment}-api-lb-logs"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "lb_logs" {
  bucket = aws_s3_bucket.lb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Roles and Policies
resource "aws_iam_role" "eks_cluster" {
  name = "${local.eks_config.cluster_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role" "eks_node" {
  name = "${local.eks_config.node_group_name}-role"

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

# IAM Role Policy Attachments
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node.name
}

# Outputs
output "api_gateway_id" {
  description = "ID of the created API Gateway"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_stage_name" {
  description = "Name of the deployed API stage"
  value       = aws_api_gateway_stage.main.stage_name
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "Endpoint URL of the EKS cluster"
  value       = aws_eks_cluster.main.endpoint
}

output "load_balancer_dns" {
  description = "DNS name of the application load balancer"
  value       = aws_lb.api.dns_name
}