# EPF Toolbox: Implementation Roadmap

## Phase 1: Foundation (Weeks 1-2) — Quick Wins

Focus on extracting shared patterns and reducing duplication.

### 1.1 Centralize Constants

**File to create:** `/lib/constants.ts`

```typescript
// CRM Constants
export const CRM_STORAGE_KEYS = {
  CLIENTS: "epf.crm.clients",
  AUTH: "epf.crm.unlocked",
  ACCESS_MODE: "epf.crm.accessMode",
  SETTINGS: "epf.crm.settings",
};

export const CRM_LEAD_STATUSES = [
  "New Lead",
  "Contacted",
  "Estimate Booked",
  "Estimate Sent",
  "Follow-Up",
  "Won",
  "Lost",
];

export const CRM_PROJECT_STATUSES = [
  "Not Scheduled",
  "Scheduled",
  "In Progress",
  "Completed",
];

export const CRM_PAYMENT_STATUSES = [
  "No Invoice",
  "Deposit Due",
  "Deposit Paid",
  "Balance Due",
  "Paid",
];

export const CRM_SOURCES = [
  "phone",
  "email",
  "website",
  "referral",
  "manual",
  "paste",
  "voicemail",
];

export const CRM_WORK_NEEDED = [
  "Popcorn ceiling removal",
  "Knockdown ceiling texture",
  "Ceiling texture repair",
  "Ceiling skim coat",
  "Drywall repair",
  "Drywall installation",
  "Interior painting",
  "Wallpaper removal",
  "Other",
];

export const CRM_PAYMENT_METHODS = ["Cash", "e-Transfer", "Check"];

export const CRM_COMMUNICATION_RESULTS = [
  "Called - No Answer",
  "Text Sent",
  "Email Sent",
  "Client Replied",
  "Appointment Booked",
  "Estimate Sent",
];

// Estimate Builder Constants
export const ESTIMATE_STORAGE_KEYS = {
  STATE: "epf.estimateState.v2",
  LIST: "epf.eslist",
  COUNTER: "epf.es.counter",
  CUSTOM_SERVICES: "epf.customServices.v1",
  SERVICE_OVERRIDES: "epf.serviceOverrides.v1",
};

// Update references in files to use these constants
```

**Files to update:**

- `/app/crm/page.jsx` → Replace hardcoded arrays with imports
- `/app/estimate-builder/page.jsx` → Replace hardcoded arrays

**Time estimate:** 1-2 hours

### 1.2 Create Base UI Components

**Directory to create:** `/components/ui/`

Priority components:

```javascript
// /components/ui/Button.jsx
import clsx from "clsx";

export function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  children,
  ...props
}) {
  const baseStyles =
    "font-medium transition-colors rounded focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-blue-600 hover:bg-blue-50",
  };
  const sizes = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
```

