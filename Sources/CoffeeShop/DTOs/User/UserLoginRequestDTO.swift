import Vapor

struct UserLoginRequestDTO: Content, Validatable {
    let email: String
    let password: String
    let deviceID: String

    static func validations(_ validations: inout Validations) {
        validations.add("email", as: String.self, is: .email)
        validations.add("password", as: String.self, is: UserValidation.password)
        validations.add("deviceID", as: String.self, is: UserValidation.deviceID)
    }
}
