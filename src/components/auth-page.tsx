"use client";
import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { handleLogin, handleSignUp, handleGoogleSignIn } from "@/app/actions";
import { Logo } from "./icons/logo";
import Image from "next/image";
import placeholderImage from "@/lib/placeholder-images.json";
import { auth } from "@/lib/firebase";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Separator } from "./ui/separator";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

const phoneSchema = z.object({
  phone: z.string().refine( (phone) => /^\+[1-9]\d{1,14}$/.test(phone), {
    message: "Invalid phone number. Please use E.164 format (e.g., +14155552671).",
  }),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 digits." }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>Google</title>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-5.07 1.9-4.75 0-8.53-3.8-8.53-8.53s3.8-8.53 8.53-8.53c2.47 0 4.5.95 6.13 2.5l2.73-2.73C19.49 1.12 16.38 0 12.48 0 5.88 0 .04 5.88.04 12.48s5.84 12.48 12.44 12.48c3.55 0 6.42-1.25 8.57-3.48 2.3-2.3 3.3-5.38 3.3-9.15 0-.8-.1-1.48-.25-2.15z" />
  </svg>
);


export default function AuthPage() {
  const { toast } = useToast();
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "+" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            // reCAPTCHA solved, allow sign in
          },
        }
      );
    }
  };

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    const result = await handleLogin(values);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: result.error,
      });
    }
  };

  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    const result = await handleSignUp(values);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: result.error,
      });
    } else {
      toast({
        title: "Sign Up Successful",
        description: "You can now log in with your credentials.",
      });
    }
  };

  const onGoogleSignInClick = async () => {
    const result = await handleGoogleSignIn();
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Google Sign In Failed",
        description: result.error,
      });
    }
  };

  const onPhoneSubmit = async (values: z.infer<typeof phoneSchema>) => {
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(
        auth,
        values.phone,
        appVerifier
      );
      setConfirmationResult(result);
      setIsOtpSent(true);
      toast({
        title: "OTP Sent",
        description: `An OTP has been sent to ${values.phone}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: error.message,
      });
    }
  };

  const onOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    if (!confirmationResult) return;
    try {
      await confirmationResult.confirm(values.otp);
      // User signed in successfully.
      // The onAuthStateChanged listener in AuthProvider will handle the rest.
      toast({
        title: "Login Successful",
        description: "You have been logged in.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid OTP or an error occurred.",
      });
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div id="recaptcha-container"></div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex items-center justify-center gap-2 font-semibold mb-4">
              <Logo className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">FixIt Now</h1>
            </div>
            <p className="text-balance text-muted-foreground">
              Report and track community issues with ease.
            </p>
          </div>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Email</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card className="border-0 shadow-none">
                <CardHeader>
                  <CardTitle className="text-2xl">Welcome Back</CardTitle>
                  <CardDescription>
                    Enter your email below to login to your account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="m@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginForm.formState.isSubmitting}
                      >
                        {loginForm.formState.isSubmitting
                          ? "Logging in..."
                          : "Login with Email"}
                      </Button>
                    </form>
                  </Form>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={onGoogleSignInClick}>
                      <GoogleIcon className="mr-2 h-5 w-5" />
                      Sign in with Google
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="signup">
              <Card className="border-0 shadow-none">
                <CardHeader>
                  <CardTitle className="text-2xl">Create an Account</CardTitle>
                  <CardDescription>
                    Enter your information to create an account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...signupForm}>
                    <form
                      onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={signupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="m@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={signupForm.formState.isSubmitting}
                      >
                        {signupForm.formState.isSubmitting
                          ? "Creating Account..."
                          : "Sign Up"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="phone">
              <Card className="border-0 shadow-none">
                {!isOtpSent ? (
                  <>
                    <CardHeader>
                      <CardTitle className="text-2xl">
                        Sign In with Phone
                      </CardTitle>
                      <CardDescription>
                        Enter your phone number to receive an OTP. This requires a paid Firebase plan.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...phoneForm}>
                        <form
                          onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                          className="space-y-4"
                        >
                          <FormField
                            control={phoneForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="+18005551234"
                                    {...field}
                                  />
                                </FormControl>
                                 <FormDescription>
                                  Must be in E.164 format (e.g., +14155552671)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={phoneForm.formState.isSubmitting}
                          >
                            {phoneForm.formState.isSubmitting
                              ? "Sending OTP..."
                              : "Send OTP"}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </>
                ) : (
                  <>
                    <CardHeader>
                      <CardTitle className="text-2xl">Enter OTP</CardTitle>
                      <CardDescription>
                        Enter the 6-digit code sent to your phone.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...otpForm}>
                        <form
                          onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                          className="space-y-4"
                        >
                          <FormField
                            control={otpForm.control}
                            name="otp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>One-Time Password</FormLabel>
                                <FormControl>
                                  <InputOTP maxLength={6} {...field}>
                                    <InputOTPGroup>
                                      <InputOTPSlot index={0} />
                                      <InputOTPSlot index={1} />
                                      <InputOTPSlot index={2} />
                                      <InputOTPSlot index={3} />
                                      <InputOTPSlot index={4} />
                                      <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                  </InputOTP>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={otpForm.formState.isSubmitting}
                          >
                            {otpForm.formState.isSubmitting
                              ? "Verifying..."
                              : "Verify OTP"}
                          </Button>
                        </form>
                      </Form>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-4 px-0"
                        onClick={() => setIsOtpSent(false)}
                      >
                        Back to phone number entry
                      </Button>
                    </CardContent>
                  </>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        <Image
          src={placeholderImage.placeholderImages[0].imageUrl}
          alt="Community members collaborating"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          data-ai-hint={placeholderImage.placeholderImages[0].imageHint}
        />
      </div>
    </div>
  );
}
