import { config } from 'dotenv';
config();

import '@/ai/flows/chatbot-issue-reporting.ts';
import '@/ai/flows/duplicate-issue-detection.ts';
import '@/ai/flows/image-classification-for-issue.ts';