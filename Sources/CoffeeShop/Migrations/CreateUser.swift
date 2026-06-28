import Fluent
import Vapor

struct CreateUser: AsyncMigration {
    var name: String { "CreateUser" }

    func prepare(on database: any Database) async throws {
        try await database.schema(User.schema)
            .id()
            .field(User.FieldKeys.username, .string, .required)
            .field(User.FieldKeys.email, .string, .required)
            .field(User.FieldKeys.password, .string, .required)
            .field(User.FieldKeys.is_validate_email, .bool, .required)
            .unique(on: User.FieldKeys.username)
            .unique(on: User.FieldKeys.email)
            .create()

        try await User.defaultUser().create(on: database)
    }

    func revert(on database: any Database) async throws {
        try await database.schema(User.schema).delete()
    }
}

private extension User {
    static func defaultUser() throws -> User {
        User(
            username: DefaultSeed.username,
            email: DefaultSeed.email,
            password: try Bcrypt.hash(DefaultSeed.password),
            is_validate_email: true
        )
    }
}

private enum DefaultSeed {
    static let username = "jorge"
    static let email = "jorge@mrht.dev"
    static let password = "123456"
}
