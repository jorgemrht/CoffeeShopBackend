import Vapor

struct UserLoginResponseDTO: Content {
    let username: String
    let email: String
    let is_validate_email: Bool
    let token: String
}

extension User {
    func toLoginResponseDTO(token: String) -> UserLoginResponseDTO {
        .init(
            username: username,
            email: email,
            is_validate_email: is_validate_email,
            token: token
        )
    }
}
