import CryptoKit
import Foundation
import Vapor

extension UserToken {
    static func makeValue() -> String {
        [UInt8].random(count: 32).base64
    }

    static func makeHash(from value: String) -> String {
        value.sha256
    }
}

private extension String {
    var sha256: String {
        let digest = SHA256.hash(data: Data(utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}
