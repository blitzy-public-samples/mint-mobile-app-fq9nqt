# Human Tasks:
# 1. Verify AWS credentials and permissions for EKS cluster creation
# 2. Review node group instance types and sizes for your workload requirements
# 3. Confirm Kubernetes version compatibility with your applications
# 4. Check that the specified CIDR blocks don't conflict with existing networks
# 5. Review cluster add-ons and versions for compatibility

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
  description = "AWS region for EKS cluster"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version to use for the EKS cluster"
  type        = string
}

variable "node_group_min_size" {
  description = "Minimum size of the node group"
  type        = number
}

variable "node_group_max_size" {
  description = "Maximum size of the node group"
  type        = number
}

variable "node_group_desired_size" {
  description = "Desired size of the node group"
  type        = number
}

# Local variables
locals {
  cluster_name = "${var.environment}-${var.cluster_name}"
  
  node_groups = {
    main = {
      name           = "${local.cluster_name}-main"
      instance_types = ["t3.medium", "t3.large"]
      disk_size      = 50
    }
  }

  # Addressing requirement: Container Orchestration (7.5)
  cluster_addons = {
    coredns = {
      name    = "coredns"
      version = "v1.8.7-eksbuild.3"
    }
    kube_proxy = {
      name    = "kube-proxy"
      version = "v1.24.7-eksbuild.2"
    }
    vpc_cni = {
      name    = "vpc-cni"
      version = "v1.11.4-eksbuild.1"
    }
  }

  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "kubernetes"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  # Addressing requirement: Container Orchestration (7.5)
  name     = local.cluster_name
  role_arn = var.iam_role_arns.app_role_arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [var.security_group_ids.app_security_group_id]
  }

  # Addressing requirement: High Availability (5.2.3)
  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  tags = merge(local.common_tags, {
    Name = local.cluster_name
  })

  depends_on = [
    aws_cloudwatch_log_group.eks
  ]
}

# CloudWatch Log Group for EKS
resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/${local.cluster_name}/cluster"
  retention_in_days = 30

  tags = local.common_tags
}

# EKS Node Groups
resource "aws_eks_node_group" "main" {
  # Addressing requirement: Horizontal Scaling (5.5.1)
  for_each = local.node_groups

  cluster_name    = aws_eks_cluster.main.name
  node_group_name = each.value.name
  node_role_arn   = var.iam_role_arns.app_role_arn
  subnet_ids      = var.private_subnet_ids
  instance_types  = each.value.instance_types
  disk_size       = each.value.disk_size

  scaling_config {
    desired_size = var.node_group_desired_size
    max_size     = var.node_group_max_size
    min_size     = var.node_group_min_size
  }

  # Addressing requirement: High Availability (5.2.3)
  update_config {
    max_unavailable = 1
  }

  tags = merge(local.common_tags, {
    Name = each.value.name
  })

  depends_on = [
    aws_eks_cluster.main
  ]
}

# EKS Cluster Add-ons
resource "aws_eks_addon" "cluster_addons" {
  # Addressing requirement: Container Orchestration (7.5)
  for_each = local.cluster_addons

  cluster_name = aws_eks_cluster.main.name
  addon_name   = each.value.name
  addon_version = each.value.version
  resolve_conflicts = "OVERWRITE"

  tags = local.common_tags

  depends_on = [
    aws_eks_cluster.main,
    aws_eks_node_group.main
  ]
}

# Outputs
output "cluster_id" {
  description = "ID of the created EKS cluster"
  value       = aws_eks_cluster.main.id
}

output "cluster_endpoint" {
  description = "Endpoint URL for the EKS cluster API server"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data for cluster authentication"
  value       = aws_eks_cluster.main.certificate_authority[0].data
}

output "node_group_ids" {
  description = "List of created node group IDs"
  value       = [for ng in aws_eks_node_group.main : ng.id]
}

output "cluster_security_group_id" {
  description = "ID of the cluster security group"
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}