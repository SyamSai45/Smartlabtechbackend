import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Suggestion = mongoose.model('Suggestion', suggestionSchema);
export default Suggestion;