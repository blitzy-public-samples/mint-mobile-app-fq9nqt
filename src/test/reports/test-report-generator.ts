// Required third-party libraries with versions
import * as fs from 'fs-extra'; // v11.1.0
import * as handlebars from 'handlebars'; // v4.7.7
import { Chart } from 'chart.js/auto'; // v4.3.0
import { TestResult } from '@jest/reporters'; // v29.0.0
import * as winston from 'winston'; // v3.8.0
import { renderReport, ReportData } from './templates/test-report.html';

// Human Tasks:
// 1. Ensure Chart.js is properly loaded in the test report template
// 2. Configure Winston logger with appropriate transport settings
// 3. Set up proper file permissions for report output directory
// 4. Verify test report template accessibility compliance

// Global configuration
const REPORT_CONFIG = {
  outputDir: 'test-reports',
  templatePath: 'templates/test-report.html',
  dateFormat: 'YYYY-MM-DD HH:mm:ss'
};

const CHART_COLORS = {
  PASS: '#4CAF50',
  FAIL: '#F44336',
  SKIP: '#FFC107',
  COVERAGE: '#2196F3'
};

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json()
});

// Interfaces for test data structures
interface TestSuite {
  name: string;
  tests: TestCase[];
  duration: number;
  status: 'passed' | 'failed' | 'skipped';
}

interface TestCase {
  name: string;
  duration: number;
  status: 'passed' | 'failed' | 'skipped';
  error?: TestError;
}

interface TestError {
  message: string;
  stack: string;
  type: string;
  location: string;
}

interface CoverageData {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
  files: CoverageFile[];
}

interface CoverageFile {
  path: string;
  lines: number;
  functions: number;
  branches: number;
}

interface PerformanceMetrics {
  responseTime: number[];
  throughput: number[];
  concurrency: number;
  duration: number;
}

interface SecurityResults {
  vulnerabilities: number;
  compliance: {
    passed: number;
    failed: number;
    skipped: number;
  };
  securityTests: {
    total: number;
    passed: number;
    critical: number;
  };
}

