import Fluent

extension QueryBuilder where Model == User {
    func filter(byEmail email: String) -> Self {
        self.filter(\.$email == email)
    }
}

extension QueryBuilder where Model == UserToken {
    func filter(byUserID userID: User.IDValue) -> Self {
        self.filter(\.$user.$id == userID)
    }

    func filter(byDeviceID device_id: String) -> Self {
        self.filter(\.$device_id == device_id)
    }

    func filter(byTokenHash tokenHash: String) -> Self {
        self.filter(\.$tokenHash == tokenHash)
    }
}
