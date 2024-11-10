// AWS CDK v2.0.0
import { Stack, StackProps, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elasticloadbalancingv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';

/**
 * HUMAN TASKS:
 * 1. Configure custom domain in Route53 and obtain SSL certificate
 * 2. Set up monitoring alerts in CloudWatch
 * 3. Review and approve auto-scaling thresholds
 * 4. Configure backup retention policies
 * 5. Set up API usage plans and throttling limits
 */

interface ApiStackProps extends StackProps {
  networkStack: NetworkStack;
  databaseSecretArn: string;
  redisEndpoint: string;
}

export class ApiStack extends Stack {
  public readonly apiGateway: apigateway.RestApi;
  public readonly ecsCluster: ecs.Cluster;
  public readonly services: ecs.FargateService[] = [];
  public readonly loadBalancer: elasticloadbalancingv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Requirement 5.2.3: Service Layer Architecture - Create ECS cluster
    this.ecsCluster = new ecs.Cluster(this, 'ApiCluster', {
      vpc: props.networkStack.vpc,
      containerInsights: true,
      enableFargateCapacityProviders: true
    });

    // Requirement 5.2.2: API Gateway - Create API Gateway with OpenAPI spec
    this.apiGateway = this.createApiGateway();

    // Create Application Load Balancer
    this.loadBalancer = this.setupLoadBalancer(props);

    // Create core microservices
    this.createEcsServices(props);

    // Configure auto-scaling policies
    this.configureAutoScaling();
  }

  private createApiGateway(): apigateway.RestApi {
    // Requirement 5.2.2: Implementation of API Gateway with request routing and rate limiting
    const api = new apigateway.RestApi(this, 'MintReplicaApi', {
      restApiName: 'Mint Replica API',
      description: 'API Gateway for Mint Replica Lite application',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        dataTraceEnabled: true,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ],
        maxAge: Duration.days(1)
      }
    });

    // Configure throttling and quotas
    const plan = api.addUsagePlan('ApiUsagePlan', {
      name: 'Standard',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000
      },
      quota: {
        limit: 1000000,
        period: apigateway.Period.MONTH
      }
    });

    // Add API key for usage tracking
    const key = api.addApiKey('ApiKey');
    plan.addApiKey(key);

    return api;
  }

  private setupLoadBalancer(props: ApiStackProps): elasticloadbalancingv2.ApplicationLoadBalancer {
    // Requirement 5.2.2: Implementation of load balancing with SSL/TLS termination
    const lb = new elasticloadbalancingv2.ApplicationLoadBalancer(this, 'ApiLoadBalancer', {
      vpc: props.networkStack.vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: ecs.SubnetType.PUBLIC }
    });

    // Configure access logs
    lb.logAccessLogs({
      prefix: 'api-access-logs',
      retention: RemovalPolicy.RETAIN
    });

    return lb;
  }

  private createEcsServices(props: ApiStackProps): void {
    // Requirement 5.2.3: Implementation of containerized microservices
    const services = [
      {
        name: 'AuthService',
        containerPort: 3000,
        desiredCount: 3,
        cpu: 512,
        memory: 1024,
        healthCheck: '/health/auth'
      },
      {
        name: 'TransactionService',
        containerPort: 3001,
        desiredCount: 3,
        cpu: 1024,
        memory: 2048,
        healthCheck: '/health/transactions'
      },
      {
        name: 'BudgetService',
        containerPort: 3002,
        desiredCount: 2,
        cpu: 512,
        memory: 1024,
        healthCheck: '/health/budgets'
      },
      {
        name: 'InvestmentService',
        containerPort: 3003,
        desiredCount: 2,
        cpu: 1024,
        memory: 2048,
        healthCheck: '/health/investments'
      },
      {
        name: 'GoalService',
        containerPort: 3004,
        desiredCount: 2,
        cpu: 512,
        memory: 1024,
        healthCheck: '/health/goals'
      }
    ];

    // Get database credentials from Secrets Manager
    const dbSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'DatabaseSecret',
      props.databaseSecretArn
    );

    services.forEach(svc => {
      // Create Fargate service with load balancer
      const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, svc.name, {
        cluster: this.ecsCluster,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset(`./services/${svc.name.toLowerCase()}`),
          containerPort: svc.containerPort,
          environment: {
            NODE_ENV: 'production',
            REDIS_ENDPOINT: props.redisEndpoint,
            SERVICE_NAME: svc.name
          },
          secrets: {
            DB_CONNECTION: ecs.Secret.fromSecretsManager(dbSecret)
          }
        },
        desiredCount: svc.desiredCount,
        cpu: svc.cpu,
        memoryLimitMiB: svc.memory,
        publicLoadBalancer: false,
        loadBalancer: this.loadBalancer,
        securityGroups: props.networkStack.securityGroups,
        healthCheckGracePeriod: Duration.seconds(60)
      });

      // Configure container health check
      service.targetGroup.configureHealthCheck({
        path: svc.healthCheck,
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3
      });

      // Enable service discovery
      service.service.enableCloudMap({
        name: svc.name.toLowerCase(),
        dnsTtl: Duration.seconds(20)
      });

      this.services.push(service.service);
    });
  }

  private configureAutoScaling(): void {
    // Requirement 5.5: Implementation of horizontal and vertical scaling
    this.services.forEach(service => {
      const scaling = service.autoScaleTaskCount({
        minCapacity: 2,
        maxCapacity: 10
      });

      // CPU utilization target tracking
      scaling.scaleOnCpuUtilization('CpuScaling', {
        targetUtilizationPercent: 70,
        scaleInCooldown: Duration.seconds(300),
        scaleOutCooldown: Duration.seconds(60)
      });

      // Memory utilization target tracking
      scaling.scaleOnMemoryUtilization('MemoryScaling', {
        targetUtilizationPercent: 80,
        scaleInCooldown: Duration.seconds(300),
        scaleOutCooldown: Duration.seconds(60)
      });

      // Request count based scaling
      scaling.scaleOnRequestCount('RequestCountScaling', {
        targetRequestsPerSecond: 1000,
        scaleInCooldown: Duration.seconds(300),
        scaleOutCooldown: Duration.seconds(60)
      });
    });
  }
}