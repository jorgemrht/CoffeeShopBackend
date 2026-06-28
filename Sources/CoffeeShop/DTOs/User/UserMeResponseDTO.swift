import Vapor

struct UserMeResponseDTO: Content {
    let username: String
    let email: String
    let is_validate_email: Bool
}

extension User {
    func toMeResponseDTO() -> UserMeResponseDTO {
        .init(
            username: username,
            email: email,
            is_validate_email: is_validate_email
        )
    }
}
