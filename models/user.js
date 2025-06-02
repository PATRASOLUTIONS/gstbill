import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
    },
    role: {
      type: String,
      enum: ["user", "admin", "manager"],
      default: "user",
    },
    sidebarPermissions: {
      type: Map,
      of: Boolean,
      default: {
        dashboard: true,
        products: true,
        invoices: true,
      },
    },
  },
  { timestamps: true },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Set default sidebar permissions for new users
userSchema.pre("save", function (next) {
  if (this.isNew) {
    // For admin users, enable all permissions
    if (this.role === "admin") {
      this.sidebarPermissions = {
        dashboard: true,
        products: true,
        categories: true,
        customers: true,
        sales: true,
        purchases: true,
        suppliers: true,
        invoices: true,
        refunds: true,
        reports: true,
        inventory: true,
        "stock-alerts": true,
        settings: true,
        admin: true,
      }
    } else {
      // For regular users, set default permissions
      this.sidebarPermissions = {
        dashboard: true,
        products: true,
        invoices: true,
      }
    }
  }
  next()
})

// Use existing model or create a new one
const User = mongoose.models.User || mongoose.model("User", userSchema)

export default User
