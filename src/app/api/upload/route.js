import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import r2Client from "@/utils/s3";

export async function POST(request) {
    try {
        const { fileName, fileType } = await request.json();

        if (!fileName || !fileType) {
            return NextResponse.json({ error: "fileName and fileType are required" }, { status: 400 });
        }

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            ContentType: fileType,
        });

        // Generate a presigned URL that lasts for 60 seconds
        const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 });

        return NextResponse.json({ 
            uploadUrl: signedUrl,
            publicUrl: `${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN}/${fileName}`
        });
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
    }
}
