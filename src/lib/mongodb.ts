import mongoose from "mongoose";

/**
 * MongoDB connection helper with global caching.
 * Prevents opening multiple database connections during Next.js hot reloads in
 * development and optimizes connection reuse across serverless executions.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // If not configured, provide a clear warning (or throw when executed)
  console.warn(
    "[MongoDB] Warning: MONGODB_URI environment variable is not defined. Ensure it is set in .env.local"
  );
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  // Return existing active connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Initiate connection if no existing promise is in flight
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;
