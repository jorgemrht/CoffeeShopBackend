import Vapor

struct UserMeResponseDTO: Content {
    let username: String
    let email: String
    let isValidateEmail: Bool
}

extension User {
    func toMeResponseDTO() -> UserMeResponseDTO {
        .init(
            username: username,
            email: email,
            isValidateEmail: isValidateEmail
        )
    }
}
