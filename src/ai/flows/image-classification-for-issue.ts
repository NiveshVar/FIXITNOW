'use server';
/**
 * @fileOverview An image classification AI agent that classifies the issue type based on an image.
 *
 * - classifyIssue - A function that handles the image classification process.
 * - ClassifyIssueInput - The input type for the classifyIssue function.
 * - ClassifyIssueOutput - The return type for the classifyIssue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyIssueInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the issue, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ClassifyIssueInput = z.infer<typeof ClassifyIssueInputSchema>;

const ClassifyIssueOutputSchema = z.object({
  category: z
    .enum(['pothole', 'tree fall', 'garbage', 'stray dog'])
    .describe('The category of the issue identified in the image.'),
});
export type ClassifyIssueOutput = z.infer<typeof ClassifyIssueOutputSchema>;

export async function classifyIssue(input: ClassifyIssueInput): Promise<ClassifyIssueOutput> {
  return classifyIssueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyIssuePrompt',
  input: {schema: ClassifyIssueInputSchema},
  output: {schema: ClassifyIssueOutputSchema},
  prompt: `You are an expert in classifying images of community issues.\

  Based on the provided image, determine the most appropriate category for the issue.\
  The possible categories are: pothole, tree fall, garbage, stray dog.\

  Photo: {{media url=photoDataUri}}
  \n  Respond with the category of the issue.\
  `,
});

const classifyIssueFlow = ai.defineFlow(
  {
    name: 'classifyIssueFlow',
    inputSchema: ClassifyIssueInputSchema,
    outputSchema: ClassifyIssueOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
