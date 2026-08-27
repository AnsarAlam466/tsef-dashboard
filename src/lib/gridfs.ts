import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export async function getBucket() {
  await connectDB();
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName: "uploads" });
}

export async function uploadToGridFS(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  const bucket = await getBucket();
  return new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(filename, { metadata: { contentType } });
    stream.on("error", reject);
    stream.on("finish", () => resolve(stream.id.toString()));
    stream.end(buffer);
  });
}

export async function downloadFromGridFS(id: string): Promise<Buffer> {
  const bucket = await getBucket();
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    bucket
      .openDownloadStream(new mongoose.Types.ObjectId(id))
      .on("data", (chunk) => chunks.push(chunk))
      .on("error", reject)
      .on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export async function deleteFromGridFS(id: string) {
  const bucket = await getBucket();
  try {
    await bucket.delete(new mongoose.Types.ObjectId(id));
  } catch {
    // file already gone, ignore
  }
}
