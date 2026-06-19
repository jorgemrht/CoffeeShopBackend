import Fluent
import Vapor

struct UserLoginAuthenticator: AsyncRequestAuthenticator {
    func authenticate(request: Request) async throws {
        try UserLoginRequestDTO.validate(content: request)
        let credentials = try request.content.decode(UserLoginRequestDTO.self)
        guard let user = try await User.query(on: request.db)
            .filter(byEmail: credentials.email)
            .first()
        else {
            throw UserAuthenticationError.invalidCredentials
        }

        guard try request.password.verify(credentials.password, created: user.password) else {
            throw UserAuthenticationError.invalidCredentials
        }

        request.auth.login(user)
    }
}