// Report generator class with decorators
@reportGenerator
export class ReportGenerator {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = logger;
  }

  /**
   * Generates a comprehensive HTML test report
   * Requirement: Test Reporting (Technical Specification/9.3.2 Security Monitoring)
   */
  public async generateReport(
    testResults: {
      suites: TestSuite[];
      coverage: CoverageData;
      performance: PerformanceMetrics;
      security: SecurityResults;
    },
    options: {
      outputPath: string;
      includeCharts: boolean;
      template: string;
    }
  ): Promise<string> {
    try {
      this.logger.info('Starting test report generation', { timestamp: new Date().toISOString() });

      // Process test results and calculate metrics
      const processedResults = this.processTestResults({
        testResults: testResults.suites,
        coverageResults: testResults.coverage,
        performanceData: testResults.performance
      });

      // Generate charts if enabled
      const chartConfigurations = options.includeCharts ? this.generateCharts({
        testResults: processedResults,
        coverage: testResults.coverage,
        performance: testResults.performance,
        security: testResults.security
      }) : undefined;

      // Prepare report data
      const reportData: ReportData = {
        summary: {
          totalTests: processedResults.totalTests,
          passedTests: processedResults.passedTests,
          failedTests: processedResults.failedTests,
          skippedTests: processedResults.skippedTests,
          executionTime: processedResults.totalDuration
        },
        coverage: {
          lines: testResults.coverage.lines,
          functions: testResults.coverage.functions,
          branches: testResults.coverage.branches,
          statements: testResults.coverage.statements
        },
        performance: {
          avgResponseTime: Math.round(
            testResults.performance.responseTime.reduce((a, b) => a + b) / 
            testResults.performance.responseTime.length
          ),
          maxThroughput: Math.max(...testResults.performance.throughput),
          concurrency: testResults.performance.concurrency
        },
        security: {
          vulnerabilities: testResults.security.vulnerabilities,
          complianceRate: (
            testResults.security.compliance.passed /
            (testResults.security.compliance.passed + testResults.security.compliance.failed)
          ) * 100,
          securityTestsPassed: testResults.security.securityTests.passed,
          criticalIssues: testResults.security.securityTests.critical
        },
        charts: chartConfigurations,
        errors: this.formatTestErrors(processedResults.errors)
      };

      // Render report using template
      const reportHtml = await renderReport(reportData);

      // Ensure output directory exists
      await fs.ensureDir(options.outputPath);

      // Write report to file
      const reportPath = `${options.outputPath}/test-report-${Date.now()}.html`;
      await fs.writeFile(reportPath, reportHtml, 'utf8');

      this.logger.info('Test report generated successfully', {
        path: reportPath,
        metrics: {
          totalTests: reportData.summary.totalTests,
          passRate: (reportData.summary.passedTests / reportData.summary.totalTests) * 100,
          coverage: reportData.coverage
        }
      });

      return reportPath;
    } catch (error) {
      this.logger.error('Error generating test report', { error });
      throw error;
    }
  }

  /**
   * Processes raw test results into report-friendly format
   * Requirement: Test Documentation (Technical Specification/A.4 Development Standards Reference)
   */
  private processTestResults(rawResults: {
    testResults: TestResult[];
    coverageResults: CoverageData;
    performanceData: PerformanceMetrics;
  }): any {
    const processed = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalDuration: 0,
      errors: [] as TestError[],
      suites: [] as any[]
    };

    for (const suite of rawResults.testResults) {
      const suiteResult = {
        name: suite.name,
        duration: 0,
        tests: [] as any[]
      };

      for (const test of suite.tests) {
        processed.totalTests++;
        suiteResult.duration += test.duration;

        switch (test.status) {
          case 'passed':
            processed.passedTests++;
            break;
          case 'failed':
            processed.failedTests++;
            if (test.error) {
              processed.errors.push(test.error);
            }
            break;
          case 'skipped':
            processed.skippedTests++;
            break;
        }

        suiteResult.tests.push({
          name: test.name,
          status: test.status,
          duration: test.duration
        });
      }

      processed.totalDuration += suiteResult.duration;
      processed.suites.push(suiteResult);
    }

    return processed;
  }

  /**
   * Generates interactive charts for test metrics
   * Requirement: Test Reporting (Technical Specification/9.3.2 Security Monitoring)
   */
  private generateCharts(metrics: {
    testResults: any;
    coverage: CoverageData;
    performance: PerformanceMetrics;
    security: SecurityResults;
  }): any {
    return {
      summary: {
        type: 'pie',
        data: {
          labels: ['Passed', 'Failed', 'Skipped'],
          datasets: [{
            data: [
              metrics.testResults.passedTests,
              metrics.testResults.failedTests,
              metrics.testResults.skippedTests
            ],
            backgroundColor: [
              CHART_COLORS.PASS,
              CHART_COLORS.FAIL,
              CHART_COLORS.SKIP
            ]
          }]
        }
      },
      coverage: {
        type: 'bar',
        data: {
          labels: ['Lines', 'Functions', 'Branches', 'Statements'],
          datasets: [{
            label: 'Coverage %',
            data: [
              metrics.coverage.lines,
              metrics.coverage.functions,
              metrics.coverage.branches,
              metrics.coverage.statements
            ],
            backgroundColor: CHART_COLORS.COVERAGE
          }]
        }
      },
      performance: {
        type: 'line',
        data: {
          labels: metrics.performance.responseTime.map((_, i) => `Request ${i + 1}`),
          datasets: [{
            label: 'Response Time (ms)',
            data: metrics.performance.responseTime,
            borderColor: CHART_COLORS.COVERAGE,
            tension: 0.1
          }]
        }
      },
      security: {
        type: 'doughnut',
        data: {
          labels: ['Passed', 'Failed', 'Critical'],
          datasets: [{
            data: [
              metrics.security.securityTests.passed,
              metrics.security.securityTests.total - metrics.security.securityTests.passed,
              metrics.security.securityTests.critical
            ],
            backgroundColor: [
              CHART_COLORS.PASS,
              CHART_COLORS.FAIL,
              CHART_COLORS.SKIP
            ]
          }]
        }
      }
    };
  }

  /**
   * Formats test errors for detailed reporting
   * Requirement: Security Monitoring (Technical Specification/9.3.2 Security Monitoring)
   */
  private formatTestErrors(errors: TestError[]): any[] {
    return errors.map(error => ({
      type: error.type,
      message: error.message,
      stackTrace: error.stack,
      location: error.location,
      formattedMessage: `${error.type}: ${error.message}`,
      context: {
        file: error.location.split(':')[0],
        line: error.location.split(':')[1],
        column: error.location.split(':')[2]
      }
    }));
  }
}

// Export main report generation function
export async function generateTestReport(
  testResults: {
    suites: TestSuite[];
    coverage: CoverageData;
    performance: PerformanceMetrics;
    security: SecurityResults;
  },
  options: {
    outputPath: string;
    includeCharts: boolean;
    template: string;
  }
): Promise<string> {
  const generator = new ReportGenerator();
  return generator.generateReport(testResults, options);
}

// Export report configuration interface
export interface ReportConfig {
  outputPath: string;
  includeCharts: boolean;
  template: string;
  dateFormat: string;
  colors: typeof CHART_COLORS;
}