```javascript
// /components/ui/Input.jsx
import clsx from "clsx";

export function Input({ label, error, required, ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        {...props}
        className={clsx(
          "w-full px-3 py-2 border rounded-md text-sm",
          "border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
          error && "border-red-500 bg-red-50",
        )}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

```javascript
// /components/ui/Card.jsx
export function Card({ className, children, ...props }) {
  return (
    <div
      className={`border border-slate-300 bg-white shadow-md shadow-slate-300/50 rounded-lg p-4 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
```

```javascript
// /components/ui/Select.jsx
import clsx from "clsx";

export function Select({ label, error, options, required, ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        {...props}
        className={clsx(
          "w-full px-3 py-2 border rounded-md text-sm",
          "border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
          error && "border-red-500 bg-red-50",
        )}
      >
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

**Time estimate:** 2-3 hours

### 1.3 Add Tailwind Component Classes

**File to update:** `/app/globals.css`

```css
@layer components {
  .crm-panel {
    @apply border border-slate-300 bg-white shadow-md shadow-slate-300/50 rounded-lg;
  }

  .crm-card {
    @apply crm-panel p-4;
  }

  .form-group {
    @apply space-y-2 mb-4;
  }

  .form-row {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4 mb-4;
  }

  .badge {
    @apply inline-block px-2 py-1 text-xs font-medium rounded-full;
  }

  .badge-info {
    @apply badge bg-blue-100 text-blue-800;
  }

  .badge-success {
    @apply badge bg-green-100 text-green-800;
  }

  .badge-warning {
    @apply badge bg-yellow-100 text-yellow-800;
  }

  .badge-danger {
    @apply badge bg-red-100 text-red-800;
  }
}
```

**Time estimate:** 30 minutes

### 1.4 Create Custom Hooks

**Directory to create:** `/lib/hooks/`

```javascript
// /lib/hooks/useLocalStorage.js
import { useState, useCallback, useEffect } from "react";

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item =
        typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error storing ${key}:`, error);
      }
    },
    [storedValue, key],
  );

  return [storedValue, setValue];
}
```

```javascript
// /lib/hooks/useDebouncedValue.js
import { useEffect, useState } from "react";

export function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

**Time estimate:** 1 hour

---

## Phase 2: Structure & Organization (Weeks 3-4)

### 2.1 Refactor CRM Page Components

Break down `/app/crm/page.jsx` (1500+ lines) into focused components.

**Structure:**

```
/app/crm/
  ├── page.jsx                 (main entry, <100 lines)
  ├── CrmLayout.jsx            (navigation & layout)
  ├── components/
  │   ├── CrmDashboard.jsx     (overview tab)
  │   ├── CrmPipeline.jsx      (pipeline/funnel view)
  │   ├── CrmClientList.jsx    (clients table/grid)
  │   ├── CrmCalendar.jsx      (appointments/timeline)
  │   ├── ClientCard.jsx       (single client display)
  │   ├── ClientForm.jsx       (create/edit form)
  │   ├── LeadModal.jsx        (quick lead add)
  │   └── CrmFilters.jsx       (search/filter UI)
  └── hooks/
      ├── useCrmClients.js
      ├── useCrmAuth.js
      └── useCrmFilters.js
```

**Time estimate:** 12-16 hours (can be done incrementally)

### 2.2 Create API Validation Layer

**File to create:** `/lib/validation.js`

```javascript
// /lib/validation.js
export function validateClient(data) {
  const errors = {};

  if (!data.name?.trim()) {
    errors.name = "Name is required";
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.email = "Invalid email";
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = "Invalid phone";
  }

  if (!["New Lead", "Contacted", ...].includes(data.status)) {
    errors.status = "Invalid status";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^\d{3}-?\d{3}-?\d{4}$/.test(phone);
}
```

**Time estimate:** 2 hours

### 2.3 Environment & Secret Management

**File to create:** `.env.local`

```
# Auth
CRM_PIN_HASH=bcrypt_hash_of_0320
CRM_LIMITED_PIN=bcrypt_hash_of_yehor

# Storage (Cloudflare R2, AWS S3, etc.)
CRM_BUCKET=your_binding_name
INVOICES_BUCKET=your_binding_name

# API
CRM_API_TOKEN=your_secure_token_here
```

**Update:** `/app/page.jsx` to use environment variable instead of hardcoded PIN

**Time estimate:** 1 hour

---

## Phase 3: UX Enhancements (Weeks 5-6)

### 3.1 Add Global Navigation Header

**File to create:** `/components/layout/Header.jsx`

```javascript
export function Header({ title, actions, showBack = false }) {
  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-40">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {showBack && <BackButton />}
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </header>
  );
}
```

### 3.2 Implement Global Search

**File to create:** `/components/GlobalSearch.jsx`

```javascript
export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    // Search across: clients, invoices, estimates
    // Return combined results
  }, []);

  if (!open) return null;

  return (
    <dialog className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl">
        <input
          autoFocus
          placeholder="Search clients, invoices, estimates... (Cmd+K)"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-3 border-b border-slate-200"
        />
        <div className="max-h-96 overflow-y-auto">
          {results.map((result) => (
            <SearchResult key={result.id} result={result} />
          ))}
        </div>
      </div>
    </dialog>
  );
}
```

**Time estimate:** 4 hours

### 3.3 Add Auto-save for Forms

**File to create:** `/lib/hooks/useAutoSave.js`

```javascript
export function useAutoSave(data, onSave, delay = 5000) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      onSave(data);
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [data, delay, onSave]);
}
```

**Time estimate:** 2 hours

---

## Phase 4: Performance & Scalability (Weeks 7-8)

### 4.1 Implement IndexedDB for Large Datasets

**File to create:** `/lib/db.js`

```javascript
// Use idb library: https://www.npmjs.com/package/idb
import { openDB } from "idb";

export async function getDB() {
  return openDB("epf-toolbox", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("clients")) {
        db.createObjectStore("clients", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("invoices")) {
        db.createObjectStore("invoices", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("estimates")) {
        db.createObjectStore("estimates", { keyPath: "id" });
      }
    },
  });
}

export async function getClients() {
  const db = await getDB();
  return db.getAll("clients");
}

export async function saveClient(client) {
  const db = await getDB();
  return db.put("clients", client);
}
```

**Time estimate:** 4 hours

### 4.2 Add Image Optimization

**File to update:** `/next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    optimizePackages: ["sharp"],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
```

**Time estimate:** 1 hour

---

## Phase 5: Type Safety & Testing (Weeks 9-10)

### 5.1 Gradual TypeScript Migration

Start with new files and gradually migrate existing ones.

**Create:** `jsconfig.json` update or `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
  "exclude": ["node_modules", ".next"]
}
```

### 5.2 Add Basic Unit Tests

**Create:** `/lib/__tests__/validation.test.js`

```javascript
import { validateClient } from "../validation";

describe("validateClient", () => {
  it("should reject empty name", () => {
    const result = validateClient({ name: "" });
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it("should reject invalid email", () => {
    const result = validateClient({ email: "invalid" });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it("should accept valid client", () => {
    const result = validateClient({
      name: "John Doe",
      email: "john@example.com",
      status: "New Lead",
    });
    expect(result.isValid).toBe(true);
  });
});
```

**Time estimate:** 6 hours

---

## Implementation Timeline

| Week      | Focus                           | Estimated Hours |
| --------- | ------------------------------- | --------------- |
| 1-2       | Constants, UI Components, Hooks | 12              |
| 3-4       | CRM Refactor, Validation        | 18              |
| 5-6       | UX Enhancements                 | 8               |
| 7-8       | Performance & IndexedDB         | 5               |
| 9-10      | TypeScript, Testing             | 8               |
| **Total** | **All Phases**                  | **~51 hours**   |

---

## Success Metrics

✅ Code maintainability increases (larger functions broken into <400 lines)
✅ Component reuse improves (10+ UI components used across pages)
✅ Type safety (TypeScript enabled for 80%+ of code)
✅ Performance (LCP < 2.5s, FCP < 1.8s)
✅ Test coverage (>60% of business logic covered)
✅ Developer experience (Setup time < 5 min, build time < 20s)

---

## Notes

- Prioritize **Phase 1** for immediate quality improvements
- **Phase 2-3** improves maintainability and user experience
- **Phase 4-5** are optional but recommended for scalability
- Each phase can be implemented incrementally without breaking production
- Create a new branch for each phase to avoid merge conflicts
