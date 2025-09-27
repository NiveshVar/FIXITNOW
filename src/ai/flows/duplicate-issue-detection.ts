'use server';

/**
 * @fileOverview A flow for detecting duplicate issue reports based on image similarity and GPS proximity.
 *
 * - detectDuplicateIssue - A function that handles the duplicate issue detection process.
 * - DetectDuplicateIssueInput - The input type for the detectDuplicateIssue function.
 * - DetectDuplicateIssueOutput - The return type for the detectDuplicateIssue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectDuplicateIssueInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the issue, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  latitude: z.number().describe('The latitude of the issue location.'),
  longitude: z.number().describe('The longitude of the issue location.'),
  complaintId: z.string().describe('The ID of the complaint being checked.'),
});
export type DetectDuplicateIssueInput = z.infer<
  typeof DetectDuplicateIssueInputSchema
>;

const DetectDuplicateIssueOutputSchema = z.object({
  isDuplicate: z.boolean().describe('Whether the issue is a duplicate.'),
  duplicateComplaintId:
    z.string()
     .optional()
    .describe('The ID of the duplicate complaint, if any.'),
  reason:
    z.string()
      .optional()
    .describe('The reason for the duplicate detection.'),
});

export type DetectDuplicateIssueOutput = z.infer<
  typeof DetectDuplicateIssueOutputSchema
>;

export async function detectDuplicateIssue(
  input: DetectDuplicateIssueInput
): Promise<DetectDuplicateIssueOutput> {
  return detectDuplicateIssueFlow(input);
}

const detectDuplicateIssuePrompt = ai.definePrompt({
  name: 'detectDuplicateIssuePrompt',
  input: {schema: DetectDuplicateIssueInputSchema},
  output: {schema: DetectDuplicateIssueOutputSchema},
  prompt: `You are an expert system for detecting duplicate issue reports.

  Given a new issue report with a photo, latitude, longitude and a complaint ID, you will analyze if it's a duplicate of existing reports.

  Consider image similarity and GPS proximity to determine if the issue has already been reported. Pay close attention to the location and ensure reported issue is in close proximity to another reported issue. The GPS coordinates provided are very accurate and should be taken into account.

  Return whether the issue is a duplicate, and if so, the ID of the duplicate complaint and the reason for the determination.

  Photo: {{media url=photoDataUri}}
  Latitude: {{{latitude}}}
  Longitude: {{{longitude}}}
  Complaint ID: {{{complaintId}}}
  `,
});

const detectDuplicateIssueFlow = ai.defineFlow(
  {
    name: 'detectDuplicateIssueFlow',
    inputSchema: DetectDuplicateIssueInputSchema,
    outputSchema: DetectDuplicateIssueOutputSchema,
  },
  async input => {
    const {output} = await detectDuplicateIssuePrompt(input);
    return output!;
  }
);
