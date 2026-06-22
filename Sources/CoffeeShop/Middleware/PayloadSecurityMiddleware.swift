import Foundation
import Vapor

struct PayloadSecurityMiddleware: AsyncMiddleware {
    func respond(to request: Request, chainingTo next: any AsyncResponder) async throws -> Response {
        if shouldDecrypt(request: request),
           let payloadSecurity = request.application.payloadSecurity.service {
            _ = try payloadSecurity.decryptRequest(request)
        }

        let response = try await next.respond(to: request)
        guard shouldEncrypt(response: response) else {
            return response
        }
        guard let body = response.body.data else {
            return response
        }

        guard let payloadSecurity = request.application.payloadSecurity.service else {
            return response
        }

        let encryptedEnvelope = try payloadSecurity.encryptResponse(body, for: request, status: response.status)

        let encoded = try JSONEncoder.securePayloadEncoder.encode(encryptedEnvelope)
        response.body = .init(data: encoded)
        response.headers.contentType = .json
        return response
    }

    private func shouldDecrypt(request: Request) -> Bool {
        guard request.application.payloadSecurity.isEnabled else {
            return false
        }

        guard let contentType = request.headers.contentType else {
            return false
        }

        return contentType.type == HTTPMediaType.json.type && contentType.subType == HTTPMediaType.json.subType
    }

    private func shouldEncrypt(response: Response) -> Bool {
        if response.status == .noContent {
            return false
        }

        guard let contentType = response.headers.contentType else {
            return false
        }

        return contentType.type == HTTPMediaType.json.type && contentType.subType == HTTPMediaType.json.subType
    }
}

private extension JSONEncoder {
    static let securePayloadEncoder: JSONEncoder = {
        JSONEncoder()
    }()
}
