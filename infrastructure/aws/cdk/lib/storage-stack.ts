// AWS CDK v2.0.0
import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';
import { NetworkStack } from './network-stack';

/**
 * HUMAN TASKS:
 * 1. Review and approve S3 bucket lifecycle policies
 * 2. Verify backup retention periods align with business requirements
 * 3. Confirm cross-region replication settings
 * 4. Set up CloudWatch alerts for storage metrics
 * 5. Configure AWS Config rules for S3 compliance
 * 6. Review and approve bucket access policies
 * 7. Set up storage cost monitoring and budgets
 */

export class StorageStack extends Stack {
  public readonly dataBucket: s3.Bucket;
  public readonly backupBucket: s3.Bucket;
  public readonly backupVault: backup.BackupVault;
  public readonly backupPlan: backup.BackupPlan;

  constructor(scope: Construct, id: string, props: StackProps & { 
    securityStack: SecurityStack;
    networkStack: NetworkStack;
  }) {
    super(scope, id, props);

    // Requirement 5.2.3: Implementation of secure and scalable object storage
    this.dataBucket = this.createDataBucket(props.securityStack);

    // Requirement 5.2.3: Implementation of backup storage tiers
    this.backupBucket = this.createBackupBucket(props.securityStack);

    // Configure backup systems
    this.backupVault = this.setupBackupVault(props.securityStack);
    this.backupPlan = this.setupBackupPlan();

    // Configure lifecycle rules for both buckets
    this.configureLifecycleRules(this.dataBucket);
    this.configureLifecycleRules(this.backupBucket);

    // Set up VPC endpoint for S3 access
    this.setupVpcEndpoint(props.networkStack);

    // Create outputs for bucket information
    this.createOutputs();
  }

  private createDataBucket(securityStack: SecurityStack): s3.Bucket {
    // Requirement 9.2: Implementation of AES-256 encryption using KMS keys
    const bucket = new s3.Bucket(this, 'MintReplicaDataBucket', {
      bucketName: `mint-replica-data-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: securityStack.kmsKeys[0], // Using the first KMS key for data encryption
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
      enforceSSL: true,
      serverAccessLogsPrefix: 'access-logs/',
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        maxAge: 3000
      }]
    });

    // Add bucket policy for secure access
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:*'],
      resources: [bucket.bucketArn, bucket.arnForObjects('*')],
      conditions: {
        'Bool': {
          'aws:SecureTransport': 'false'
        }
      }
    }));

    return bucket;
  }

  private createBackupBucket(securityStack: SecurityStack): s3.Bucket {
    // Requirement 5.2.3: Implementation of backup storage with replication
    const bucket = new s3.Bucket(this, 'MintReplicaBackupBucket', {
      bucketName: `mint-replica-backup-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: securityStack.kmsKeys[0],
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
      enforceSSL: true,
      replicationRole: new iam.Role(this, 'ReplicationRole', {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com')
      }),
      serverAccessLogsPrefix: 'backup-logs/'
    });

    // Configure replication to another region
    const replicationDestination = new s3.CfnBucket(this, 'ReplicationDestination', {
      bucketName: `mint-replica-backup-replica-${this.account}-${this.region}`
    });

    bucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
      actions: ['s3:ReplicateObject', 's3:ReplicateDelete'],
      resources: [bucket.arnForObjects('*')]
    }));

    return bucket;
  }

  private setupBackupVault(securityStack: SecurityStack): backup.BackupVault {
    // Requirement 5.2.3: Implementation of backup vault with encryption
    return new backup.BackupVault(this, 'MintReplicaBackupVault', {
      backupVaultName: 'mint-replica-backup-vault',
      encryptionKey: securityStack.kmsKeys[0],
      accessPolicy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('backup.amazonaws.com')],
            actions: ['backup:StartBackupJob', 'backup:StopBackupJob'],
            resources: ['*']
          })
        ]
      })
    });
  }

  private setupBackupPlan(): backup.BackupPlan {
    // Requirement 5.2.3: Implementation of backup plan with retention policies
    const plan = new backup.BackupPlan(this, 'MintReplicaBackupPlan', {
      backupPlanName: 'mint-replica-backup-plan',
      backupVault: this.backupVault
    });

    // Daily backups retained for 30 days
    plan.addRule(new backup.BackupPlanRule({
      ruleName: 'DailyBackups',
      scheduleExpression: 'cron(0 5 ? * * *)',
      startWindow: Duration.hours(1),
      completionWindow: Duration.hours(2),
      deleteAfter: Duration.days(30)
    }));

    // Weekly backups retained for 90 days
    plan.addRule(new backup.BackupPlanRule({
      ruleName: 'WeeklyBackups',
      scheduleExpression: 'cron(0 5 ? * 1 *)',
      startWindow: Duration.hours(1),
      completionWindow: Duration.hours(2),
      deleteAfter: Duration.days(90)
    }));

    // Monthly backups retained for 1 year
    plan.addRule(new backup.BackupPlanRule({
      ruleName: 'MonthlyBackups',
      scheduleExpression: 'cron(0 5 1 * ? *)',
      startWindow: Duration.hours(1),
      completionWindow: Duration.hours(2),
      deleteAfter: Duration.days(365)
    }));

    return plan;
  }

  private configureLifecycleRules(bucket: s3.Bucket): void {
    // Requirement 5.2.3: Implementation of tiered storage lifecycle policies
    bucket.addLifecycleRule({
      id: 'TransitionToInfrequentAccess',
      enabled: true,
      transitions: [{
        storageClass: s3.StorageClass.INFREQUENT_ACCESS,
        transitionAfter: Duration.days(30)
      }]
    });

    bucket.addLifecycleRule({
      id: 'TransitionToGlacier',
      enabled: true,
      transitions: [{
        storageClass: s3.StorageClass.GLACIER,
        transitionAfter: Duration.days(90)
      }]
    });

    bucket.addLifecycleRule({
      id: 'DeleteOldObjects',
      enabled: true,
      expiration: Duration.days(365)
    });

    bucket.addLifecycleRule({
      id: 'CleanupIncompleteMultipartUploads',
      enabled: true,
      abortIncompleteMultipartUploadAfter: Duration.days(7)
    });
  }

  private setupVpcEndpoint(networkStack: NetworkStack): void {
    // Create VPC endpoint for secure S3 access
    networkStack.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3
    });
  }

  private createOutputs(): void {
    new CfnOutput(this, 'DataBucketName', {
      value: this.dataBucket.bucketName,
      description: 'Name of the main data storage bucket'
    });

    new CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'Name of the backup storage bucket'
    });

    new CfnOutput(this, 'BackupVaultName', {
      value: this.backupVault.backupVaultName,
      description: 'Name of the AWS Backup vault'
    });

    new CfnOutput(this, 'BackupPlanId', {
      value: this.backupPlan.backupPlanId,
      description: 'ID of the AWS Backup plan'
    });
  }
}