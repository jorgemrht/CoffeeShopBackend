import Fluent
import Foundation
import Vapor
import struct Foundation.UUID

final class UserToken: Model, @unchecked Sendable {
    @ID(key: .id)
    var id: UUID?

    @Field(key: FieldKeys.tokenHash)
    var tokenHash: String

    @Field(key: FieldKeys.deviceID)
    var deviceID: String

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
        deviceID: String,
        userID: User.IDValue
    ) {
        self.id = id
        self.tokenHash = tokenHash
        self.deviceID = deviceID
        self.$user.id = userID
    }
}

extension UserToken {
    static let schema = "user_tokens"

    enum FieldKeys {
        static let tokenHash: FieldKey = "token_hash"
        static let deviceID: FieldKey = "device_id"
        static let revokedAt: FieldKey = "revoked_at"
        static let createdAt: FieldKey = "created_at"
        static let lastUsedAt: FieldKey = "last_used_at"
        static let userID: FieldKey = "user_id"
    }

    var isValid: Bool {
        revokedAt == nil
    }
}
