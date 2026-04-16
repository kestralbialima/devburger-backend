import mongoose from "mongoose";
import Category from "../models/Category.js";


const OrderSchema = new mongoose.Schema ({
  user: {
     id: { 
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    }
},
products: [{
    id: {
        type: Number,
        required: true,
},
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    category: { 
        type:String,
        required: true,
    },
quantity: {
    type: Number,
    required: true,
},
url: {
    type: String,
    required: true,
}

}],
status: {
    type: String,
    required: true,
},
coupon_code: {
    type: String,
    required: false,
},
discount_percentage: {
    type: Number,
    required: false,
},
},
{
    timestamps: true
  },

);

export default mongoose.model('Order', OrderSchema);