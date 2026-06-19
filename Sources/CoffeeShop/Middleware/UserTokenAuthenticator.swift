import Fluent
import Vapor

struct UserTokenAuthenticator: AsyncBearerAuthenticator {
    func authenticate(bearer: BearerAuthorization, for request: Request) async throws {
        guard let userToken = try await UserToken.query(on: request.db)
            .filter(byTokenHash: UserToken.makeHash(from: bearer.token))
            .with(\.$user)
            .first(),
            userToken.isValid
        else {
            return
        }

        userToken.lastUsedAt = Date()
        try await userToken.save(on: request.db)
        request.auth.login(userToken.user)
    }
}
