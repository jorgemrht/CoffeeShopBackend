import Fluent
import Vapor

extension User {
    func generateToken(deviceID: String) throws -> (rawValue: String, userToken: UserToken) {
        let rawValue = UserToken.makeValue()
        let userToken = try UserToken(
            tokenHash: UserToken.makeHash(from: rawValue),
            deviceID: deviceID,
            userID: requireID()
        )

        return (rawValue, userToken)
    }
}
