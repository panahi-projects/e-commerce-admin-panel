# Prompt: Implement Profile Section UI

## Context

You are implementing the **Profile** section of an admin panel frontend.
The project is already built — do **not** introduce new UI libraries, design tokens, component styles, or utility classes that don't already exist in the codebase. Match everything (spacing, typography, colors, button variants, input styles, card styles, modal/dialog patterns, badge/chip styles) to what is already used across the project.

Before writing any code, **scan the existing codebase** for:
- The modal/dialog component already in use (e.g. `Dialog`, `Modal`, `Sheet`, or a custom component)
- The card/panel component pattern
- Button variants (`primary`, `danger`, `ghost`, `outline`, etc.)
- Form field patterns (label + input wrappers)
- Badge/chip components
- Tab/navigation patterns
- How API calls are made (fetch wrapper, axios instance, react-query, SWR, etc.)
- How loading and error states are handled
- The existing icon library in use

---

## Route & File Structure

Create or update the following files (adjust paths to match the project's conventions):

```
pages/settings/profile/           (or app/settings/profile/ for Next.js App Router)
  index.tsx              — main profile page (tab shell)
  
components/profile/
  PersonalInfoTab.tsx    — tab 1: personal info + verification status
  AddressesTab.tsx       — tab 2: address list
  SecurityTab.tsx        — tab 3: security settings
  SessionsTab.tsx        — tab 4: active sessions (optional, see below)
  
  modals/
    EditInfoModal.tsx
    AddAddressModal.tsx
    EditAddressModal.tsx
    ChangePasswordModal.tsx
    SetPasswordModal.tsx
    ForgotPasswordModal.tsx
    Enable2FAModal.tsx
    Disable2FAModal.tsx
    LogoutConfirmModal.tsx
    LogoutAllConfirmModal.tsx
```

---

## API Endpoints

All calls go through the project's existing HTTP client. Do **not** hardcode base URLs.

| Method   | Endpoint                            | Used in                   |
|----------|-------------------------------------|---------------------------|
| GET      | `/api/v1/profile`                   | Page load, refresh        |
| PATCH    | `/api/v1/profile`                   | `EditInfoModal`           |
| GET      | `/api/v1/profile/addresses`         | `AddressesTab`            |
| POST     | `/api/v1/profile/addresses`         | `AddAddressModal`         |
| PATCH    | `/api/v1/profile/addresses/{id}`    | `EditAddressModal`        |
| DELETE   | `/api/v1/profile/addresses/{id}`    | Address card delete       |
| POST     | `/api/v1/auth/forgot-password`      | `ForgotPasswordModal`     |
| POST     | `/api/v1/auth/change-password`      | `ChangePasswordModal`     |
| POST     | `/api/v1/auth/set-password`         | `SetPasswordModal`        |
| POST     | `/api/v1/auth/2fa/enable`           | `Enable2FAModal` step 1   |
| POST     | `/api/v1/auth/2fa/confirm`          | `Enable2FAModal` step 2   |
| POST     | `/api/v1/auth/2fa/disable`          | `Disable2FAModal`         |
| POST     | `/api/v1/auth/logout`               | `LogoutConfirmModal`      |
| POST     | `/api/v1/auth/logout-all`           | `LogoutAllConfirmModal`   |

### GET /api/v1/profile — response shape

```ts
interface ProfileResponse {
  success: boolean;
  statusCode: number;
  data: {
    _id: string;
    email: string;
    tenantId: string | null;
    role: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isTwoFactorEnabled: boolean;
    isActive: boolean;
    isDeleted: boolean;
    firstName: string;
    lastName: string;
    phone: string;
    wishlist: unknown[];
    addresses: Address[];
    createdAt: string;
    updatedAt: string;
  };
}

interface Address {
  _id: string;
  label: string;
  fullName: string;
  phone?: string;
  line1?: string;
  line2?: string;
  fullAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}
```

### PATCH /api/v1/profile — request body
```ts
{ firstName: string; lastName: string; phone: string; }
```

### POST /api/v1/profile/addresses — request body
```ts
{
  label: string;
  fullName: string;
  phone?: string;
  line1?: string;
  line2?: string;
  fullAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;   // ISO 2-letter code, e.g. "ir"
  isDefault: boolean;
}
```

### POST /api/v1/auth/forgot-password — request body

```javascript
import { request } from 'undici'

const { statusCode, body } = await request('/api/v1/auth/forgot-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    identifier: ''
  })
})
```

> Note: the field is `identifier` (e.g. email or phone), **not** `email`. No `Authorization` header required.

### POST /api/v1/auth/change-password — request body

```javascript
import { request } from 'undici'

const { statusCode, body } = await request('/api/v1/auth/change-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer...'
  },
  body: JSON.stringify({
    currentPassword: '',
    newPassword: ''
  })
})
```

> Note: there is **no `confirmPassword` field in the request body** — `confirmNewPassword` is a client-side-only validation field and must NOT be sent to the API.

### POST /api/v1/auth/set-password — request body

```javascript
const { statusCode, body } = await request('/api/v1/auth/set-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ...'
  },
  body: JSON.stringify({
    newPassword: ''
  })
})
```

> Note: only `newPassword` is sent. `confirmPassword` (if collected in the form) is client-side-only validation and must NOT be sent to the API.

### POST /api/v1/auth/2fa/enable — request body

```javascript
const { statusCode, body } = await request('/api/v1/auth/2fa/enable', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ...'
  },
  body: JSON.stringify({
    channel: 'email'
  })
})
```

> Note: this is an **email-based OTP flow, not TOTP/QR-code based**. The body is `{ channel: 'email' }`.

### POST /api/v1/auth/2fa/confirm — request body

```javascript
import { request } from 'undici'

const { statusCode, body } = await request('/api/v1/auth/2fa/confirm', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ...'
  },
  body: JSON.stringify({
    code: ''
  })
})
```

### POST /api/v1/auth/2fa/disable

```javascript
import { request } from 'undici'

const { statusCode, body } = await request('/api/v1/auth/2fa/disable', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer...'
  }
})
```

> Note: this endpoint takes **no request body** at all — no confirmation code is sent.

### POST /api/v1/auth/logout-all

```javascript
const { statusCode, body } = await request('/api/v1/auth/logout-all', {
  method: 'POST',
  headers: {
    Authorization: ''
  }
})
```

> Note: this endpoint takes **no request body** — only the `Authorization` header is required.

---

## Page Layout

The profile page lives inside the existing admin panel shell (sidebar + topbar already rendered by a layout component). **Do not re-render the sidebar or topbar.**

The page content area contains:

1. **Tab bar** — 4 tabs: `Personal info`, `Addresses`, `Security`, `Sessions`
2. **Tab panel** — renders the active tab's content below

Use the project's existing tab component if one exists. Otherwise implement a simple but generic controlled tab state with `useState`.

---

## Tab 1 — Personal info

**Layout:**
- Avatar circle at top-left showing user initials (derived from `firstName + lastName`), with name and role label beside it
- **Basic info card** — displays `firstName`, `lastName`, `phone`, `role` (role is read-only, no edit). An **Edit** button opens `EditInfoModal`
- **Contact & verification card** — shows `email` and `phone` each with a verified/unverified badge derived from `isEmailVerified` / `isPhoneVerified`

**`EditInfoModal`:**
- Fields: `firstName`, `lastName`, `phone`
- On submit: PATCH `/api/v1/profile`
- On success: close modal, refetch profile data, show success toast/notification (use project's existing toast pattern)
- Validation: all three fields required

---

## Tab 2 — Addresses

**Layout:**
- Section header with an **Add address** button (primary variant) top-right
- List of address cards, one per address. The default address card is visually distinguished (accent border or background — match the project's existing "highlighted card" or "selected item" pattern)
- Each card shows: `label`, `fullName`, `fullAddress`, `city`, `state`, `postalCode`, `country`, `isDefault` badge if applicable
- Each card has action buttons: **Edit** (opens `EditAddressModal`), **Delete** (opens inline confirmation or `DeleteConfirmModal`), **Set as default** (only shown on non-default addresses — calls PATCH with `{ isDefault: true }`)

**`AddAddressModal` / `EditAddressModal`:**
- Fields: `label`, `fullName`, `phone`, `line1`, `line2` (optional), `fullAddress`, `city`, `state`, `postalCode`, `country` (dropdown/select), `isDefault` (checkbox)
- `line2` should be marked optional in the label
- On submit: POST or PATCH the appropriate endpoint
- On success: close modal, refetch addresses list, show success toast

**Delete flow:**
- Show a confirmation dialog before calling DELETE `/api/v1/profile/addresses/{id}`
- Do not allow deleting the default address without setting another as default first (show an error if attempted)

---

## Tab 3 — Security

Three action rows inside a card:

| Row | Label | Description | Action |
|-----|-------|-------------|--------|
| Password | "Password" | "Last changed …" (use `updatedAt` as proxy if no dedicated field) | **Change** button → `ChangePasswordModal`. Include a "Forgot password?" link → `ForgotPasswordModal` |
| Set password | "Set password" | "Set a password if you signed up via OAuth" | **Set password** button → `SetPasswordModal` |
| 2FA | "Two-factor authentication" | "Add an extra layer of security via email" | Shows current status badge + **Enable** or **Disable** button based on `isTwoFactorEnabled` |

**`ForgotPasswordModal`:**
- Field: `identifier` (email or phone — match whatever the project uses to identify the account)
- Calls POST `/api/v1/auth/forgot-password` with `{ identifier: string }`
- No `Authorization` header required
- On success: show a confirmation message (e.g. "If an account exists, a reset link/code has been sent") and close modal

**`ChangePasswordModal`:**
- Fields shown in form: `currentPassword`, `newPassword`, `confirmNewPassword`
- Client-side validation: `newPassword === confirmNewPassword`
- Calls POST `/api/v1/auth/change-password` with body `{ currentPassword, newPassword }` — **`confirmNewPassword` is NOT sent to the API**

**`SetPasswordModal`:**
- Fields shown in form: `newPassword`, `confirmPassword`
- Client-side validation: `newPassword === confirmPassword`
- Calls POST `/api/v1/auth/set-password` with body `{ newPassword }` — **`confirmPassword` is NOT sent to the API**

**`Enable2FAModal` (2-step flow, email-based OTP):**
- Step 1: Call POST `/api/v1/auth/2fa/enable` with body `{ channel: 'email' }`. On success, show a message that a verification code has been sent to the user's email
- Step 2: Input field for the verification code, call POST `/api/v1/auth/2fa/confirm` with body `{ code: string }`
- On success: close modal, refetch profile, update the 2FA status badge
- Note: there is **no QR code or TOTP secret** — do not render a QR code image

**`Disable2FAModal`:**
- Warning banner: "Disabling 2FA reduces your account security"
- Calls POST `/api/v1/auth/2fa/disable` with **no request body**
- On success: close modal, refetch profile

**Danger zone** — a second card beneath the security card:
- **Logout this device** button → `LogoutConfirmModal` → POST `/api/v1/auth/logout`
- **Logout all devices** button (danger variant) → `LogoutAllConfirmModal` → POST `/api/v1/auth/logout-all` with **no request body** (only the `Authorization` header)
- After either logout, redirect to the login page

---

## Tab 4 — Sessions (optional / implement it even if the API is not available, and mock the data I will replace later with real api)

If the API exposes session/device data:
- List active sessions with device icon, browser/OS name, location, IP, last active timestamp
- Current session is badged
- Each non-current session has a **Revoke** button
- Footer action: **Logout all other sessions** → POST `/api/v1/auth/logout-all`

If no session list API exists, show an empty state image in the middle of the page, with a short text.

---

## Modal UX Rules

Apply these rules to every modal in this feature:

1. Use the **existing modal/dialog component** in the project — do not build a new one
2. Clicking the backdrop closes the modal (unless a form is dirty — optionally warn)
3. While a request is in-flight, disable the submit button and show a loading indicator (spinner or button loading state — match the project pattern)
4. On API error, show the error message from the response body inside the modal (not just a generic toast), near the submit button
5. On API success, close the modal and trigger the relevant data refetch
6. Destructive modals (delete address, disable 2FA, logout all) must use a **danger-variant** confirm button
7. For any client-side-only fields (e.g. `confirmNewPassword`, `confirmPassword`), strip them from the payload before calling the API — never forward them to the backend

---

## State & Data Fetching

- Fetch profile data once on page mount and store it in component state (or a query cache if the project uses react-query / SWR)
- After any successful mutation, refetch the relevant data:
  - Profile mutations → refetch `GET /profile`
  - Address mutations → refetch `GET /profile/addresses` (or the addresses array from profile)
- Do not optimistically update the UI for destructive actions (delete, disable 2FA, logout)

---

## Loading & Error States

- Show the project's existing **skeleton loader** or **spinner** while `GET /profile` is loading
- Show the project's existing **error state** component if the request fails, with a retry button
- For address list: show an **empty state** (illustration or message) if no addresses exist yet, with a prompt to add the first one

---

## Accessibility

- All modals must trap focus while open and restore focus to the trigger element on close
- Form fields must have associated `<label>` elements (or `aria-label`)
- Icon-only buttons must have `aria-label`
- The 2FA confirmation code input should have `inputMode="numeric"`
- The verified/unverified badges must not rely on color alone — include a checkmark or warning icon

---

## What NOT to do

- Do not install new packages
- Do apply internationalization (i18n) for any texts that is from the client side
- Do not create new global CSS classes or design tokens
- Do not build a custom modal from scratch if the project already has one
- Do not hardcode colors, font sizes, or spacing values — use whatever the project's existing system provides
- Do not change the admin layout, sidebar, or topbar
- Do not redirect away from the profile page on successful edits (except logout actions)
- Do not send client-side-only confirmation fields (`confirmNewPassword`, `confirmPassword`) to the API
- Do not implement 2FA as a QR-code/TOTP flow — it is email-OTP based