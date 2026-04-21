const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    otp: String,
    otpExpires: Date,
    resetToken: String,
    resetTokenExpire: Date,
    savedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    purchasedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    earnings: { type: Number, default: 0 },
    allergies: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (this.isModified('name')) {
    try {
      const Recipe = mongoose.model('Recipe');
      await Recipe.updateMany({ user: this._id }, { chefName: this.name });
      await Recipe.updateMany(
        { 'comments.user': this._id },
        { $set: { 'comments.$[elem].userName': this.name } },
        { arrayFilters: [{ 'elem.user': this._id }] }
      );
    } catch (err) {
      console.error('Error syncing name change:', err);
    }
  }

  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);