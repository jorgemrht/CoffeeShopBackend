import Foundation
import Fluent

extension UserToken {
    static func issue(
        for user: User,
        device_id: String,
        on database: any Database
    ) async throws -> String {
        if let existingToken = try await UserToken.query(on: database)
            .filter(byUserID: user.requireID())
            .filter(byDeviceID: device_id)
            .first()
        {
            let generatedToken = try user.generateToken(device_id: device_id)
            existingToken.tokenHash = generatedToken.userToken.tokenHash
            existingToken.revokedAt = nil
            existingToken.lastUsedAt = Date()
            try await existingToken.save(on: database)
            return generatedToken.rawValue
        }

        let generatedToken = try user.generateToken(device_id: device_id)
        generatedToken.userToken.lastUsedAt = Date()
        try await generatedToken.userToken.save(on: database)
        return generatedToken.rawValue
    }
}
