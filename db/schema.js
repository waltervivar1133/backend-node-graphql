// schema

const { gql } = require("apollo-server");

const typeDefs = gql`
  type User {
    id: ID
    name: String
    surname: String
    email: String
    created_at: String
  }
  type Token {
    token: String
  }
  type Product {
    id: ID
    name: String
    stock: Int
    price: Float
    created_at: String
  }
  type Client {
    id: ID
    name: String
    surname: String
    company: String
    email: String
    phone: String
    seller: ID
  }
  type Order {
    id: ID
    order: [OrderGroup]
    total: Float
    client: ID
    seller: ID
    date: String
    status: OrderStatus
  }
  type OrderGroup {
    id: ID
    amount: Int
  }
  input UserInput {
    name: String!
    surname: String!
    email: String!
    password: String!
  }
  input ClientInput {
    name: String!
    surname: String!
    email: String!
    company: String!
    phone: String!
  }
  input ProductInput {
    name: String!
    stock: Int!
    price: Float!
  }
  input AuthenticatedUser {
    email: String!
    password: String!
  }
  input OrderProductInput {
    id: ID
    amount: Int
  }
  input OrderInput {
    order: [OrderProductInput]
    total: Float!
    client: ID!
    status: OrderStatus
  }
  enum OrderStatus {
    PENDING,
    COMPLETED,
    CANCELED
  }
  type Query {
    # Users
    getUser(token: String!): User

    # Products
    getProducts: [Product]
    getProduct(id: ID!): Product

    # CLients
    getClients: [Client]
    getClientsSeller: [Client]
    getClient(id: ID!): Client
  }
  type Mutation {
    # Users
    newUser(input: UserInput): User
    authenticatedUser(input: AuthenticatedUser): Token

    # Products
    newProduct(input: ProductInput): Product
    updatedProduct(id: ID!, input: ProductInput): Product
    deleteProduct(id: ID!): String

    #Clients
    newClient(input: ClientInput): Client
    updateClient(id: ID!, input: ClientInput): Client
    deteleClient(id: ID!): String

    #Orders
    newOrder(input: OrderInput): Order
  }
`;

module.exports = typeDefs;
