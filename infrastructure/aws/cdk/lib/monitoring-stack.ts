// AWS CDK v2.0.0
import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';

/**
 * HUMAN TASKS:
 * 1. Create Grafana admin credentials in AWS Secrets Manager before deployment
 * 2. Configure alert notification endpoints (email, Slack, etc.)
 * 3. Review and adjust retention periods for logs and metrics
 * 4. Set up custom dashboards after deployment
 * 5. Configure external SAML/SSO for Grafana if required
 */

export class MonitoringStack extends Stack {
  public readonly prometheusService: ecs.FargateService;
  public readonly grafanaService: ecs.FargateService;
  public readonly elasticsearchService: ecs.FargateService;
  public readonly logGroups: logs.LogGroup[];
  public readonly dashboards: cloudwatch.Dashboard[];

  constructor(scope: Construct, id: string, props: StackProps & { networkStack: NetworkStack }) {
    super(scope, id, props);

    // Create ECS cluster for monitoring services
    const monitoringCluster = new ecs.Cluster(this, 'MonitoringCluster', {
      vpc: props.networkStack.vpc,
      containerInsights: true,
    });

    // Requirement 7.5: Implementation of monitoring tools including Prometheus
    this.prometheusService = this.setupPrometheus(monitoringCluster, props.networkStack);

    // Requirement 7.5: Implementation of monitoring tools including Grafana
    this.grafanaService = this.setupGrafana(monitoringCluster, props.networkStack);

    // Requirement 7.5: Implementation of ELK Stack for log aggregation
    this.elasticsearchService = this.setupElasticsearch(monitoringCluster, props.networkStack);

    // Requirement 9.3.2: Implementation of security monitoring
    this.logGroups = this.setupLogging();
    this.dashboards = this.setupDashboards();

    // Create outputs for service endpoints
    new CfnOutput(this, 'PrometheusEndpoint', {
      value: this.prometheusService.loadBalancer.loadBalancerDnsName,
      description: 'Prometheus service endpoint',
    });

    new CfnOutput(this, 'GrafanaEndpoint', {
      value: this.grafanaService.loadBalancer.loadBalancerDnsName,
      description: 'Grafana service endpoint',
    });
  }

  private setupPrometheus(cluster: ecs.Cluster, networkStack: NetworkStack): ecs.FargateService {
    // Create task definition for Prometheus
    const prometheusTaskDef = new ecs.FargateTaskDefinition(this, 'PrometheusTaskDef', {
      memoryLimitMiB: 2048,
      cpu: 1024,
    });

    // Add Prometheus container
    prometheusTaskDef.addContainer('PrometheusContainer', {
      image: ecs.ContainerImage.fromRegistry('prom/prometheus:v2.40.0'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'prometheus',
        logRetention: logs.RetentionDays.THIRTY_DAYS,
      }),
      portMappings: [{ containerPort: 9090 }],
      environment: {
        'PROMETHEUS_CONFIG_FILE': '/etc/prometheus/prometheus.yml',
      },
    });

