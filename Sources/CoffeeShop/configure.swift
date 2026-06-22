import Fluent
import FluentPostgresDriver
import FluentSQLiteDriver
import Leaf
import Vapor

/// configures your application
func configure(_ app: Application) async throws {
    // uncomment to serve files from /Public folder
    // app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))

    try configurePayloadSecurity(app)

    if app.environment == .testing {
        app.databases.use(.sqlite(.memory), as: .sqlite)
    } else {
        // TODO: Next PR: remove these database fallbacks and require DATABASE_* values explicitly outside testing.
        // Keeping defaults is convenient for now, but strict environment-based configuration is safer and clearer.
        app.databases.use(
            DatabaseConfigurationFactory.postgres(configuration: .init(
                hostname: Environment.get("DATABASE_HOST") ?? "localhost",
                port: Environment.get("DATABASE_PORT").flatMap(Int.init(_:)) ?? SQLPostgresConfiguration.ianaPortNumber,
                username: Environment.get("DATABASE_USERNAME") ?? "vapor_username",
                password: Environment.get("DATABASE_PASSWORD") ?? "vapor_password",
                database: Environment.get("DATABASE_NAME") ?? "vapor_database",
                tls: try .databaseConfiguration()
            )),
            as: .psql
        )
    }

    app.migrations.add(CreateUser())
    app.migrations.add(CreateUserToken())
    app.migrations.add(CreateCoffeeShop())

    app.views.use(.leaf)

    // register routes
    try routes(app)
}

private func configurePayloadSecurity(_ app: Application) throws {
    let isEnabled = try PayloadSecurityBootstrap.isEnabled()

    if isEnabled {
        app.payloadSecurity = .init(
            isEnabled: true,
            service: try PayloadSecurityBootstrap.make(for: app.environment)
        )
        app.middleware.use(PayloadSecurityMiddleware(), at: .beginning)
    } else {
        app.payloadSecurity = .init(isEnabled: false, service: nil)
    }
}
