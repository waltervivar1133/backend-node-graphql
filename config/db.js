const mongoose = require('mongoose');

require('dotenv').config({ path: '.env'});

const connectDB = async () => {
  try {
      await mongoose.connect(process.env.DB_MONGO, {

      });
      console.log('db connection established');
  } catch (error) {
    console.log('hubo un error: ' + error);
    process.exit(1);
  }
}

module.exports = connectDB;