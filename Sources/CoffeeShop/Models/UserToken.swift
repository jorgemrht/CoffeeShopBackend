import Fluent
import Foundation
import Vapor
import struct Foundation.UUID

final class UserToken: Model, @unchecked Sendable {
    @ID(key: .id)
    var id: UUID?

    @Field(key: FieldKeys.tokenHash)
    var tokenHash: String

    @Field(key: FieldKeys.device_id)
    var device_id: String

    @OptionalField(key: FieldKeys.revokedAt)
    var revokedAt: Date?

    @Timestamp(key: FieldKeys.createdAt, on: .create)
    var createdAt: Date?

    @Timestamp(key: FieldKeys.lastUsedAt, on: .none)
    var lastUsedAt: Date?

    @Parent(key: FieldKeys.userID)
    var user: User

    init() { }

    init(
        id: UUID? = nil,
        tokenHash: String,
        device_id: String,
        userID: User.IDValue
    ) {
        self.id = id
        self.tokenHash = tokenHash
        self.device_id = device_id
        self.$user.id = userID
    }
}

extension UserToken {
    static let schema = "user_tokens"

    enum FieldKeys {
        static let tokenHash: FieldKey = "token_hash"
        static let device_id: FieldKey = "device_id"
        static let revokedAt: FieldKey = "revoked_at"
        static let createdAt: FieldKey = "created_at"
        static let lastUsedAt: FieldKey = "last_used_at"
        static let userID: FieldKey = "user_id"
    }

    var isValid: Bool {
        revokedAt == nil
    }
}
