import Fluent
import Vapor

struct UserController: RouteCollection {
    func boot(routes: any RoutesBuilder) throws {
        let users = routes.grouped(RoutePath.users)
        let loginUsers = users
            .grouped(UserLoginAuthenticator())
            .grouped(User.guardMiddleware())
        let tokenProtectedUsers = users
            .grouped(UserTokenAuthenticator())
            .grouped(User.guardMiddleware())

        loginUsers.post(RoutePath.login, use: login)
        tokenProtectedUsers.get(RoutePath.me, use: me)
    }

    @Sendable
    func login(req: Request) async throws -> UserLoginResponseDTO {
        let user = try req.auth.require(User.self)
        let loginRequest = try req.secureContent.decodeValidating(UserLoginRequestDTO.self)
        let token = try await UserToken.issue(
            for: user,
            deviceID: loginRequest.deviceID,
            on: req.db
        )

        return user.toLoginResponseDTO(token: token)
    }

    @Sendable
    func me(req: Request) throws -> UserMeResponseDTO {
        try req.auth.require(User.self).toMeResponseDTO()
    }
}
private extension UserController {
    enum RoutePath {
        static let users: PathComponent = "users"
        static let login: PathComponent = "login"
        static let me: PathComponent = "me"
    }
}
