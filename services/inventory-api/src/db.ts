import type { Product, Sale } from "./types.js";
import { MongoClient, type Collection } from "mongodb";

const globalForMongo = globalThis as unknown as { _mongoClient?: MongoClient };

function getMongoClient(): MongoClient {
  if (!globalForMongo._mongoClient) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI no está definido");
    globalForMongo._mongoClient = new MongoClient(uri);
  }
  return globalForMongo._mongoClient;
}

async function getDb() {
  const client = getMongoClient();
  try {
    await client.connect();
  } catch (err) {
    const msg = String(err);
    if (!msg.includes("topology") && !msg.includes("already connected")) throw err;
  }
  return client.db("legacyapp");
}

export async function productsCollection(): Promise<Collection<Product>> {
  const db = await getDb();
  return db.collection<Product>("products");
}

export async function salesCollection(): Promise<Collection<Sale>> {
  const db = await getDb();
  return db.collection<Sale>("sales");
}
