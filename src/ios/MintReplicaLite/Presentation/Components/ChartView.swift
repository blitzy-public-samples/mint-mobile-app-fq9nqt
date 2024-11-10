// SwiftUI framework - iOS 14.0+
import SwiftUI
// Combine framework - iOS 14.0+
import Combine

// MARK: - Human Tasks
/*
 1. Verify VoiceOver functionality with different chart types
 2. Test color contrast ratios for accessibility compliance
 3. Validate dynamic type scaling behavior
 4. Test chart animations on different device performance levels
 5. Verify touch interaction areas meet accessibility guidelines
*/

// MARK: - Chart Types
/// Supported chart visualization types
public enum ChartType {
    case line
    case bar
    case pie
}

// MARK: - ChartDataPoint
/// Structure representing a single data point with accessibility support
public struct ChartDataPoint: Identifiable {
    public let id = UUID()
    public let value: Decimal
    public let label: String
    public let date: Date?
    public let color: Color?
    public let accessibilityLabel: String
    
    public init(value: Decimal, label: String, date: Date? = nil, color: Color? = nil, accessibilityLabel: String? = nil) {
        self.value = value
        self.label = label
        self.date = date
        self.color = color
        self.accessibilityLabel = accessibilityLabel ?? "\(label): \(CurrencyFormatter.shared.formatAmount(value))"
    }
}

// MARK: - ChartView
/// SwiftUI view that renders accessible financial data visualizations
/// Implements requirements:
/// - Data Visualization (8.1.2)
/// - Investment Portfolio Tracking (8.1.5)
/// - Budget Monitoring (1.2)
/// - Accessibility Support (8.1.8)
@available(iOS 14.0, *)
public struct ChartView: View {
    // MARK: - Properties
    private let dataPoints: [ChartDataPoint]
    private let chartType: ChartType
    private let accentColor: Color
    private let showLabels: Bool
    private let showGrid: Bool
    private let isAnimated: Bool
    private let animationDuration: CGFloat
    private let isAccessibilityEnabled: Bool
    
    @Environment(\.colorScheme) private var colorScheme
    
    // MARK: - Initialization
    public init(
        dataPoints: [ChartDataPoint],
        chartType: ChartType,
        accentColor: Color? = nil,
        showLabels: Bool = true,
        showGrid: Bool = true,
        isAnimated: Bool = true
    ) {
        self.dataPoints = dataPoints
        self.chartType = chartType
        self.accentColor = accentColor ?? AppTheme.shared.primary
        self.showLabels = showLabels
        self.showGrid = showGrid
        self.isAnimated = isAnimated
        self.animationDuration = 0.5
        self.isAccessibilityEnabled = UIAccessibility.isVoiceOverRunning
    }
    
