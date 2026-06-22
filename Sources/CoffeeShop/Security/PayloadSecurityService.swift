import Crypto
import Foundation
import Vapor

struct PayloadSecurityService: Sendable {
    let symmetricKey: SymmetricKey
    let rootPrivateKey: P256.Signing.PrivateKey

    init(symmetricKey: SymmetricKey, rootPrivateKey: P256.Signing.PrivateKey) {
        self.symmetricKey = symmetricKey
        self.rootPrivateKey = rootPrivateKey
    }

    func decryptRequest(_ request: Request) throws -> Data {
        if let cached = request.storage[DecryptedPayloadKey.self] {
            return cached
        }

        guard let body = request.body.data else {
            throw Abort(.unprocessableEntity)
        }

        let encrypted = try JSONDecoder().decode(EncryptedRequestPayload.self, from: Data(body.readableBytesView))
        let payload = try decrypt(
            encrypted.payload,
            authenticating: requestAAD(method: request.method.rawValue, path: request.url.path)
        )
        request.storage[DecryptedPayloadKey.self] = payload
        return payload
    }

    func encryptResponse(_ body: Data, for request: Request, status: HTTPResponseStatus) throws -> EncryptedResponsePayload {
        let payload = try encrypt(
            body,
            authenticating: responseAAD(
                method: request.method.rawValue,
                path: request.url.path,
                status: Int(status.code)
            )
        )
        let signature = try rootPrivateKey.signature(
            for: responseSignaturePayload(
                method: request.method.rawValue,
                path: request.url.path,
                status: Int(status.code),
                payload: payload
            )
        )
        return .init(
            payload: payload,
            signature: signature.rawRepresentation.base64URLEncodedString()
        )
    }

    func decodeRequest<T: Content>(_ type: T.Type, from request: Request) throws -> T {
        var value = try JSONDecoder().decode(T.self, from: decryptRequest(request))
        try value.afterDecode()
        return value
    }

    func decodeRequest<T: Content & Validatable>(_ type: T.Type, from request: Request) throws -> T {
        let data = try decryptRequest(request)
        guard let json = String(data: data, encoding: .utf8) else {
            throw Abort(.badRequest)
        }
        try T.validate(json: json)
        var value = try JSONDecoder().decode(T.self, from: data)
        try value.afterDecode()
        return value
    }

    private func encrypt(_ data: Data, authenticating aad: Data) throws -> String {
        let sealedBox = try AES.GCM.seal(data, using: symmetricKey, authenticating: aad)
        guard let combined = sealedBox.combined else {
            throw Abort(.internalServerError)
        }
        return combined.base64URLEncodedString()
    }

    private func decrypt(_ value: String, authenticating aad: Data) throws -> Data {
        guard let combined = Data(base64URLEncoded: value) else {
            throw Abort(.badRequest)
        }

        do {
            return try AES.GCM.open(AES.GCM.SealedBox(combined: combined), using: symmetricKey, authenticating: aad)
        } catch {
            throw Abort(.unauthorized)
        }
    }

    private func requestAAD(method: String, path: String) -> Data {
        Data("req|\(method)|\(path)".utf8)
    }

    private func responseAAD(method: String, path: String, status: Int) -> Data {
        Data("res|\(method)|\(path)|\(status)".utf8)
    }

    private func responseSignaturePayload(method: String, path: String, status: Int, payload: String) -> Data {
        Data("sig|\(method)|\(path)|\(status)|\(payload)".utf8)
    }
}

private struct DecryptedPayloadKey: StorageKey {
    typealias Value = Data
}
