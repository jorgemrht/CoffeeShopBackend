import Crypto
import Foundation
import Vapor

enum PayloadSecurityBootstrap {
    private enum EnvironmentKey {
        static let payloadSecurityEnabled = "PAYLOAD_SECURITY_ENABLED"
        static let appIdentityToken = "APP_IDENTITY_TOKEN"
        static let vaporRootKey = "VAPOR_ROOT_KEY"
    }

    private enum EnvironmentValue {
        static let enabled = "true"
        static let disabled = "false"
    }

    private enum Fallback {
        // TODO: Next PR: move these development/testing fallback secrets to .env.development and .env.testing.
        // Keeping crypto material out of source code is the cleaner long-term setup and matches Vapor's environment loading model.
        static let developmentIdentityToken = "coffeeshop-local-app-identity-token"
        static let testingIdentityToken = "coffeeshop-testing-app-identity-token"
        static let rootKey = """
        -----BEGIN PRIVATE KEY-----
        MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgP+CsL3v1S8M5Zr5C
        YdbBfBf4wA4vM8mE6b2gRz3qL0yhRANCAASDYYZ1Y9oM7fG0WjK2+2lT0lF7m7vH
        +T0dxnRUQ0Q4lY8m6m6S8v3sA+1W2h7D8x8M0W3WQn8fP4v7Yx6f2m2s
        -----END PRIVATE KEY-----
        """
    }

    private static let keyDerivationSalt = Data("CoffeeShop.PayloadSecurity".utf8)

    static func isEnabled() throws -> Bool {
        guard let value = Environment.get(EnvironmentKey.payloadSecurityEnabled)?.lowercased() else {
            return true
        }

        switch value {
        case EnvironmentValue.enabled:
            return true
        case EnvironmentValue.disabled:
            return false
        default:
            throw PayloadSecurityConfigurationError.invalidPayloadSecurityEnabled
        }
    }

    static func make(for environment: Environment) throws -> PayloadSecurityService {
        let token = try required(
            EnvironmentKey.appIdentityToken,
            fallback: fallbackValue(
                for: EnvironmentKey.appIdentityToken,
                environment: environment
            )
        )
        let rootKey = try required(
            EnvironmentKey.vaporRootKey,
            fallback: fallbackValue(
                for: EnvironmentKey.vaporRootKey,
                environment: environment
            )
        )

        return .init(
            symmetricKey: HKDF<SHA256>.deriveKey(
                inputKeyMaterial: .init(data: Data(token.utf8)),
                salt: keyDerivationSalt,
                info: Data(),
                outputByteCount: 32
            ),
            rootPrivateKey: try parsePrivateKey(rootKey)
        )
    }

    private static func required(_ name: String, fallback: String?) throws -> String {
        if let value = Environment.get(name), !value.isEmpty {
            return value
        }
        if let fallback {
            return fallback
        }
        throw PayloadSecurityConfigurationError.missingEnvironmentVariable(name)
    }

    private static func fallbackValue(for name: String, environment: Environment) -> String? {
        switch environment {
        case .development:
            switch name {
            case EnvironmentKey.appIdentityToken:
                Fallback.developmentIdentityToken
            case EnvironmentKey.vaporRootKey:
                Fallback.rootKey
            default:
                nil
            }
        case .testing:
            switch name {
            case EnvironmentKey.appIdentityToken:
                Fallback.testingIdentityToken
            case EnvironmentKey.vaporRootKey:
                Fallback.rootKey
            default:
                nil
            }
        default:
            nil
        }
    }

    private static func parsePrivateKey(_ value: String) throws -> P256.Signing.PrivateKey {
        let normalized = normalizePEM(value)
        do {
            return try P256.Signing.PrivateKey(pemRepresentation: normalized)
        } catch {
            throw PayloadSecurityConfigurationError.invalidRootKey
        }
    }

    private static func normalizePEM(_ value: String) -> String {
        value
            .replacingOccurrences(of: "\\n", with: "\n")
            .split(separator: "\n", omittingEmptySubsequences: false)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .joined(separator: "\n")
    }
}

enum PayloadSecurityConfigurationError: LocalizedError {
    case missingEnvironmentVariable(String)
    case invalidRootKey
    case invalidPayloadSecurityEnabled
    case invalidDatabasePort

    var errorDescription: String? {
        switch self {
        case .missingEnvironmentVariable(let name):
            return "Missing required environment variable: \(name)"
        case .invalidRootKey:
            return "VAPOR_ROOT_KEY is not a valid P-256 private key PEM."
        case .invalidPayloadSecurityEnabled:
            return "PAYLOAD_SECURITY_ENABLED must be either 'true' or 'false'."
        case .invalidDatabasePort:
            return "DATABASE_PORT must be a valid integer."
        }
    }
}
