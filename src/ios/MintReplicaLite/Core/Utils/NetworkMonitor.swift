// Network version: iOS 14.0+
// Foundation version: iOS 14.0+
// Combine version: iOS 14.0+

import Network
import Foundation
import Combine

// MARK: - Human Tasks
/*
1. Verify minimum iOS version requirement (14.0+) in deployment settings
2. Configure background queue QoS based on performance requirements
3. Test network monitoring behavior in different network conditions
4. Verify sync interval configuration matches server capabilities
*/

// MARK: - Network Status Enum
/// Represents the possible network connection states
enum NetworkStatus {
    case connected
    case disconnected
}

// MARK: - Network Monitor
/// Singleton class responsible for monitoring network connectivity and providing real-time status updates
@available(iOS 14.0, *)
final class NetworkMonitor {
    // MARK: - Properties
    
    /// Shared singleton instance
    static let shared = NetworkMonitor()
    
    /// Network path monitor instance
    private let monitor: NWPathMonitor
    
    /// Background dispatch queue for network monitoring
    private let monitorQueue: DispatchQueue
    
    /// Publisher for network status updates
    private(set) var statusPublisher: CurrentValueSubject<NetworkStatus, Never>
    
    /// Current connection state
    private(set) var isConnected: Bool = false {
        didSet {
            statusPublisher.send(isConnected ? .connected : .disconnected)
        }
    }
    
    // MARK: - Initialization
    
    private init() {
        // Initialize network path monitor
        monitor = NWPathMonitor()
        
        // Create background queue for monitoring
        monitorQueue = DispatchQueue(label: "com.mintreplicalite.networkmonitor",
                                   qos: .utility,
                                   attributes: .concurrent)
        
        // Initialize status publisher with disconnected state
        statusPublisher = CurrentValueSubject<NetworkStatus, Never>(.disconnected)
        
        // Set up initial monitoring handler
        setupPathUpdateHandler()
    }
    
    // MARK: - Public Methods
    
    /// Begin monitoring network status changes
    func startMonitoring() {
        // Ensure monitoring isn't already active
        monitor.cancel()
        
        // Set up path update handler for connectivity changes
        setupPathUpdateHandler()
        
        // Start monitoring on background queue
        monitor.start(queue: monitorQueue)
        
        // Update initial connection state
        isConnected = checkConnectivity()
    }
    
    /// Stop monitoring network status changes
    func stopMonitoring() {
        // Cancel active network monitoring
        monitor.cancel()
        
        // Update status to disconnected
        isConnected = false
    }
    
    /// Check current network connectivity status
    /// - Returns: Current connection state
    func checkConnectivity() -> Bool {
        return monitor.currentPath.status == .satisfied
    }
    
    // MARK: - Private Methods
    
    /// Sets up the network path monitoring handler
    private func setupPathUpdateHandler() {
        monitor.pathUpdateHandler = { [weak self] path in
            guard let self = self else { return }
            
            // Update connection state based on path status
            let isConnected = path.status == .satisfied
            
            // Dispatch status update to main queue
            DispatchQueue.main.async {
                self.isConnected = isConnected
                
                // If connection is restored, trigger sync after MAX_SYNC_INTERVAL
                if isConnected {
                    DispatchQueue.global(qos: .utility).asyncAfter(deadline: .now() + AppConstants.Sync.interval) {
                        NotificationCenter.default.post(name: NSNotification.Name("TriggerDataSync"), object: nil)
                    }
                }
            }
            
            // Log network interface types for debugging
            #if DEBUG
            if path.usesInterfaceType(.wifi) {
                print("Network: Connected via WiFi")
            } else if path.usesInterfaceType(.cellular) {
                print("Network: Connected via Cellular")
            } else if path.usesInterfaceType(.wiredEthernet) {
                print("Network: Connected via Ethernet")
            } else {
                print("Network: No active connection")
            }
            #endif
        }
    }
}