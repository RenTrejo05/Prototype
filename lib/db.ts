
import type {
  User,
  Project,
  Task,
  Comment,
  HistoryEntry,
  Notification,
} from "@/types";

import { MongoClient, Db, Collection } from "mongodb";

// Usamos una función para obtener el cliente y así evitamos
// lanzar errores en tiempo de build cuando no hay variables de entorno.
const globalForMongo = globalThis as unknown as {
  _mongoClient?: MongoClient;
};

function getMongoClient(): MongoClient {
  if (!globalForMongo._mongoClient) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error(
        "MONGODB_URI no está definido en las variables de entorno",
      );
    }
    globalForMongo._mongoClient = new MongoClient(uri);
  }

  return globalForMongo._mongoClient;
}

export async function getDb(): Promise<Db> {
  const client = getMongoClient();
  // En Vercel/serverless el driver conecta en la primera operación; no llamar connect() evita timeouts.
  try {
    await client.connect();
  } catch (err) {
    const msg = String(err);
    if (!msg.includes("topology") && !msg.includes("already connected")) {
      throw err;
    }
  }
  return client.db("legacyapp");
}

export async function usersCollection(): Promise<Collection<User>> {
  const db = await getDb();

  return db.collection<User>("users");
}

export async function projectsCollection(): Promise<Collection<Project>> {
  const db = await getDb();

  return db.collection<Project>("projects");
}

export async function tasksCollection(): Promise<Collection<Task>> {
  const db = await getDb();

  return db.collection<Task>("tasks");
}

export async function commentsCollection(): Promise<Collection<Comment>> {
  const db = await getDb();

  return db.collection<Comment>("comments");
}

export async function historyCollection(): Promise<Collection<HistoryEntry>> {
  const db = await getDb();

  return db.collection<HistoryEntry>("history");
}

export async function notificationsCollection(): Promise<
  Collection<Notification>
> {
  const db = await getDb();

  return db.collection<Notification>("notifications");
}
