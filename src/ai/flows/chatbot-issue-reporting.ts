'use server';

/**
 * @fileOverview Implements a chatbot flow for reporting issues using natural language.
 *
 * - chatbotIssueReporting - A function that processes user input from a chatbot and creates a complaint report.
 * - ChatbotIssueReportingInput - The input type for the chatbotIssueReporting function.
 * - ChatbotIssueReportingOutput - The return type for the chatbotIssueReporting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatbotIssueReportingInputSchema = z.object({
  userInput: z.string().describe('The user input from the chatbot.'),
});
export type ChatbotIssueReportingInput = z.infer<typeof ChatbotIssueReportingInputSchema>;

const ChatbotIssueReportingOutputSchema = z.object({
  description: z.string().describe('A detailed description of the issue, summarized from the user\'s input.'),
});
export type ChatbotIssueReportingOutput = z.infer<typeof ChatbotIssueReportingOutputSchema>;

export async function chatbotIssueReporting(input: ChatbotIssueReportingInput): Promise<ChatbotIssueReportingOutput> {
  return chatbotIssueReportingFlow(input);
}

const chatbotIssueReportingPrompt = ai.definePrompt({
  name: 'chatbotIssueReportingPrompt',
  input: {schema: ChatbotIssueReportingInputSchema},
  output: {schema: ChatbotIssueReportingOutputSchema},
  prompt: `You are a chatbot assistant. A user has provided the following text describing a community issue. Your task is to rephrase their input into a clear and concise description of the problem. Do not add any information that is not present in the user's input.

User Input: {{{userInput}}}`,
});

const chatbotIssueReportingFlow = ai.defineFlow(
  {
    name: 'chatbotIssueReportingFlow',
    inputSchema: ChatbotIssueReportingInputSchema,
    outputSchema: ChatbotIssueReportingOutputSchema,
  },
  async input => {
    const {output} = await chatbotIssueReportingPrompt(input);
    return output!;
  }
);
