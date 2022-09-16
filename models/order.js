const mongoose = require('mongoose');

const OrderSchema =  mongoose.Schema({
    order: {
      type: Array,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    client : {
      type: mongoose.Schema.Types.ObjectId,
      required: [true,'No empty input'],
      ref: 'Client'
    },
    seller : {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    status : {
      type: String,
      default: 'PENDING'
    },
    created_at: {
      type: Date,
      default: Date.now(),
    }
  })

  module.exports = mongoose.model("Order", OrderSchema );