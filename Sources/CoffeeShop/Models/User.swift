import Fluent
import Vapor
import struct Foundation.UUID

final class User: Model, @unchecked Sendable {
    @ID(key: .id)
    var id: UUID?

    @Field(key: FieldKeys.username)
    var username: String

    @Field(key: FieldKeys.email)
    var email: String

    @Field(key: FieldKeys.password)
    var password: String

    @Field(key: FieldKeys.isValidateEmail)
    var isValidateEmail: Bool

    init() { }

    init(
        id: UUID? = nil,
        username: String,
        email: String,
        password: String,
        isValidateEmail: Bool = false
    ) {
        self.id = id
        self.username = username
        self.email = email
        self.password = password
        self.isValidateEmail = isValidateEmail
    }
}

extension User {
    static let schema = "users"

    enum FieldKeys {
        static let username: FieldKey = "username"
        static let email: FieldKey = "email"
        static let password: FieldKey = "password_hash"
        static let isValidateEmail: FieldKey = "isValidateEmail"
    }
}

extension User: Authenticatable {}
