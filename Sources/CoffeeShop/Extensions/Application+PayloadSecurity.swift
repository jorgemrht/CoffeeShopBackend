import Vapor

extension Application {
    struct PayloadSecurityConfiguration: Sendable {
        let isEnabled: Bool
        let service: PayloadSecurityService?
    }

    private struct PayloadSecurityConfigurationKey: StorageKey {
        typealias Value = PayloadSecurityConfiguration
    }

    var payloadSecurity: PayloadSecurityConfiguration {
        get {
            storage[PayloadSecurityConfigurationKey.self] ?? .init(isEnabled: false, service: nil)
        }
        set {
            storage[PayloadSecurityConfigurationKey.self] = newValue
        }
    }
}