    // Create Fargate service
    return new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'PrometheusService', {
      cluster,
      taskDefinition: prometheusTaskDef,
      desiredCount: 2,
      listenerPort: 9090,
      publicLoadBalancer: false,
      targetProtocol: elbv2.ApplicationProtocol.HTTP,
      securityGroups: networkStack.securityGroups,
    });
  }

  private setupGrafana(cluster: ecs.Cluster, networkStack: NetworkStack): ecs.FargateService {
    // Create Grafana admin credentials secret
    const grafanaAdminSecret = new secretsmanager.Secret(this, 'GrafanaAdminSecret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
      },
    });

    // Create task definition for Grafana
    const grafanaTaskDef = new ecs.FargateTaskDefinition(this, 'GrafanaTaskDef', {
      memoryLimitMiB: 2048,
      cpu: 1024,
    });

    // Add Grafana container
    grafanaTaskDef.addContainer('GrafanaContainer', {
      image: ecs.ContainerImage.fromRegistry('grafana/grafana:9.3.0'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'grafana',
        logRetention: logs.RetentionDays.THIRTY_DAYS,
      }),
      portMappings: [{ containerPort: 3000 }],
      environment: {
        'GF_AUTH_ANONYMOUS_ENABLED': 'false',
        'GF_SECURITY_ADMIN_USER': '${GrafanaAdminSecret.username}',
        'GF_SECURITY_ADMIN_PASSWORD': '${GrafanaAdminSecret.password}',
        'GF_INSTALL_PLUGINS': 'grafana-piechart-panel,grafana-worldmap-panel',
      },
      secrets: {
        'GrafanaAdminSecret': ecs.Secret.fromSecretsManager(grafanaAdminSecret),
      },
    });

    // Create Fargate service
    return new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'GrafanaService', {
      cluster,
      taskDefinition: grafanaTaskDef,
      desiredCount: 2,
      listenerPort: 3000,
      publicLoadBalancer: false,
      targetProtocol: elbv2.ApplicationProtocol.HTTP,
      securityGroups: networkStack.securityGroups,
    });
  }

  private setupElasticsearch(cluster: ecs.Cluster, networkStack: NetworkStack): ecs.FargateService {
    // Create task definition for Elasticsearch
    const esTaskDef = new ecs.FargateTaskDefinition(this, 'ElasticsearchTaskDef', {
      memoryLimitMiB: 4096,
      cpu: 2048,
    });

    // Add Elasticsearch container
    esTaskDef.addContainer('ElasticsearchContainer', {
      image: ecs.ContainerImage.fromRegistry('docker.elastic.co/elasticsearch/elasticsearch:8.0.0'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'elasticsearch',
        logRetention: logs.RetentionDays.THIRTY_DAYS,
      }),
      portMappings: [{ containerPort: 9200 }],
      environment: {
        'discovery.type': 'single-node',
        'ES_JAVA_OPTS': '-Xms2g -Xmx2g',
        'xpack.security.enabled': 'true',
      },
    });

    // Create Fargate service
    return new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'ElasticsearchService', {
      cluster,
      taskDefinition: esTaskDef,
      desiredCount: 1,
      listenerPort: 9200,
      publicLoadBalancer: false,
      targetProtocol: elbv2.ApplicationProtocol.HTTP,
      securityGroups: networkStack.securityGroups,
    });
  }

  private setupLogging(): logs.LogGroup[] {
    const logGroups: logs.LogGroup[] = [];

    // Create application log group
    logGroups.push(new logs.LogGroup(this, 'ApplicationLogs', {
      retention: logs.RetentionDays.THIRTY_DAYS,
      removalPolicy: RemovalPolicy.DESTROY,
    }));

    // Create security log group
    logGroups.push(new logs.LogGroup(this, 'SecurityLogs', {
      retention: logs.RetentionDays.NINETY_DAYS,
      removalPolicy: RemovalPolicy.RETAIN,
    }));

    // Create audit log group
    logGroups.push(new logs.LogGroup(this, 'AuditLogs', {
      retention: logs.RetentionDays.ONE_YEAR,
      removalPolicy: RemovalPolicy.RETAIN,
    }));

    return logGroups;
  }

  private setupDashboards(): cloudwatch.Dashboard[] {
    const dashboards: cloudwatch.Dashboard[] = [];

    // Create application performance dashboard
    const perfDashboard = new cloudwatch.Dashboard(this, 'AppPerformanceDashboard', {
      dashboardName: 'AppPerformance',
    });

    perfDashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Latency',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            statistic: 'Average',
            period: Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Error Rates',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            statistic: 'Sum',
            period: Duration.minutes(1),
          }),
        ],
      }),
    );

    dashboards.push(perfDashboard);

    // Create infrastructure dashboard
    const infraDashboard = new cloudwatch.Dashboard(this, 'InfrastructureDashboard', {
      dashboardName: 'Infrastructure',
    });

    infraDashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ECS CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'CPUUtilization',
            statistic: 'Average',
            period: Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'ECS Memory Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'MemoryUtilization',
            statistic: 'Average',
            period: Duration.minutes(1),
          }),
        ],
      }),
    );

    dashboards.push(infraDashboard);

    return dashboards;
  }
}