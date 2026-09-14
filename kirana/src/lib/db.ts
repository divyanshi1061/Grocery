import mongoose from "mongoose"

const mongodbURL = process.env.MONGO_URL || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kirana"
const connectionSource = process.env.MONGO_URL ? "MONGO_URL" : process.env.MONGODB_URI ? "MONGODB_URI" : "fallback local URL"

let cached = global.mongoose
if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  }
}

const connectDb = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  if (mongoose.connection.readyState === 0) {
    cached.promise = null
  }

  if (!cached.promise) {
    console.log(`Connecting to MongoDB using ${connectionSource}`)
    cached.promise = mongoose
      .connect(mongodbURL, {
        serverSelectionTimeoutMS: 5000,
      })
      .then((conn) => conn.connection)
      .catch((error) => {
        cached.promise = null // Reset cached promise on failure
        throw error
      })
  }

  try {
    const conn = await cached.promise
    return conn
  } catch (error) {
    cached.promise = null
    console.error("MongoDB connection failed:", error)
    throw error
  }
}

export default connectDb