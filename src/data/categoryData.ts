export const categoryData = {
  vegetables: {
    subCategories: [
      {
        name: "All",
        icon: require("../../assets/images/categories/vegetables.png"),
        products: [
          {
            id: "1",
            name: "Tomato",
            price: 40,
            image: require("../../assets/images/products/tomato.png"),
          },
          {
            id: "2",
            name: "Potato",
            price: 30,
            image: require("../../assets/images/products/potato.png"),
          },
        ],
      },

      {
        name: "Fresh Vegetables",
        icon: require("../../assets/images/categories/vegetables.png"),
        products: [
          {
            id: "3",
            name: "Carrot",
            price: 50,
            image: require("../../assets/images/products/carrot.png"),
          },
        ],
      },

      {
        name: "Fresh Fruits",
        icon: require("../../assets/images/categories/fruits.png"),
        products: [
          {
            id: "4",
            name: "Banana",
            price: 60,
            image: require("../../assets/images/products/banana.png"),
          },
        ],
      },
    ],
  },
};