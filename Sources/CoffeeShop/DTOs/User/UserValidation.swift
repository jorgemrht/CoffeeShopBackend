import Vapor

enum UserValidation {
    static let username: Validator<String> = .count(3...20)
    static let password: Validator<String> = .count(6...)
    static let device_id: Validator<String> = !.empty
}