    // MARK: - Body
    public var body: some View {
        GeometryReader { geometry in
            ZStack {
                if showGrid {
                    gridView(size: geometry.size)
                }
                
                switch chartType {
                case .line:
                    makeLineChart(size: geometry.size)
                case .bar:
                    makeBarChart(size: geometry.size)
                case .pie:
                    makePieChart(size: geometry.size)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(chartAccessibilityLabel)
        .accessibilityHint("Double tap to interact with the chart")
    }
    
    // MARK: - Chart Components
    
    /// Creates an accessible line chart visualization
    private func makeLineChart(size: CGSize) -> some View {
        let points = normalizedDataPoints(for: size)
        
        return ZStack {
            // Chart path
            Path { path in
                guard let first = points.first else { return }
                path.move(to: first)
                points.dropFirst().forEach { path.addLine(to: $0) }
            }
            .stroke(accentColor, style: StrokeStyle(lineWidth: 2, lineCap: .round))
            .accessibilityHidden(true)
            
            // Data points
            ForEach(dataPoints.indices, id: \.self) { index in
                Circle()
                    .fill(accentColor)
                    .frame(width: 8, height: 8)
                    .position(points[index])
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(dataPoints[index].accessibilityLabel)
                    .accessibilityAddTraits(.isButton)
            }
        }
        .animation(isAnimated ? .easeInOut(duration: animationDuration) : nil)
    }
    
    /// Creates an accessible bar chart visualization
    private func makeBarChart(size: CGSize) -> some View {
        let barWidth = size.width / CGFloat(dataPoints.count) * 0.8
        let maxValue = dataPoints.map { $0.value as NSDecimalNumber }.max()?.doubleValue ?? 0
        
        return HStack(alignment: .bottom, spacing: barWidth * 0.25) {
            ForEach(dataPoints) { point in
                let height = size.height * CGFloat((point.value as NSDecimalNumber).doubleValue / maxValue)
                
                VStack {
                    Rectangle()
                        .fill(point.color ?? accentColor)
                        .frame(width: barWidth, height: height)
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel(point.accessibilityLabel)
                        .accessibilityAddTraits(.isButton)
                    
                    if showLabels {
                        Text(point.label)
                            .font(AppTheme.shared.captionFont)
                            .foregroundColor(AppTheme.shared.textSecondary)
                            .fixedSize(horizontal: true, vertical: false)
                            .accessibilityHidden(true)
                    }
                }
            }
        }
        .animation(isAnimated ? .easeInOut(duration: animationDuration) : nil)
    }
    
    /// Creates an accessible pie chart visualization
    private func makePieChart(size: CGSize) -> some View {
        let total = dataPoints.reduce(Decimal.zero) { $0 + $1.value }
        let radius = min(size.width, size.height) / 2
        var startAngle = Angle.zero
        
        return ZStack {
            ForEach(dataPoints) { point in
                let percentage = Double((point.value / total) as NSDecimalNumber)
                let endAngle = startAngle + .degrees(360 * percentage)
                
                Path { path in
                    path.move(to: CGPoint(x: size.width/2, y: size.height/2))
                    path.addArc(center: CGPoint(x: size.width/2, y: size.height/2),
                               radius: radius,
                               startAngle: startAngle,
                               endAngle: endAngle,
                               clockwise: false)
                    path.closeSubpath()
                }
                .fill(point.color ?? accentColor)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("\(point.label): \(Int(percentage * 100))%")
                .accessibilityAddTraits(.isButton)
                
                let rotation = startAngle + .degrees(360 * percentage / 2)
                if showLabels {
                    Text(point.label)
                        .font(AppTheme.shared.captionFont)
                        .position(
                            x: size.width/2 + cos(CGFloat(rotation.radians)) * (radius * 0.7),
                            y: size.height/2 + sin(CGFloat(rotation.radians)) * (radius * 0.7)
                        )
                        .accessibilityHidden(true)
                }
                
                startAngle = endAngle
            }
        }
        .animation(isAnimated ? .easeInOut(duration: animationDuration) : nil)
    }
    
    // MARK: - Helper Views
    
    /// Creates grid lines for chart background
    private func gridView(size: CGSize) -> some View {
        let horizontalSpacing = size.width / 4
        let verticalSpacing = size.height / 4
        
        return ZStack {
            // Vertical lines
            ForEach(0..<5) { i in
                Path { path in
                    let x = horizontalSpacing * CGFloat(i)
                    path.move(to: CGPoint(x: x, y: 0))
                    path.addLine(to: CGPoint(x: x, y: size.height))
                }
                .stroke(AppTheme.shared.textDisabled.opacity(0.2), lineWidth: 1)
            }
            
            // Horizontal lines
            ForEach(0..<5) { i in
                Path { path in
                    let y = verticalSpacing * CGFloat(i)
                    path.move(to: CGPoint(x: 0, y: y))
                    path.addLine(to: CGPoint(x: size.width, y: y))
                }
                .stroke(AppTheme.shared.textDisabled.opacity(0.2), lineWidth: 1)
            }
        }
        .accessibilityHidden(true)
    }
    
    // MARK: - Helper Methods
    
    /// Normalizes data points to view coordinates
    private func normalizedDataPoints(for size: CGSize) -> [CGPoint] {
        guard !dataPoints.isEmpty else { return [] }
        
        let values = dataPoints.map { ($0.value as NSDecimalNumber).doubleValue }
        let maxValue = values.max() ?? 0
        let minValue = values.min() ?? 0
        let range = maxValue - minValue
        
        return dataPoints.enumerated().map { index, _ in
            let x = size.width * CGFloat(index) / CGFloat(dataPoints.count - 1)
            let normalizedValue = range > 0 ? (values[index] - minValue) / range : 0.5
            let y = size.height * (1 - CGFloat(normalizedValue))
            return CGPoint(x: x, y: y)
        }
    }
    
    /// Generates accessibility label for the entire chart
    private var chartAccessibilityLabel: String {
        switch chartType {
        case .line:
            return "Line chart showing \(dataPoints.count) data points"
        case .bar:
            return "Bar chart showing \(dataPoints.count) categories"
        case .pie:
            return "Pie chart showing percentage distribution"
        }
    }
}

// MARK: - Preview Provider
struct ChartView_Previews: PreviewProvider {
    static var previews: some View {
        let sampleData = [
            ChartDataPoint(value: 100, label: "Jan"),
            ChartDataPoint(value: 200, label: "Feb"),
            ChartDataPoint(value: 150, label: "Mar"),
            ChartDataPoint(value: 300, label: "Apr"),
            ChartDataPoint(value: 250, label: "May")
        ]
        
        Group {
            ChartView(dataPoints: sampleData, chartType: .line)
                .frame(height: 200)
                .padding()
                .previewDisplayName("Line Chart")
            
            ChartView(dataPoints: sampleData, chartType: .bar)
                .frame(height: 200)
                .padding()
                .previewDisplayName("Bar Chart")
            
            ChartView(dataPoints: sampleData, chartType: .pie)
                .frame(height: 200)
                .padding()
                .previewDisplayName("Pie Chart")
        }
    }
}