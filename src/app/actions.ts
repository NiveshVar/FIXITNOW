"use server";

import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import axios from "axios";
import { z } from "zod";
import { auth, db } from "@/lib/firebase";
import { classifyIssue } from "@/ai/flows/image-classification-for-issue";
import { detectDuplicateIssue } from "@/ai/flows/duplicate-issue-detection";
import { revalidatePath } from "next/cache";
import { ComplaintStatus } from "@/lib/types";


export async function handleLogout() {
  await signOut(auth);
  revalidatePath("/");
}

const reportSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  address: z.string().min(10),
  category: z.enum(["pothole", "tree fall", "garbage", "stray dog", "other"]),
  photoDataUri: z.string().optional(),
  userId: z.string(),
  userName: z.string(),
});

export async function createComplaint(values: z.infer<typeof reportSchema>) {
  try {
    // 1. Initial AI Classification if photo exists
    let category = values.category;
    if (values.photoDataUri && category === "other") {
      const classificationResult = await classifyIssue({ photoDataUri: values.photoDataUri });
      if (classificationResult.category) {
        category = classificationResult.category;
      }
    }

    // 2. Upload photo to ImgBB if it exists
    let photoURL = "";
    if (values.photoDataUri) {
      const apiKey = process.env.IMGBB_API_KEY;
      if (!apiKey) {
        throw new Error("ImgBB API key is not configured.");
      }

      const formData = new FormData();
      // Remove the data URI prefix before sending
      const base64Image = values.photoDataUri.split(',')[1];
      formData.append("image", base64Image);

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${apiKey}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        photoURL = response.data.data.url;
      } else {
        throw new Error("Image upload to ImgBB failed.");
      }
    }

    // 3. Create complaint document
    const complaintData = {
      userId: values.userId,
      userName: values.userName,
      title: values.title,
      description: values.description,
      location: {
        lat: Math.random() * 180 - 90, // Mock latitude
        long: Math.random() * 360 - 180, // Mock longitude
        address: values.address,
      },
      category: category,
      photoURL: photoURL,
      status: "Pending" as const,
      timestamp: serverTimestamp(),
    };

    const complaintRef = await addDoc(collection(db, "complaints"), complaintData);

    // 4. AI Duplicate Detection if photo exists
    if (values.photoDataUri) {
      const duplicateResult = await detectDuplicateIssue({
        photoDataUri: values.photoDataUri,
        latitude: complaintData.location.lat,
        longitude: complaintData.location.long,
        complaintId: complaintRef.id,
      });

      if (duplicateResult.isDuplicate && duplicateResult.duplicateComplaintId) {
        await updateDoc(complaintRef, {
          duplicateOf: duplicateResult.duplicateComplaintId,
          status: "Resolved"
        });
      }
    }

    revalidatePath("/");
    return { success: true, id: complaintRef.id };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    return { error: `Failed to create complaint: ${errorMessage}` };
  }
}


export async function updateComplaintStatus(complaintId: string, status: ComplaintStatus) {
    try {
        const complaintRef = doc(db, "complaints", complaintId);
        await updateDoc(complaintRef, { status });
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}


export async function findOrCreateUser(
  uid: string,
  phone: string
): Promise<void> {
  const userRef = doc(db, "users", uid);

  const usersRef = collection(db, "users");
  const q = query(usersRef, where("uid", "==", uid));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    await setDoc(userRef, {
      uid: uid,
      name: "User",
      email: phone,
      role: "user",
    });
  }
}
