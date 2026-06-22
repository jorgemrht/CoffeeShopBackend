import Vapor

struct EncryptedRequestPayload: Content {
    let payload: String
}

struct EncryptedResponsePayload: Content {
    let payload: String
    let signature: String
}
