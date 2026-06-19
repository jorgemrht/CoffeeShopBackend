import Vapor

enum UserAuthenticationError: AbortError {
    case invalidCredentials

    var status: HTTPResponseStatus {
        .unauthorized
    }

    var reason: String {
        switch self {
        case .invalidCredentials:
            return "Invalid credentials."
        }
    }
}
