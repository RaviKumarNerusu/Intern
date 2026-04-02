const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { getAdminEmail } = require("../config/admin");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["viewer", "analyst", "admin"],
      default: "viewer",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function userPreSave() {
  const ADMIN_EMAIL = getAdminEmail();
  const isFixedAdmin = this.email === ADMIN_EMAIL;
  const allowFixedAdminCreation = Boolean(this.$locals?.allowFixedAdminCreation);

  if (!this.isNew && this.isModified("email")) {
    const fixedAdmin = await this.constructor.findOne({ email: ADMIN_EMAIL }).select("_id");

    if (fixedAdmin && fixedAdmin._id.toString() === this._id.toString() && this.email !== ADMIN_EMAIL) {
      throw new Error("Fixed admin email cannot be changed");
    }
  }

  if (!this.isNew && isFixedAdmin) {
    if (this.isModified("role") && this.role !== "admin") {
      throw new Error("Fixed admin role cannot be changed");
    }
  }

  if (this.role === "admin") {
    if (this.isNew && !isFixedAdmin) {
      throw new Error("Admin role is restricted");
    }

    if (this.isNew && isFixedAdmin && !allowFixedAdminCreation) {
      throw new Error("Admin role is restricted");
    }

    if (this.isModified("role") && !isFixedAdmin) {
      throw new Error("Admin role is restricted");
    }
  }

  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return;
});

userSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function preventAdminEscalation() {
  const update = this.getUpdate() || {};
  const nextRole = update.role ?? update.$set?.role;

  if (nextRole === "admin") {
    throw new Error("Admin role is restricted");
  }
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
