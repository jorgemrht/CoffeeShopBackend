import Fluent
import Vapor

extension User {
    func generateToken(device_id: String) throws -> (rawValue: String, userToken: UserToken) {
        let rawValue = UserToken.makeValue()
        let userToken = try UserToken(
            tokenHash: UserToken.makeHash(from: rawValue),
            device_id: device_id,
            userID: requireID()
        )

        return (rawValue, userToken)
    }
}
