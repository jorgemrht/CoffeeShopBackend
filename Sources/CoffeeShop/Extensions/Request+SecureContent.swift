import Vapor

extension Request {
    struct SecureContentContainer {
        let request: Request

        func decode<T: Content>(_ type: T.Type) throws -> T {
            if request.application.payloadSecurity.isEnabled,
               let payloadSecurity = request.application.payloadSecurity.service {
                return try payloadSecurity.decodeRequest(T.self, from: request)
            }

            return try request.content.decode(T.self)
        }

        func decodeValidating<T: Content & Validatable>(_ type: T.Type) throws -> T {
            if request.application.payloadSecurity.isEnabled,
               let payloadSecurity = request.application.payloadSecurity.service {
                return try payloadSecurity.decodeRequest(T.self, from: request)
            }

            try T.validate(content: request)
            return try request.content.decode(T.self)
        }

        func decode<T: Content & Validatable>(_ type: T.Type) throws -> T {
            try decodeValidating(T.self)
        }
    }

    var secureContent: SecureContentContainer {
        .init(request: self)
    }
}
