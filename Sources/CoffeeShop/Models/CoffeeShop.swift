import Fluent
import struct Foundation.UUID

final class CoffeeShop: Model, @unchecked Sendable {
    @ID(key: .id)
    var id: UUID?

    @Field(key: FieldKeys.name)
    var name: String

    @Field(key: FieldKeys.rating)
    var rating: Double

    @Field(key: FieldKeys.img)
    var img: String

    @Field(key: FieldKeys.description)
    var description: String

    init() { }

    init(
        id: UUID? = nil,
        name: String,
        rating: Double,
        img: String,
        description: String
    ) {
        self.id = id
        self.name = name
        self.rating = rating
        self.img = img
        self.description = description
    }
}

extension CoffeeShop {
    static let schema = "coffee_shops"

    enum FieldKeys {
        static let name: FieldKey = "name"
        static let rating: FieldKey = "rating"
        static let img: FieldKey = "img"
        static let description: FieldKey = "description"
    }
}
