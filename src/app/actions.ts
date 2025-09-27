
"use server";

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
import { db, auth } from "@/lib/firebase";
import { classifyIssue } from "@/ai/flows/image-classification-for-issue";
import { detectDuplicateIssue } from "@/ai/flows/duplicate-issue-detection";
import { revalidatePath } from "next/cache";
import { ComplaintStatus, UserProfile } from "@/lib/types";
import { signInWithEmailAndPassword } from "firebase/auth";


const reportSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  address: z.string().min(10),
  category: z.enum(["pothole", "tree fall", "garbage", "stray dog", "other"]),
  photoDataUri: z.string().optional(),
  userId: z.string(),
  userName: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function createComplaint(values: z.infer<typeof reportSchema>) {
  try {
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;

    // 1. Initial AI Classification if photo exists and key is present
    let category = values.category;
    if (values.photoDataUri && category === "other" && hasGeminiKey) {
      try {
        const classificationResult = await classifyIssue({ photoDataUri: values.photoDataUri });
        if (classificationResult.category) {
          category = classificationResult.category;
        }
      } catch (error: any) {
        // Don't block submission, just log the error.
        console.error("AI classification failed:", error.message);
      }
    }

    // 2. Upload photo to ImgBB if it exists
    let photoURL = "";
    if (values.photoDataUri) {
      const apiKey = process.env.IMGBB_API_KEY;
      if (!apiKey) {
        // Don't throw an error, just log it. The complaint can still be created.
        console.error("ImgBB API key is not configured. Proceeding without image upload.");
      } else {
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
    
          if (response.data.success && response.data.data.url) {
            photoURL = response.data.data.url;
          } else {
            console.error("Image upload to ImgBB failed. Proceeding without image URL.", response.data);
          }
      }
    }

    // 3. Create complaint document
    const complaintData = {
      userId: values.userId,
      userName: values.userName,
      title: values.title,
      description: values.description,
      location: {
        lat: values.latitude || 0,
        long: values.longitude || 0,
        address: values.address,
      },
      category: category,
      photoURL: photoURL,
      status: "Pending" as const,
      timestamp: serverTimestamp(),
    };

    const complaintRef = await addDoc(collection(db, "complaints"), complaintData);

    // 4. AI Duplicate Detection if photo exists and key is present
    if (values.photoDataUri && hasGeminiKey && values.latitude && values.longitude) {
      try {
        const duplicateResult = await detectDuplicateIssue({
          photoDataUri: values.photoDataUri,
          latitude: values.latitude,
          longitude: values.longitude,
          complaintId: complaintRef.id,
        });

        if (duplicateResult.isDuplicate && duplicateResult.duplicateComplaintId) {
          await updateDoc(complaintRef, {
            duplicateOf: duplicateResult.duplicateComplaintId,
            status: "Resolved"
          });
        }
      } catch (error: any) {
         // Don't block submission, just log the error.
        console.error("AI duplicate detection failed:", error.message);
      }
    }

    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    return { success: true, id: complaintRef.id };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error("Failed to create complaint:", errorMessage)
    return { error: `Failed to create complaint: ${errorMessage}` };
  }
}

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function adminLogin(values: z.infer<typeof adminLoginSchema>) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userProfile = userDoc.data() as UserProfile;
      if (userProfile.role === 'admin') {
        return { success: true };
      }
    }
    
    // If we reach here, the user is not an admin or has no profile.
    // Sign them out to be safe and return an error.
    await auth.signOut();
    return { success: false, error: "You are not authorized to access this page." };

  } catch (error: any) {
    // Handle incorrect password, user not found in Auth, etc.
    return { success: false, error: "Invalid email or password." };
  }
}


export async function updateComplaintStatus(complaintId: string, status: ComplaintStatus) {
    try {
        const complaintRef = doc(db, "complaints", complaintId);
        await updateDoc(complaintRef, { status });
        revalidatePath("/");
        revalidatePath("/admin/dashboard");
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
