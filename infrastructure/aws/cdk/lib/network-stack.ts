// AWS CDK v2.0.0
import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * HUMAN TASKS:
 * 1. Ensure AWS account has sufficient permissions for VPC creation
 * 2. Verify IP CIDR ranges don't conflict with existing networks
 * 3. Configure custom domain in Route53 if using custom DNS
 * 4. Review and approve NAT Gateway costs
 * 5. Set up VPN or Direct Connect if required for hybrid connectivity
 */

export class NetworkStack extends Stack {
  public readonly vpc: ec2.IVpc;
  public readonly securityGroups: ec2.ISecurityGroup[];
  public readonly bastionHost: ec2.BastionHostLinux;
  public readonly natGateways: ec2.NatGateway[];
  public readonly vpcEndpoints: ec2.InterfaceVpcEndpoint[];

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Requirement 5.2.2: Network Architecture - Multi-AZ VPC setup
    this.vpc = this.createVpc();
    
    // Requirement 5.4: Security Architecture - Network security controls
    this.securityGroups = this.createSecurityGroups();
    
    // Set up VPC endpoints for AWS service access
    this.vpcEndpoints = this.setupVpcEndpoints();
    
    // Configure VPC flow logs for network monitoring
    this.setupFlowLogs();
    
    // Create bastion host for secure administrative access
    this.bastionHost = new ec2.BastionHostLinux(this, 'BastionHost', {
      vpc: this.vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
      instanceName: 'mint-replica-bastion',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO)
    });
  }

  private createVpc(): ec2.IVpc {
    // Requirement 5.2.2: Implementation of secure network architecture
    return new ec2.Vpc(this, 'MintReplicaVPC', {
      maxAzs: 3,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        }
      ],
      natGateways: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });
  }

  private createSecurityGroups(): ec2.ISecurityGroup[] {
    // Requirement 5.4: Implementation of network security controls
    const apiSecurityGroup = new ec2.SecurityGroup(this, 'APISecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for API servers',
      allowAllOutbound: false
    });

    apiSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS inbound'
    );

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for database instances',
      allowAllOutbound: false
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(apiSecurityGroup.securityGroupId),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from API'
    );

    const cacheSecurityGroup = new ec2.SecurityGroup(this, 'CacheSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Redis cache',
      allowAllOutbound: false
    });

    cacheSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(apiSecurityGroup.securityGroupId),
      ec2.Port.tcp(6379),
      'Allow Redis from API'
    );

    const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for bastion host',
      allowAllOutbound: true
    });

    bastionSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH inbound'
    );

    return [apiSecurityGroup, dbSecurityGroup, cacheSecurityGroup, bastionSecurityGroup];
  }

  private setupVpcEndpoints(): ec2.InterfaceVpcEndpoint[] {
    const endpoints: ec2.InterfaceVpcEndpoint[] = [];
    
    // S3 Gateway Endpoint
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3
    });

    // DynamoDB Gateway Endpoint
    this.vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB
    });

    // Interface Endpoints
    const services = [
      ec2.InterfaceVpcEndpointAwsService.ECR,
      ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS
    ];

    services.forEach(service => {
      endpoints.push(this.vpc.addInterfaceEndpoint(`${service.name}Endpoint`, {
        service,
        privateDnsEnabled: true,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
      }));
    });

    return endpoints;
  }

  private setupFlowLogs(): logs.LogGroup {
    const logGroup = new logs.LogGroup(this, 'VPCFlowLogs', {
      retention: logs.RetentionDays.THIRTY_DAYS,
      removalPolicy: this.node.tryGetContext('environment') === 'prod' 
        ? RemovalPolicy.RETAIN 
        : RemovalPolicy.DESTROY
    });

    const flowLogRole = new iam.Role(this, 'FlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com')
    });

    flowLogRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams'
      ],
      resources: [logGroup.logGroupArn]
    }));

    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(logGroup, flowLogRole),
      trafficType: ec2.FlowLogTrafficType.ALL,
      maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.ONE_MINUTE,
    });

    return logGroup;
  }
}