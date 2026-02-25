

# In-App Messaging Between Clients and Professionals

## Overview
Build a real-time messaging system that activates once a client sends a project request to a professional. Both parties can then communicate within the context of that project request.

## What Already Exists
- A `messages` table with `sender_id`, `receiver_id`, `content`, `is_read`, `created_at` columns
- RLS policies allowing users to send messages (INSERT where `auth.uid() = sender_id`), view their own messages (SELECT), and mark as read (UPDATE on receiver)
- Dashboard already counts unread messages
- No dedicated messaging UI exists yet

## Plan

### 1. Create a Messages Page (`src/pages/Messages.tsx`)
- Shows a conversation list (threads) grouped by the other party
- Each thread shows the other person's name, last message preview, unread count, and timestamp
- Fetches all messages where the user is sender or receiver, groups by the other user's ID
- Links to individual conversation view

### 2. Create a Conversation Component (`src/pages/Conversation.tsx`)
- Route: `/messages/:userId` where `userId` is the other party
- Shows the full chat history between the current user and the other user
- Input field at the bottom to send new messages
- Auto-scrolls to the latest message
- Marks messages as read when the conversation is opened
- Shows the other user's name and a back button in the header

### 3. Enable Realtime on Messages Table (Database Migration)
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;`
- This allows new messages to appear instantly without page refresh

### 4. Add "Message" Button to Key Touchpoints
- **Professional Dashboard (Requests tab)**: Add a "Message" button on each project request card so professionals can message the client
- **Client Dashboard (Projects tab)**: Add a "Message" button on each project request so clients can message the professional
- **HireProfessional page**: After a hire request is submitted, show a link to message the professional
- **ProfessionalPublicProfile**: Add a "Message" button (only if a project request exists between them)

### 5. Add Messages to Navigation
- Update `MobileNav.tsx`: Replace one nav item or add a Messages icon with unread badge
- Add `/messages` and `/messages/:userId` routes to `App.tsx`

### 6. Real-time Message Updates
- Subscribe to `postgres_changes` on the `messages` table filtered by the current user
- New messages appear instantly in the conversation view
- Unread count updates in the nav/dashboard

## Technical Details

**Conversation grouping query pattern:**
```sql
-- Get all messages involving the user, then group by the other party in JS
SELECT * FROM messages 
WHERE sender_id = :userId OR receiver_id = :userId
ORDER BY created_at DESC
```

**Realtime subscription:**
```typescript
supabase.channel('user-messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `receiver_id=eq.${user.id}`
  }, (payload) => { /* append new message */ })
  .subscribe()
```

**No schema changes needed** except enabling realtime publication. The `messages` table and RLS policies already exist and are correctly configured.

## Files to Create/Edit
- **Create**: `src/pages/Messages.tsx` (conversation list)
- **Create**: `src/pages/Conversation.tsx` (individual chat)
- **Edit**: `src/App.tsx` (add routes)
- **Edit**: `src/components/MobileNav.tsx` (add Messages nav item)
- **Edit**: `src/pages/ProfessionalDashboard.tsx` (add Message button on requests)
- **Edit**: `src/pages/Dashboard.tsx` (add Message button on project requests)
- **Database**: Enable realtime on messages table

