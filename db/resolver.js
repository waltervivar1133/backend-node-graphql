const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");
const Client = require("../models/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env" });

const createToken = (user, secretKey, expiresIn) => {
  const { id } = user;
  return jwt.sign({ id }, secretKey, { expiresIn });
};
const resolvers = {
  Query: {
    getUser: async (_, { token }) => {
      const userId = await jwt.verify(token, process.env.SECRET_KEY);
      return userId;
    },
    getProducts: async () => {
      try {
        const product = await Product.find({});
        return product;
      } catch (error) {
        console.log(error);
      }
    },
    getProduct: async (_, { id }) => {
      const product = await Product.findById(id);
      if (!product) throw new Error("Product not found");
      return product;
    },
    getClients: async () => {
      try {
        const Clients = await Client.find({});
        return Clients;
      } catch (error) {
        console.log(error);
      }
    },
    getClientsSeller: async (_, {}, ctx) => {
      try {
        const clients = await Client.find({ seller: ctx.user.id.toString() });
        return clients;
      } catch (error) {
        console.log(error);
      }
    },
    getClient: async (_, { id }, ctx) => {
      const client = await Client.findById(id);
      if (!client) throw new Error("Client not exist");
      if (client.seller.toString() !== ctx.user.id)
        throw new Error("You don't have the credentials");
      return client;
    },
    getOrders: async () => {
      try {
        const orders = await Order.find({});
        return orders;
      } catch (error) {
        console.log(error);
      }
    },
    getOrdersSeller: async (_, {}, ctx) => {
      try {
        const orders = await Order.find({ seller: ctx.user.id });
        return orders;
      } catch (error) {
        console.log(error);
      }
    },
    getOrder: async (_, { id }, ctx) => {
      const order = await Order.findById(id);
      if (!order) throw new Error("Order not exist");
      if (order.seller.toString() !== ctx.user.id) {
        throw new Error("You don't have a credentials");
      }
      return order;
    },
    getOrdersStatus: async (_, { status }, ctx) => {
      const orders = await Order.find({ seller: ctx.user.id, status });
      return orders;
    },
    bestClients: async () => {
      const sellers = await Order.aggregate([
        { $match: { status: "COMPLETED" } },
        {
          $group: {
            _id: "$client",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "clients", // model
            localField: "id",
            foreignField: "id",
            as: "client",
          },
        },
        {
          $sort: { total: -1 },
        },
      ]);

      return sellers;
    },
    bestSellers: async () => {
      const clients = await Order.aggregate([
        { $match: { status: "COMPLETED" } },
        {
          $group: {
            _id: "$seller",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "users", // model
            localField: "_id",
            foreignField: "_id",
            as: "seller",
          },
        },
        {
          $limit: 5,
        },
        {
          $sort: { total: -1 },
        },
      ]);

      return clients;
    },
    searchProduct: async(_, {text}) => {
      const products = await Product.find({ $text: {$search: text}}).limit(10);
      return products
    }
  },
  Mutation: {
    newUser: async (_, { input }) => {
      const { email, password } = input;
      const userExists = await User.findOne({ email });
      if (userExists) throw new Error("user already exists");
      const salt = bcrypt.genSaltSync(10);
      input.password = bcrypt.hashSync(password, salt);
      try {
        const user = new User(input);
        user.save();
        return user;
      } catch (error) {
        console.log(error);
      }
    },
    authenticatedUser: async (_, { input }) => {
      const { email, password } = input;
      const userExists = await User.findOne({ email });
      if (!userExists) throw new Error("This user does not exist");
      const passCorrect = bcrypt.compareSync(password, userExists.password);
      if (!passCorrect) throw new Error("this password is incorrect");
      return {
        token: createToken(userExists, process.env.SECRET_KEY, "24h"),
      };
    },
    newProduct: async (_, { input }) => {
      try {
        const product = new Product(input);
        return (result = await product.save());
      } catch (error) {
        console.log(error);
      }
    },
    updatedProduct: async (_, { id, input }) => {
      let product = await Product.findById(id);
      if (!product) throw new Error("Product not found");
      product = await Product.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return product;
    },
    deleteProduct: async (_, { id }) => {
      let product = await Product.findById(id);
      if (!product) throw new Error("Product not found");
      await Product.findOneAndDelete({ _id: id });
      return "Product deleted successfully";
    },
    newClient: async (_, { input }, ctx) => {
      const { email } = input;
      const client = await Client.findOne({ email });
      if (client) throw new Error("Client is already exists");
      const newClient = new Client(input);
      newClient.seller = ctx.user.id;
      try {
        const result = await newClient.save();
        return result;
      } catch (error) {
        console.log(error);
      }
    },
    updateClient: async (_, { id, input }, ctx) => {
      let client = await Client.findById(id);
      if (!client) throw new Error("Client not exist");
      if (client.seller.toString() !== ctx.user.id)
        throw new Error("You don't have the credentials");
      client = await Client.findByIdAndUpdate({ _id: id }, input, {
        new: true,
      });
      return client;
    },
    deteleClient: async (_, { id }, ctx) => {
      let client = await Client.findById(id);
      if (!client) throw new Error("Client not exist");
      if (client.seller.toString() !== ctx.user.id)
        throw new Error("You don't have the credentials");
      await Client.findOneAndDelete({ _id: id });
      return "Client deleted";
    },
    newOrder: async (_, { input }, ctx) => {
      const { client } = input;
      let clientExist = await Client.findById(client);
      if (!clientExist) throw new Error("This client does not exist");
      if (clientExist.seller.toString() !== ctx.user.id)
        throw new Error("You don't have the credentials");
      //stock
      for await (const item of input.order) {
        const { id } = item;
        const product = await Product.findById(id);
        if (item.amount > product.stock) {
          throw new Error("this article is not available");
        } else {
          product.stock = product.stock - item.amount;
          await product.save();
        }
      }
      // create order
      const newOrder = new Order(input);
      newOrder.seller = ctx.user.id;
      const result = await newOrder.save();
      return result;
    },
    updateOrder: async (_, { id, input }, ctx) => {
      const { client } = input;
      const order = await Order.findById(id);
      if (!order) throw new Error("Order not exist");
      const clientExist = await Client.findById(client);
      if (!clientExist) throw new Error("This client does not exist");
      if (clientExist.seller.toString() !== ctx.user.id)
        throw new Error("You don't have the credentials");
      //stock validate order
      if (input.order) {
        for await (const item of input.order) {
          const { id, amount } = item;
          const product = await Product.findById(id);
          if (item.amount > product.stock) {
            throw new Error("this article is not available");
          } else {
            const previousQuantity = order.order.find(
              (item) => item.id === id
            ).amount;
            product.stock = product.stock + previousQuantity - item.amount;
            await product.save();
          }
        }
      }
      // update order
      const result = await Order.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return result;
    },
    deleteOrder: async (_, { id }, ctx) => {
      let order = await Order.findById(id);
      if (!order) throw new Error("Order not exist");
      if (order.seller.toString() !== ctx.user.id)
        throw new Error("You don't have the credentials");
      await Order.findOneAndDelete({ _id: id });
      return "Order is deleted";
    },
  },
};

module.exports = resolvers;
