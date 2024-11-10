// Third-party imports with versions
import winston from 'winston'; // ^3.8.0
import chalk from 'chalk'; // ^4.1.2

// Global configuration
const LOG_LEVEL = process.env.TEST_LOG_LEVEL || 'info';
const LOG_FILE_PATH = process.env.TEST_LOG_FILE || 'test-execution.log';

/**
 * Human Tasks Required:
 * 1. Ensure write permissions for log file directory
 * 2. Configure LOG_LEVEL in environment if different from default 'info'
 * 3. Configure LOG_FILE_PATH in environment if different from default 'test-execution.log'
 * 4. Ensure winston is added to package.json dependencies
 * 5. Ensure chalk is added to package.json dependencies
 */

/**
 * @class TestLogger
 * @description Main logger class for test execution, providing structured logging capabilities
 * with support for different log levels, file and console output
 * Requirements addressed:
 * - Test Monitoring (Technical Specification/9.3.2 Security Monitoring)
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 */
export class TestLogger {
    private logger: winston.Logger;
    private logLevel: string;
    private logFilePath: string;
    private testStartTimes: Map<string, number>;

    constructor(config: any = {}) {
        this.logLevel = config.logLevel || LOG_LEVEL;
        this.logFilePath = config.logFilePath || LOG_FILE_PATH;
        this.testStartTimes = new Map();

        // Configure winston logger with timestamp and metadata
        this.logger = winston.createLogger({
            level: this.logLevel,
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss.SSS'
                }),
                winston.format.json()
            ),
            transports: [
                // File transport with rotation
                new winston.transports.File({
                    filename: this.logFilePath,
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                    tailable: true
                }),
                // Console transport with color formatting
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
                            return `${timestamp} ${level}: ${message} ${
                                Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ''
                            }`;
                        })
                    )
                })
            ]
        });
    }

    /**
     * Logs the start of a test case with metadata and context
     * @param testName Name of the test case
     * @param testContext Test context object containing metadata
     */
    public logTestStart(testName: string, testContext: object): void {
        this.testStartTimes.set(testName, Date.now());
        
        this.logger.info(`Test Started: ${testName}`, {
            event: 'TEST_START',
            testName,
            context: testContext,
            timestamp: new Date().toISOString()
        });

        console.log(chalk.cyan(`\n▶ Starting Test: ${testName}`));
    }

    /**
     * Logs the completion of a test case with results and duration
     * @param testName Name of the test case
     * @param result Test result object
     */
    public logTestEnd(testName: string, result: object): void {
        const startTime = this.testStartTimes.get(testName);
        const duration = startTime ? Date.now() - startTime : 0;
        this.testStartTimes.delete(testName);

        const status = (result as any).status || 'completed';
        const color = status === 'passed' ? chalk.green : chalk.red;

        this.logger.info(`Test Completed: ${testName}`, {
            event: 'TEST_END',
            testName,
            result,
            duration,
            timestamp: new Date().toISOString()
        });

        console.log(color(`✓ Completed Test: ${testName} (${duration}ms)`));
    }

    /**
     * Logs test errors and failures with stack traces and context
     * @param error Error object
     * @param context Error context information
     */
    public logError(error: Error, context: string): void {
        this.logger.error(`Error in test: ${context}`, {
            event: 'TEST_ERROR',
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context,
            timestamp: new Date().toISOString()
        });

        console.log(chalk.red(`❌ Error: ${error.message}`));
        if (error.stack) {
            console.log(chalk.gray(error.stack));
        }
    }

    /**
     * Logs test assertions and validations with detailed results
     * @param message Assertion message
     * @param details Assertion details including expected and actual values
     */
    public logAssertion(message: string, details: object): void {
        const passed = (details as any).passed || false;
        const color = passed ? chalk.green : chalk.yellow;

        this.logger.info(`Assertion: ${message}`, {
            event: 'TEST_ASSERTION',
            message,
            details,
            timestamp: new Date().toISOString()
        });

        console.log(color(`  ${passed ? '✓' : '!'} ${message}`));
    }
}

/**
 * Factory function to create a new TestLogger instance with configuration
 * @param config Logger configuration object
 * @returns Configured TestLogger instance
 */
export function createLogger(config: any = {}): TestLogger {
    return new TestLogger(config);
}

/**
 * Formats log messages with consistent structure and metadata
 * @param level Log level
 * @param message Log message
 * @param metadata Additional metadata
 * @returns Formatted log message
 */
export function formatLogMessage(level: string, message: string, metadata: object): string {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...metadata
    });
}