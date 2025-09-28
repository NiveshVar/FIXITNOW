
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
import { signInWithEmailAndPassword, signOut } from "firebase/auth";


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
    
    // 3. Determine district from coordinates
    let district = 'Unknown';
    if (values.latitude && values.longitude) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${values.latitude}&lon=${values.longitude}`);
            const data = await response.json();
            // This is a best-effort guess, Nominatim address components can vary.
            // Common keys for district are 'county', 'state_district', etc.
            district = data.address?.county || data.address?.state_district || data.address?.city_district || 'Unknown';
        } catch (error) {
            console.error("Reverse geocoding failed:", error);
        }
    }


    // 4. Create complaint document
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
      district: district,
      category: category,
      photoURL: photoURL,
      status: "Pending" as const,
      timestamp: serverTimestamp(),
    };

    const complaintRef = await addDoc(collection(db, "complaints"), complaintData);

    // 5. AI Duplicate Detection if photo exists and key is present
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
    revalidatePath("/admin/dashboard/map-view");
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

type AdminLoginSuccess = { success: true; profile: UserProfile };
type AdminLoginError = { success: false; error: string; profile?: null };
type AdminLoginResult = AdminLoginSuccess | AdminLoginError;


export async function adminLogin(values: z.infer<typeof adminLoginSchema>): Promise<AdminLoginResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userProfile = userDoc.data() as UserProfile;
      if (userProfile.role === 'admin' || userProfile.role === 'super-admin') {
        return { success: true, profile: userProfile };
      }
    }
    
    // Explicitly sign out non-admins to prevent session confusion
    await signOut(auth);
    return { success: false, error: "You are not authorized to access this page." };

  } catch (error: any) {
    // Handle generic errors like wrong password
    return { success: false, error: "Invalid email or password." };
  }
}


export async function updateComplaintStatus(complaintId: string, status: ComplaintStatus) {
    try {
        const complaintRef = doc(db, "complaints", complaintId);
        await updateDoc(complaintRef, { status });

        // Add a notification for the user
        const complaintDoc = await getDoc(complaintRef);
        if (complaintDoc.exists()) {
            const complaintData = complaintDoc.data();
            await addDoc(collection(db, "notifications"), {
                userId: complaintData.userId,
                complaintId: complaintId,
                complaintTitle: complaintData.title,
                message: `The status of your complaint "${complaintData.title}" has been updated to "${status}".`,
                isRead: false,
                timestamp: serverTimestamp(),
            });
        }

        revalidatePath("/");
        revalidatePath("/admin/dashboard");
        revalidatePath("/admin/dashboard/map-view");
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

export async function markNotificationsAsRead(userId: string) {
    try {
        const notificationsRef = collection(db, "notifications");
        const q = query(notificationsRef, where("userId", "==", userId), where("isRead", "==", false));
        const querySnapshot = await getDocs(q);
        
        const batch = [];
        querySnapshot.forEach((doc) => {
            batch.push(updateDoc(doc.ref, { isRead: true }));
        });

        await Promise.all(batch);
        revalidatePath('/');
        return { success: true };

    } catch (error: any) {
        return { error: error.message };
    }
}
