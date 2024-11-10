// AWS CDK v2.0.0
import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';

/**
 * HUMAN TASKS:
 * 1. Review and approve WAF rule configurations and rate limits
 * 2. Verify KMS key policies align with organizational security requirements
 * 3. Confirm IAM role permissions follow least privilege principle
 * 4. Set up security monitoring alerts and notifications
 * 5. Configure AWS Config rules for compliance monitoring
 * 6. Enable AWS GuardDuty for threat detection
 * 7. Set up AWS CloudTrail for API activity logging
 */

export class SecurityStack extends Stack {
  public readonly wafAcl: wafv2.CfnWebACL;
  public readonly kmsKeys: kms.Key[];
  public readonly serviceRoles: iam.Role[];
  public readonly monitoringRole: iam.Role;

  constructor(scope: Construct, id: string, props: StackProps & { networkStack: NetworkStack }) {
    super(scope, id, props);

    // Requirement 5.4: Security Architecture - WAF implementation
    this.wafAcl = this.createWafRules();

    // Requirement 9.2: Data Security - KMS key management
    this.kmsKeys = this.setupKmsKeys();

    // Requirement 9.1: Authentication and Authorization - IAM roles
    this.serviceRoles = this.createServiceRoles();

    // Set up security monitoring and compliance controls
    this.setupSecurityMonitoring();
  }

  private createWafRules(): wafv2.CfnWebACL {
    // Requirement 5.4: Implementation of WAF rules for application protection
    const wafAcl = new wafv2.CfnWebACL(this, 'MintReplicaWAF', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'MintReplicaWAFMetrics',
        sampledRequestsEnabled: true,
      },
      rules: [
        // Rate limiting rule
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 100,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitMetric',
            sampledRequestsEnabled: true,
          },
        },
        // SQL injection protection
        {
          name: 'SQLInjectionRule',
          priority: 2,
          statement: {
            sqlInjectionMatchStatement: {
              fieldToMatch: { body: {} },
              textTransformations: [{ priority: 1, type: 'URL_DECODE' }],
            },
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLInjectionMetric',
            sampledRequestsEnabled: true,
          },
        },
        // XSS protection
        {
          name: 'XSSRule',
          priority: 3,
          statement: {
            xssMatchStatement: {
              fieldToMatch: { body: {} },
              textTransformations: [{ priority: 1, type: 'HTML_ENTITY_DECODE' }],
            },
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'XSSMetric',
            sampledRequestsEnabled: true,
          },
        },
        // IP reputation list
        {
          name: 'IPReputationRule',
          priority: 4,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'IPReputationMetric',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    return wafAcl;
  }

  private setupKmsKeys(): kms.Key[] {
    // Requirement 9.2: Implementation of encryption and key management
    const keys: kms.Key[] = [];

    // Database encryption key
    const dbKey = new kms.Key(this, 'DatabaseEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for database encryption',
      alias: 'mint-replica/database',
      removalPolicy: RemovalPolicy.RETAIN,
    });
    keys.push(dbKey);

    // Secrets encryption key
    const secretsKey = new kms.Key(this, 'SecretsEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for Secrets Manager',
      alias: 'mint-replica/secrets',
      removalPolicy: RemovalPolicy.RETAIN,
    });
    keys.push(secretsKey);

    // Backup encryption key
    const backupKey = new kms.Key(this, 'BackupEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for S3 backups',
      alias: 'mint-replica/backups',
      removalPolicy: RemovalPolicy.RETAIN,
    });
    keys.push(backupKey);

    return keys;
  }

  private createServiceRoles(): iam.Role[] {
    // Requirement 9.1: Implementation of IAM roles and policies
    const roles: iam.Role[] = [];

    // ECS task execution role
    const ecsTaskRole = new iam.Role(this, 'ECSTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for ECS tasks',
    });

    ecsTaskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
        'kms:Decrypt',
      ],
      resources: this.kmsKeys.map(key => key.keyArn),
    }));
    roles.push(ecsTaskRole);

    // Lambda function role
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Lambda functions',
    });

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    }));
    roles.push(lambdaRole);

    // Monitoring role
    this.monitoringRole = new iam.Role(this, 'MonitoringRole', {
      assumedBy: new iam.ServicePrincipal('monitoring.amazonaws.com'),
      description: 'Role for CloudWatch monitoring',
    });

    this.monitoringRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudwatch:PutMetricData',
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    }));
    roles.push(this.monitoringRole);

    return roles;
  }

  private setupSecurityMonitoring(): void {
    // Set up GuardDuty detector
    const alarmTopic = new cloudwatch.Alarm(this, 'SecurityAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/GuardDuty',
        metricName: 'HighSeverityFindings',
        statistic: 'Sum',
        period: cloudwatch.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    // Create CloudWatch dashboard for security metrics
    const dashboard = new cloudwatch.Dashboard(this, 'SecurityDashboard', {
      dashboardName: 'MintReplica-Security',
    });

    // Add WAF metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'WAF Blocked Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/WAFV2',
            metricName: 'BlockedRequests',
            dimensions: { WebACL: this.wafAcl.attrId },
            statistic: 'Sum',
          }),
        ],
      }),
    );

    // Add KMS metrics
    this.kmsKeys.forEach(key => {
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: `KMS Key Usage - ${key.alias}`,
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/KMS',
              metricName: 'KeyUsage',
              dimensions: { KeyId: key.keyId },
              statistic: 'Sum',
            }),
          ],
        }),
      );
    });

    // Export security resources
    new CfnOutput(this, 'WAFAclId', {
      value: this.wafAcl.attrId,
      description: 'WAF Web ACL ID',
    });

    this.kmsKeys.forEach((key, index) => {
      new CfnOutput(this, `KMSKey${index}Arn`, {
        value: key.keyArn,
        description: `KMS Key ARN - ${key.alias}`,
      });
    });
  }
}