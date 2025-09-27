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
  category: z.string().describe('The category of the issue (e.g., pothole, tree fall).'),
  locationDescription: z.string().describe('A description of the issue location.'),
  description: z.string().describe('A detailed description of the issue.'),
});
export type ChatbotIssueReportingOutput = z.infer<typeof ChatbotIssueReportingOutputSchema>;

export async function chatbotIssueReporting(input: ChatbotIssueReportingInput): Promise<ChatbotIssueReportingOutput> {
  return chatbotIssueReportingFlow(input);
}

const chatbotIssueReportingPrompt = ai.definePrompt({
  name: 'chatbotIssueReportingPrompt',
  input: {schema: ChatbotIssueReportingInputSchema},
  output: {schema: ChatbotIssueReportingOutputSchema},
  prompt: `You are a chatbot designed to help users report issues in their community. Extract the issue category, location description, and a detailed description from the user input.

The issue category should be one of the following: pothole, tree fall, garbage, stray dog. If the category is not clear from the input, default to 'other'.

Provide the location as a readable description. If the location is not mentioned, respond with "N/A".

Provide a detailed description of the issue. If the description is not clear, use the original user input as the description.

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
