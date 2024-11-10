#!/usr/bin/env node
// AWS CDK v2.0.0

/**
 * HUMAN TASKS:
 * 1. Configure AWS credentials and region in AWS CLI or environment variables
 * 2. Set up environment-specific configuration in AWS Parameter Store
 * 3. Review and approve resource configurations before deployment
 * 4. Configure DNS and SSL certificates for production domains
 * 5. Set up monitoring alerts and notifications
 */

import { App, Environment, Tags } from 'aws-cdk-lib';
import { ApiStack } from '../lib/api-stack';
import { DatabaseStack } from '../lib/database-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

// Requirement 7.5: Infrastructure as Code - Create CDK App instance
const app = new App();

// Get deployment stage from environment variables
const deploymentStage = process.env.DEPLOYMENT_STAGE || 'development';

// Requirement 10.1: Implementation of cloud-native deployment model
function configureEnvironment(stage: string): Environment {
  // Configure AWS environment based on stage
  let account: string;
  switch (stage) {
    case 'production':
      account = '123456789012'; // Replace with actual production account ID
      break;
    case 'staging':
      account = '234567890123'; // Replace with actual staging account ID
      break;
    case 'development':
    default:
      account = '345678901234'; // Replace with actual development account ID
      break;
  }

  return {
    account,
    region: 'us-east-1' // Using us-east-1 for all environments
  };
}

// Get environment configuration
const env = configureEnvironment(deploymentStage);

// Requirement 10.2.1: AWS Service Configuration - Create stacks with environment-specific settings
const stackProps = {
  env,
  tags: {
    Environment: deploymentStage,
    Project: 'MintReplicaLite',
    ManagedBy: 'CDK'
  }
};

// Requirement 7.3.1: Database Configuration - Create Database stack
const databaseStack = new DatabaseStack(app, `MintReplica-Database-${deploymentStage}`, {
  ...stackProps,
  description: 'Database infrastructure including PostgreSQL Aurora, Redis, and TimescaleDB'
});

// Requirement 5.2.2: API Gateway - Create API stack
const apiStack = new ApiStack(app, `MintReplica-API-${deploymentStage}`, {
  ...stackProps,
  description: 'API infrastructure including API Gateway and ECS services',
  databaseSecretArn: databaseStack.dbSecrets[0].secretArn, // PostgreSQL credentials
  redisEndpoint: databaseStack.redisCluster.attrRedisEndpointAddress
});

// Requirement 7.5: Development and Deployment Tools - Create Monitoring stack
const monitoringStack = new MonitoringStack(app, `MintReplica-Monitoring-${deploymentStage}`, {
  ...stackProps,
  description: 'Monitoring infrastructure including Prometheus, Grafana, and logging'
});

// Add stack dependencies
apiStack.addDependency(databaseStack);
monitoringStack.addDependency(apiStack);

// Add environment-specific tags for resource management
Tags.of(app).add('Stage', deploymentStage);
Tags.of(app).add('Application', 'MintReplicaLite');
Tags.of(app).add('Owner', 'Platform Team');

// Synthesize CloudFormation template
app.synth();