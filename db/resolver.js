const User = require("../models/user");
const Product = require("../models/product");
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
    getClientsSeller: async (_,{}, ctx) => {
      try {
        const clients = await Client.find({ seller: ctx.user.id.toString()});
        return clients;
      } catch (error) {
        console.log(error);
      }
    },
    getClient: async (_,{id}, ctx) => {
      const client = await Client.findById(id);
      if(!client) throw new Error("Client not exist");
      if(client.seller.toString() !== ctx.user.id) throw new Error("You don't have the credentials")
      return client;
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
    newClient: async(_, {input}, ctx) => {
      console.log(ctx,'context');
      const { email} = input;
      const client = await Client.findOne({email});
      if(client) throw new Error("Client is already exists");
      const newClient = new Client(input);
      newClient.seller = ctx.user.id;
      try {
      
        const result = await newClient.save();
        return result;
      } catch (error) {
          console.log(error);
      }
    
    },
    updateClient: async(_, {id, input}, ctx) => {
      let client = await Client.findById(id);
      if(!client) throw new Error("Client not exist");
      if(client.seller.toString() !== ctx.user.id) throw new Error("You don't have the credentials")
      client = await Client.findByIdAndUpdate({_id: id}, input,{new: true})
      return client;
    },
    deteleClient: async (_,{id}, ctx) => {
      let client = await Client.findById(id);
      if(!client) throw new Error("Client not exist");
      if(client.seller.toString() !== ctx.user.id) throw new Error("You don't have the credentials")
      await Client.findOneAndDelete({_id: id})
      return "Client deleted"
    },
    newOrder: async(_,{input}, ctx) => {
      const { client } = input;
      let clientExist = await Client.findById(client);
      if(!clientExist) throw new Error("This client does not exist")
      if(clientExist.seller.toString() !== ctx.user.id) throw new Error("You don't have the credentials");
      //stock
      input.order.forEach( async item => {
        const {id} = item;
        const product = await Product.findById(id);
        if(item > product.stock){

        }
      } )
    }
  },
};

module.exports = resolvers;
