"use server";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
} from "firebase/auth";
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
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { z } from "zod";
import { auth, db, storage } from "@/lib/firebase";
import { classifyIssue } from "@/ai/flows/image-classification-for-issue";
import { detectDuplicateIssue } from "@/ai/flows/duplicate-issue-detection";
import { revalidatePath } from "next/cache";
import { ComplaintStatus } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function handleLogin(values: z.infer<typeof loginSchema>) {
  try {
    await signInWithEmailAndPassword(auth, values.email, values.password);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function handleSignUp(values: z.infer<typeof signupSchema>) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      values.email,
      values.password
    );
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: values.name,
      email: user.email,
      role: "user", // Default role
    });
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function handleGoogleSignIn() {
  const provider = new GoogleAuthProvider();
  try {
    // Using signInWithRedirect is more robust in different environments
    await signInWithRedirect(auth, provider);
    // The user will be redirected to Google's sign-in page.
    // The result is handled in the AuthProvider's useEffect.
    return { success: true };
  } catch (error: any) {
     return { error: error.message };
  }
}

export async function handleLogout() {
  await signOut(auth);
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

    // 2. Create complaint document
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
      photoURL: "",
      status: "Pending" as const,
      timestamp: serverTimestamp(),
    };

    const complaintRef = await addDoc(collection(db, "complaints"), complaintData);

    // 3. Upload photo if it exists
    let photoURL = "";
    if (values.photoDataUri) {
      const storageRef = ref(storage, `complaint_photos/${complaintRef.id}.jpg`);
      await uploadString(storageRef, values.photoDataUri, "data_url");
      photoURL = await getDownloadURL(storageRef);
      await updateDoc(complaintRef, { photoURL });
    }

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
    return { error: error.message };
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
