/* eslint-disable unicorn/prefer-module */
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();
const { GraphQLError } = require("graphql");
const jwt = require("jsonwebtoken");

const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");

const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, arguments_) => {
      if (Object.keys(arguments_).length === 0) {
        return Book.find({}).populate("author");
      }

      const query = {};
      if (arguments_.author) {
        const author = await Author.findOne({ name: arguments_.author });

        if (!author) {
          return [];
        }
        query["author"] = author._id;
      }

      if (arguments_.genre) {
        query["genres"] = { $in: [arguments_.genre] };
      }

      const books = Book.find(query).populate("author");
      return books;
    },
    allAuthors: async () => {
      const [authors, books] = await Promise.all([
        Author.find({}),
        Book.find({}).populate("author"),
      ]);

      return authors.map((author) => ({
        id: author._id,
        name: author.name,
        born: author.born,
        bookCount: books.filter((b) => b.author.name === author.name).length,
      }));
    },
    me: (root, arguments_, context) => {
      return context.currentUser;
    },
  },
  Mutation: {
    addBook: async (root, arguments_, context) => {
      const { currentUser } = context;

      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      let author = await Author.findOne({ name: arguments_.author });
      try {
        if (!author) {
          author = new Author({ name: arguments_.author });
          await author.save();
        }
      } catch (error) {
        throw new GraphQLError("Saving new author failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: arguments_.author,
            error,
          },
        });
      }
      try {
        const book = new Book({ ...arguments_, author });
        const newBook = await book.save();

        pubsub.publish("BOOK_ADDED", { bookAdded: newBook });

        return newBook;
      } catch (error) {
        throw new GraphQLError("Saving new book failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: arguments_.title,
            error,
          },
        });
      }
    },
    editAuthor: async (root, arguments_, context) => {
      const { currentUser } = context;

      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      const author = await Author.findOne({ name: arguments_.name });

      if (!author) {
        return null;
      }

      try {
        author.born = arguments_.setBornTo;
        await author.save();
        return author;
      } catch (error) {
        throw new GraphQLError("updating author failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: arguments_.name,
            error,
          },
        });
      }
    },
    createUser: async (root, arguments_) => {
      const user = new User({ ...arguments_ });

      try {
        await user.save();
        return user;
      } catch (error) {
        throw new GraphQLError("adding new user failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: arguments_.username,
            error,
          },
        });
      }
    },
    login: async (root, arguments_) => {
      const user = await User.findOne({ username: arguments_.username });
      if (!user || arguments_.password !== "secret") {
        throw new GraphQLError("Wrong credentials", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) };
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator("BOOK_ADDED"),
    },
  },
};

module.exports = resolvers;
