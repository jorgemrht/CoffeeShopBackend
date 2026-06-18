import Foundation
import NIOSSL
import FluentPostgresDriver
import Vapor

extension PostgresConnection.Configuration.TLS {
    static func databaseConfiguration() throws -> Self {
        if let certificate = try NIOSSLCertificate.supabaseRootCertificate() {
            var configuration = TLSConfiguration.clientDefault
            configuration.certificateVerification = .fullVerification
            configuration.trustRoots = .certificates([certificate])
            return .require(try .init(configuration: configuration))
        }

        return .prefer(try .init(configuration: .clientDefault))
    }
}

private extension NIOSSLCertificate {
    static func supabaseRootCertificate() throws -> NIOSSLCertificate? {
        if let encoded = Environment.get("SUPABASE_ROOT_CERT_B64"), !encoded.isEmpty {
            guard let data = Data(base64Encoded: encoded) else {
                throw Abort(.internalServerError, reason: "Unable to initialize application services.")
            }

            return try NIOSSLCertificate(bytes: [UInt8](data), format: .pem)
        }

        if let pem = Environment.get("SUPABASE_ROOT_CERT"), !pem.isEmpty {
            return try NIOSSLCertificate(bytes: Array(pem.utf8), format: .pem)
        }

        return nil
    }
}
