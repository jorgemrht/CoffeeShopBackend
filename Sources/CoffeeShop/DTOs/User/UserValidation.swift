import Vapor

enum UserValidation {
    static let username: Validator<String> = .count(3...20)
    static let password: Validator<String> = .count(6...)
    static let deviceID: Validator<String> = !.empty
}
