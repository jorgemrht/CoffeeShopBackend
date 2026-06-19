import Vapor

struct UserLoginResponseDTO: Content {
    let username: String
    let email: String
    let isValidateEmail: Bool
    let token: String
}

extension User {
    func toLoginResponseDTO(token: String) -> UserLoginResponseDTO {
        .init(
            username: username,
            email: email,
            isValidateEmail: isValidateEmail,
            token: token
        )
    }
}
