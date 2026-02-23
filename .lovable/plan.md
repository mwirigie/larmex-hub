

# JengaHub - Kenya's Construction Marketplace

## Overview
A mobile-first marketplace connecting Kenyan homebuilders with house plans and verified construction professionals (architects & engineers). Clean, professional design with trust-building elements.

## Backend: Lovable Cloud (Supabase)
- PostgreSQL database with full RLS security
- Supabase Auth (Email + Google OAuth + Phone OTP)
- Supabase Storage for plans, portfolios, verification documents
- Edge functions for payment processing and verification workflows

---

## Phase 1: Foundation & Authentication

### User Registration & Login
- Email/password, Google OAuth, and phone OTP sign-in
- Role selection during signup: **Client** or **Professional** (Architect/Engineer)
- Profile creation with relevant fields per role
- Secure role-based access using a separate `user_roles` table

### Database Schema
- `profiles` – user info, avatar, phone, location
- `user_roles` – role management (client, professional, admin)
- `professional_profiles` – license info, specialization, verification status, bio
- `house_plans` – title, description, bedrooms, land size, price, images, PDF, status
- `plan_purchases` – purchase records linked to payment
- `favorites` – saved plans per user
- `project_requests` – custom design requests from clients
- `reviews` – client reviews of professionals
- `messages` – chat between clients and professionals
- `verification_documents` – ID/license uploads for admin review
- `transactions` – payment records with commission tracking

---

## Phase 2: Plan Marketplace

### Browse & Search Plans
- Card-based grid layout with plan thumbnails
- Filter by: bedrooms, land size, budget range, house type, county
- Sort by: price, popularity, newest
- Watermarked preview images (full resolution after purchase)

### Plan Detail Page
- Image gallery with watermarked previews
- Floor plan details: bedrooms, bathrooms, area, land size compatibility
- Price display in KES
- Architect/engineer info with verification badge
- "Purchase Plan" and "Save to Favorites" actions
- Related plans section

### Purchase Flow
- Plan selection → Payment (M-Pesa integration via edge function) → Digital unlock
- Payment confirmation triggers access to full PDF/files
- Purchase history in client dashboard

---

## Phase 3: Professional Profiles & Verification

### Professional Onboarding
- Portfolio upload (images, PDFs)
- License/certification document upload
- Specialization selection (residential, commercial, structural, etc.)
- Service area (Kenyan counties)
- Pricing information

### Verification Workflow
- Document upload → Pending review status
- Admin approves/rejects (handled in admin panel)
- Verified badge displayed on profile
- Only verified professionals can list plans or receive project requests

### Professional Dashboard
- Uploaded plans with status (pending/approved/rejected)
- Incoming project requests
- Earnings overview (sales, commission deducted, withdrawals)
- Messages from clients
- Profile analytics (views, inquiries)

---

## Phase 4: Client Dashboard & Features

### Client Dashboard
- Active projects overview
- Purchased plans with download access
- Saved/favorite plans
- Payment history
- Messages with professionals

### Hire a Professional
- Browse verified professionals by specialization and location
- View portfolio and reviews
- Send project request with details (land size, budget, requirements)
- In-app messaging

### Reviews & Ratings
- Clients can rate and review professionals after project completion
- Star rating + written review
- Display on professional profiles

---

## Phase 5: Cost Calculator

### Dynamic Estimation Tool
- Input: land size (50x100, 1/8 acre, etc.), house type, material category
- Region multiplier by Kenyan county
- Detailed cost breakdown:
  - Foundation
  - Structure/Walling
  - Roofing
  - Finishing (plumbing, electrical, painting)
  - Labor
  - Professional fees
- Save estimate to dashboard
- Option to "Find professionals for this project"

---

## Phase 6: Messaging System

### In-App Chat
- Real-time messaging between clients and professionals
- Message threads per project/inquiry
- Notification indicators
- Message history in dashboard

---

## Mobile-First Design

- Bottom navigation bar (Home, Browse, Calculator, Projects, Profile)
- Card-based layouts throughout
- Sticky action buttons on detail pages
- Smooth page transitions
- Trust elements: verification badges, review stars, secure payment icons
- Clean typography with professional color palette (neutral tones with accent color)

---

## Admin Panel (Separate Project)

> Will be built as a separate Lovable project sharing the same Supabase backend

- Professional verification approval/rejection
- House plan moderation
- User management
- Commission settings
- Analytics dashboard (revenue, users, sales, top professionals)
- Activity logs and fraud flags

---

## Security Measures
- Row-Level Security on all tables
- Watermarked plan previews; full files in private storage buckets
- Verification document storage in private buckets
- Rate limiting on auth endpoints
- Role-based route protection
- Secure payment processing via edge functions

---

## Payment Integration (M-Pesa)
- Edge function to handle M-Pesa STK Push via a provider like IntaSend or Safaricom Daraja API
- Payment confirmation webhook
- Commission deduction logic
- Transaction records with status tracking
- *Note: You'll need to set up an M-Pesa business account/payment provider — we'll guide you through this when we implement payments*

