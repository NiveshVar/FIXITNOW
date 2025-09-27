# **App Name**: FixIt Now

## Core Features:

- Issue Reporting: Users can report new issues by providing a title, description, photo, and location. Reported issues are stored for tracking and resolution.
- Image Classification: Automatically classifies the issue category (pothole, tree fall, garbage, stray dog) based on the uploaded photo, using a pre-trained image classifier tool.
- Duplicate Detection: Checks for duplicate issue reports based on image similarity and GPS proximity to prevent redundant entries. Reports potential duplicates to admins for merging.
- Complaint Tracking: Enables users to track the status of their reported issues, from 'Pending' to 'In Progress' to 'Resolved,' providing transparency and updates.
- Admin Dashboard: Provides administrators with a dashboard to view and manage all reported issues. Admins can sort, filter, and update the status of each complaint.
- Role-Based Access: Controls access to features based on user roles (user/admin), ensuring that only authorized personnel can manage and resolve issues.
- Chatbot Reporting: Users can report issues through a chatbot using natural language. The chatbot extracts key information and automatically creates a complaint.

## Style Guidelines:

- Primary color: HSL 210, 75%, 50% - A vibrant blue (#1AB3FF) to convey trust and efficiency.
- Background color: HSL 210, 20%, 95% - A very light blue (#F0F8FF) to maintain a clean, uncluttered appearance.
- Accent color: HSL 180, 65%, 40% - A deep cyan (#29A3A3) to draw attention to actionable items.
- Font: 'Inter', a sans-serif font, will be used for both headlines and body text, giving a clean and modern look. 
- Use consistent and clear icons from a library like FontAwesome or Material Icons to represent issue categories and actions.
- Implement a responsive, single-page layout with clear sections for reporting, tracking, and administration (role-based).
- Subtle animations will be used when status changes, providing real-time feedback without disrupting the user experience.