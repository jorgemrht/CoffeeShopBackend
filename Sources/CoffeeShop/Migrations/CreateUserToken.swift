import Fluent

struct CreateUserToken: AsyncMigration {
    var name: String { "CreateUserToken" }

    func prepare(on database: any Database) async throws {
        try await database.schema(UserToken.schema)
            .id()
            .field(UserToken.FieldKeys.tokenHash, .string, .required)
            .field(UserToken.FieldKeys.device_id, .string, .required)
            .field(UserToken.FieldKeys.revokedAt, .datetime)
            .field(UserToken.FieldKeys.createdAt, .datetime)
            .field(UserToken.FieldKeys.lastUsedAt, .datetime)
            .field(UserToken.FieldKeys.userID, .uuid, .required, .references(User.schema, .id))
            .unique(on: UserToken.FieldKeys.tokenHash)
            .unique(on: UserToken.FieldKeys.userID, UserToken.FieldKeys.device_id)
            .create()
    }

    func revert(on database: any Database) async throws {
        try await database.schema(UserToken.schema).delete()
    }
}
