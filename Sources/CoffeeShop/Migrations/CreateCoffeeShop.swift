import Fluent

struct CreateCoffeeShop: AsyncMigration {
    var name: String { "CreateCoffeeShop" }

    func prepare(on database: any Database) async throws {
        try await database.schema(CoffeeShop.schema)
            .id()
            .field(CoffeeShop.FieldKeys.name, .string, .required)
            .field(CoffeeShop.FieldKeys.rating, .double, .required)
            .field(CoffeeShop.FieldKeys.img, .string, .required)
            .field(CoffeeShop.FieldKeys.description, .string, .required)
            .create()
    }

    func revert(on database: any Database) async throws {
        try await database.schema(CoffeeShop.schema).delete()
    }
}
