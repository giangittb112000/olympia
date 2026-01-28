import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * POST /api/finishline/upload-media
 * Upload media files (image/video/audio) to local storage
 * Saved to: public/uploads/finishline/
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    const isAudio = file.type.startsWith("audio/");

    if (!isVideo && !isImage && !isAudio) {
      return NextResponse.json(
        { error: "Only video, image, and audio files are allowed" },
        { status: 400 },
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "finishline");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/\s+/g, "_");
    const filename = `${timestamp}_${randomStr}_${originalName}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return public URL
    const publicUrl = `/uploads/finishline/${filename}`;
    const mediaType = isVideo ? "VIDEO" : isImage ? "IMAGE" : "AUDIO";

    console.log(`[FinishLine] Media uploaded: ${filename} (${mediaType})`);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      mediaType,
      filename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
