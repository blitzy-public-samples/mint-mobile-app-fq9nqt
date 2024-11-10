// AWS CDK v2.0.0
import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';

/**
 * HUMAN TASKS:
 * 1. Review and approve database instance types and costs
 * 2. Configure custom parameter groups if needed
 * 3. Set up database monitoring alerts
 * 4. Configure backup windows during off-peak hours
 * 5. Review and approve maintenance windows
 * 6. Set up database user permissions
 * 7. Configure VPC peering if needed for external access
 */

export class DatabaseStack extends Stack {
  public readonly postgresCluster: rds.DatabaseCluster;
  public readonly redisCluster: elasticache.CfnCacheCluster;
  public readonly timescaleInstance: ec2.Instance;
  public readonly dbSecrets: secretsmanager.Secret[];

  constructor(scope: Construct, id: string, props: StackProps & { 
    networkStack: NetworkStack; 
    securityStack: SecurityStack 
  }) {
    super(scope, id, props);

    // Requirement 5.2.4: Data Architecture - Create PostgreSQL Aurora cluster
    this.postgresCluster = this.createPostgresCluster(props);

    // Requirement 7.3.1: Database Configuration - Create Redis cache cluster
    this.redisCluster = this.createRedisCluster(props);

    // Requirement 7.3.1: Database Configuration - Create TimescaleDB instance
    this.timescaleInstance = this.createTimescaleInstance(props);

    // Requirement 9.2: Data Security - Set up database secrets
    this.dbSecrets = this.setupDatabaseSecrets(props);

    // Set up CloudWatch monitoring
    this.setupMonitoring();
  }

