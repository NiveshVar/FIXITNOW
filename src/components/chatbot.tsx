
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { MessageSquare, Loader2, Send, Sparkles } from "lucide-react";
import { chatbotIssueReporting } from "@/ai/flows/chatbot-issue-reporting";
import { useToast } from "@/hooks/use-toast";
import type { ReportPrefill } from "@/lib/types";


interface ChatbotProps {
    onSubmit: (data: ReportPrefill) => void;
}

export default function Chatbot({ onSubmit }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const result = await chatbotIssueReporting({ userInput: input });
      // Construct the full prefill object
      const prefillData: ReportPrefill = {
        title: "Issue reported by chatbot",
        description: result.description,
        locationDescription: "", // User will fill this
        category: "other", // User will fill this
      };
      onSubmit(prefillData);
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Chatbot Error",
        description: "Could not process your request. Please use the manual form.",
      });
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
            size="icon"
          >
            <MessageSquare className="h-8 w-8" />
            <span className="sr-only">Open Chatbot</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Chatbot Reporting</SheetTitle>
            <SheetDescription>
              Describe the issue you see in plain language, and our AI will do the rest.
              For example: &quot;There is a huge pothole on Elm street near the library, it caused a flat tire.&quot;
            </SheetDescription>
          </SheetHeader>
          <div className="flex-grow" />
          <form onSubmit={handleChatSubmit} className="py-4">
            <div className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="Describe the issue..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
           <SheetFooter>
                <div className="text-xs text-muted-foreground flex items-center justify-center w-full">
                    <Sparkles className="h-3 w-3 mr-1 text-primary"/>
                    Powered by GenAI
                </div>
            </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