  private createPostgresCluster(props: StackProps & { 
    networkStack: NetworkStack; 
    securityStack: SecurityStack 
  }): rds.DatabaseCluster {
    // Create Aurora PostgreSQL parameter group
    const parameterGroup = new rds.ParameterGroup(this, 'PostgresParams', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_6
      }),
      parameters: {
        'shared_buffers': '2GB',
        'max_connections': '1000',
        'work_mem': '64MB',
        'maintenance_work_mem': '256MB',
        'effective_cache_size': '6GB'
      }
    });

    // Create Aurora cluster
    const cluster = new rds.DatabaseCluster(this, 'PostgresCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_6
      }),
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.XLARGE),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        vpc: props.networkStack.vpc,
        securityGroups: [props.networkStack.securityGroups[1]], // DB security group
        parameterGroup
      },
      instances: 3, // 1 writer + 2 readers
      backup: {
        retention: Duration.days(7),
        preferredWindow: '03:00-04:00' // UTC
      },
      storageEncrypted: true,
      storageEncryptionKey: props.securityStack.kmsKeys[0], // Database encryption key
      deletionProtection: true,
      removalPolicy: RemovalPolicy.RETAIN,
      cloudwatchLogsExports: ['postgresql', 'upgrade'],
      cloudwatchLogsRetention: 30,
      preferredMaintenanceWindow: 'Sun:05:00-Sun:06:00', // UTC
      monitoringInterval: Duration.seconds(60)
    });

    return cluster;
  }

  private createRedisCluster(props: StackProps & {
    networkStack: NetworkStack;
    securityStack: SecurityStack
  }): elasticache.CfnCacheCluster {
    // Create Redis parameter group
    const parameterGroup = new elasticache.CfnParameterGroup(this, 'RedisParams', {
      family: 'redis6.x',
      description: 'Custom parameter group for Redis 6.x',
      parameters: {
        'maxmemory-policy': 'volatile-lru',
        'timeout': '300',
        'notify-keyspace-events': 'Ex'
      }
    });

    // Create subnet group
    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cluster',
      subnetIds: props.networkStack.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      }).subnetIds
    });

    // Create Redis cluster
    const cluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      engine: 'redis',
      cacheNodeType: 'cache.r6g.large',
      numCacheNodes: 3,
      vpcSecurityGroupIds: [props.networkStack.securityGroups[2].securityGroupId], // Cache security group
      cacheParameterGroupName: parameterGroup.ref,
      cacheSubnetGroupName: subnetGroup.ref,
      engineVersion: '6.2',
      port: 6379,
      preferredMaintenanceWindow: 'sun:06:00-sun:07:00', // UTC
      snapshotRetentionLimit: 7,
      snapshotWindow: '04:00-05:00', // UTC
      autoMinorVersionUpgrade: true
    });

    return cluster;
  }

  private createTimescaleInstance(props: StackProps & {
    networkStack: NetworkStack;
    securityStack: SecurityStack
  }): ec2.Instance {
    // Create TimescaleDB instance
    const instance = new ec2.Instance(this, 'TimescaleDBInstance', {
      vpc: props.networkStack.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.XLARGE),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        cpuType: ec2.AmazonLinuxCpuType.ARM_64
      }),
      securityGroup: props.networkStack.securityGroups[1], // DB security group
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(100, {
          volumeType: ec2.EbsDeviceVolumeType.GP3,
          encrypted: true,
          kmsKey: props.securityStack.kmsKeys[0] // Database encryption key
        })
      }],
      userData: ec2.UserData.forLinux(),
      requireImdsv2: true
    });

    // Add TimescaleDB installation script
    instance.userData.addCommands(
      'yum update -y',
      'amazon-linux-extras enable postgresql14',
      'yum install -y postgresql14-server postgresql14-contrib',
      'curl -s https://packagecloud.io/install/repositories/timescale/timescaledb/script.rpm.sh | bash',
      'yum install -y timescaledb-2-postgresql-14',
      'timescaledb-tune --quiet --yes',
      'systemctl enable postgresql',
      'systemctl start postgresql'
    );

    return instance;
  }

  private setupDatabaseSecrets(props: StackProps & {
    networkStack: NetworkStack;
    securityStack: SecurityStack
  }): secretsmanager.Secret[] {
    const secrets: secretsmanager.Secret[] = [];

    // PostgreSQL master credentials
    const postgresSecret = new secretsmanager.Secret(this, 'PostgresCredentials', {
      secretName: 'mint-replica/postgres/master',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'postgres_admin'
        }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32
      },
      encryptionKey: props.securityStack.kmsKeys[1] // Secrets encryption key
    });
    secrets.push(postgresSecret);

    // Redis auth token
    const redisSecret = new secretsmanager.Secret(this, 'RedisCredentials', {
      secretName: 'mint-replica/redis/auth',
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 32
      },
      encryptionKey: props.securityStack.kmsKeys[1] // Secrets encryption key
    });
    secrets.push(redisSecret);

    // TimescaleDB credentials
    const timescaleSecret = new secretsmanager.Secret(this, 'TimescaleCredentials', {
      secretName: 'mint-replica/timescale/master',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'timescale_admin'
        }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32
      },
      encryptionKey: props.securityStack.kmsKeys[1] // Secrets encryption key
    });
    secrets.push(timescaleSecret);

    return secrets;
  }

  private setupMonitoring(): void {
    // Create CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'DatabaseDashboard', {
      dashboardName: 'MintReplica-Databases'
    });

    // Add PostgreSQL metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'PostgreSQL - CPU Utilization',
        left: [
          this.postgresCluster.metricCPUUtilization()
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'PostgreSQL - Connections',
        left: [
          this.postgresCluster.metricDatabaseConnections()
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'PostgreSQL - Free Storage Space',
        left: [
          this.postgresCluster.metricFreeStorageSpace()
        ]
      })
    );

    // Add Redis metrics
    const redisNamespace = 'AWS/ElastiCache';
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Redis - CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: redisNamespace,
            metricName: 'CPUUtilization',
            dimensionsMap: {
              CacheClusterId: this.redisCluster.ref
            },
            statistic: 'Average'
          })
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'Redis - Memory Usage',
        left: [
          new cloudwatch.Metric({
            namespace: redisNamespace,
            metricName: 'DatabaseMemoryUsagePercentage',
            dimensionsMap: {
              CacheClusterId: this.redisCluster.ref
            },
            statistic: 'Average'
          })
        ]
      })
    );

    // Add TimescaleDB metrics
    const timescaleNamespace = 'CWAgent';
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'TimescaleDB - CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: timescaleNamespace,
            metricName: 'cpu_usage_idle',
            dimensionsMap: {
              InstanceId: this.timescaleInstance.instanceId
            },
            statistic: 'Average'
          })
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'TimescaleDB - Disk Usage',
        left: [
          new cloudwatch.Metric({
            namespace: timescaleNamespace,
            metricName: 'disk_used_percent',
            dimensionsMap: {
              InstanceId: this.timescaleInstance.instanceId,
              fstype: 'xfs',
              path: '/'
            },
            statistic: 'Average'
          })
        ]
      })
    );

    // Export database endpoints
    new CfnOutput(this, 'PostgresEndpoint', {
      value: this.postgresCluster.clusterEndpoint.socketAddress,
      description: 'PostgreSQL cluster endpoint'
    });

    new CfnOutput(this, 'RedisEndpoint', {
      value: this.redisCluster.attrRedisEndpointAddress,
      description: 'Redis cluster endpoint'
    });

    new CfnOutput(this, 'TimescaleEndpoint', {
      value: this.timescaleInstance.instancePrivateDnsName,
      description: 'TimescaleDB instance endpoint'
    });
  }
}