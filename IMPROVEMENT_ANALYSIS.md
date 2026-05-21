# EPF Toolbox: Design & Functionality Improvement Analysis

## Overview

**epf-toolbox** is a Next.js business management app for construction/renovation services with CRM, estimate builders, invoicing, and workflows. Current tech stack: Next.js 16, React 19, Tailwind CSS 4.

---

## 🏗️ **ARCHITECTURE & CODE ORGANIZATION**

### Issues & Recommendations

#### 1. **Monolithic Page Files**

**Problem:** Pages like `crm/page.jsx` and `estimate-builder/page.jsx` are extremely large (1000+ lines), making them difficult to maintain and test.

**Impact:** Harder onboarding, slower refactoring, increased bug surface area.

**Solution:**

```
Extract into modular components:
/app/crm/
  ├── page.jsx           (entry point, <300 lines)
  ├── CrmDashboard.jsx   (main layout)
  ├── CrmPipeline.jsx    (pipeline view)
  ├── CrmClients.jsx     (client list)
  ├── CrmCalendar.jsx    (calendar view)
  └── hooks/
      ├── useCrmClients.js
      ├── useCrmFilters.js
      └── useCrmStorage.js

/app/estimate-builder/
  ├── page.jsx
  ├── EstimateForm.jsx
  ├── RoomCalculator.jsx
  ├── PricePreview.jsx
  └── hooks/
      └── useEstimateState.js
```

#### 2. **Hard-coded Constants Mixed with Logic**

**Problem:** Constants like `leadStatuses`, `paymentMethodOptions`, `workNeededOptions` are defined inside page files.

**Solution:** Create a centralized constants module:

```javascript
// /lib/constants.ts
export const CRM = {
  LEAD_STATUSES: ["New Lead", "Contacted", ...],
  PAYMENT_METHODS: ["Cash", "e-Transfer", ...],
  WORK_NEEDED: ["Popcorn ceiling removal", ...],
  STORAGE_KEYS: {
    CLIENTS: "epf.crm.clients",
    UNLOCKED: "epf.crm.unlocked",
    SETTINGS: "epf.crm.settings",
  },
};

export const ESTIMATE = {
  STORAGE_KEY: "epf.estimateState.v2",
  BRAND_PROFILES: { ... },
  SERVICE_DETAILS: { ... },
};
```

**Benefit:** Single source of truth, easier updates, reduced duplication across files.

---

## 🔐 **STATE MANAGEMENT**

### Issue: localStorage + Manual Sync

**Problem:** All state is localStorage-based with no centralized state management pattern.

- No conflict resolution (concurrent edits from tabs)
- No type safety or validation
- No middleware for logging/debugging
- CRM uses manual serialization (`JSON.parse/stringify` scattered throughout)

**Current Pain Points:**

- Password stored hardcoded (`"0320"`, `"1234"`)
- Clients data synced via POST endpoint but no optimistic updates
- No offline-first strategy despite being critical for field work

**Recommendations:**

1. **Add a Custom Hook + LocalStorage Sync Pattern:**

```javascript
// /hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState(initialValue);

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
    }
  }, []);

  return [storedValue, setValue];
}
```

2. **Consider IndexedDB for Large Datasets:**
   - CRM clients list can grow large
   - Invoices + estimates should be queryable
   - Use `idb` library for simplified API

3. **Add Sync Queue Pattern:**

```javascript
// /lib/syncQueue.ts
class SyncQueue {
  private queue: QueueItem[] = [];

  async enqueue(action: () => Promise<any>) {
    // Track pending changes, retry on failure
  }

  async flush() {
    // Sync all pending changes to backend
  }
}
```

---

## 🎨 **COMPONENT DESIGN**

### Issue 1: Mixed UI Patterns

**Problem:** Custom form inputs, inconsistent styling, hardcoded Tailwind classes scattered throughout.

**Solution: Create a Component Library**

```
/components/ui/
  ├── Button.jsx
  ├── Input.jsx
  ├── Select.jsx
  ├── Modal.jsx
  ├── Card.jsx
  ├── Badge.jsx
  └── Form.jsx

/components/forms/
  ├── ClientForm.jsx      (reusable for edit/create)
  ├── EstimateLineItem.jsx
  ├── LeadStatusPicker.jsx
  └── PaymentForm.jsx
```

**Example: Reusable Input Component**

```javascript
// /components/ui/Input.jsx
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

### Issue 2: Hardcoded Styling

**Problem:** Tailwind classes like `crmPanelClass`, `crmCardClass` repeated throughout.

**Solution:** Use CSS classes in globals.css

```css
/* /app/globals.css */
@layer components {
  .crm-panel {
    @apply border border-slate-300 bg-white shadow-md shadow-slate-300/50 rounded-lg;
  }

  .crm-card {
    @apply border border-slate-300 bg-white shadow-md shadow-slate-300/50 rounded-lg p-4;
  }

  .estimate-line {
    @apply flex gap-2 p-3 border border-slate-200 rounded hover:bg-slate-50 transition;
  }

  .form-group {
    @apply flex flex-col gap-2 mb-4;
  }
}
```

---

## 📱 **USER EXPERIENCE & DAILY WORKFLOW**

### Issue 1: Navigation & Information Architecture

**Problem:** 5 main nav items (Dashboard, Pipeline, Clients, Calendar, Invoices) but some are missing from mobile nav.

**Current Mobile Nav:** Dashboard, Pipeline, Clients, Calendar, Invoices (abbreviated)
**Missing Features:**

- Back button / breadcrumb trail
- Consistent header layout
- Quick action buttons (+ New Lead, + New Estimate)
- Search across all entities

**Recommendations:**

1. **Add Global Header Component:**

```javascript
// /components/layout/Header.jsx
export function Header({ title, subtitle, actions, back }) {
  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 p-4">
      {back && <BackButton href={back} />}
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      {actions && <div className="flex gap-2 mt-3">{actions}</div>}
    </header>
  );
}
```

2. **Implement Global Search:**

```javascript
// /components/GlobalSearch.jsx
// Search across: clients, estimates, invoices
// Keyboard shortcut: Cmd/Ctrl+K
```

3. **Add Breadcrumb Navigation:**

```javascript
// /components/Breadcrumb.jsx
// Home > CRM > Pipeline > Client: John Smith
```

### Issue 2: Form Workflow Friction

**Problem:** Creating/editing clients involves multiple steps but no progress indication or draft saving.

**Solution:**

- Auto-save drafts every 5 seconds
- Show "unsaved changes" indicator
- Add "Save & Add Another" quick action
- Implement undo/redo for complex forms

### Issue 3: Data Visibility & Reporting

**Problem:** No dashboard metrics, pipeline visualization, or reporting.

**Missing Views:**

- Lead conversion funnel chart
- Monthly revenue chart
- Outstanding payments summary
- Job completion rate
- Assigned work by team member

---

## 🔄 **API & BACKEND IMPROVEMENTS**

### Issue 1: Error Handling

**Problem:** API routes lack comprehensive error handling and validation.

**Current:** `route.js` files have minimal error catching

**Solution:**

```javascript
// /lib/api/errorHandler.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }

  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
```

### Issue 2: Input Validation

**Problem:** No schema validation for client data, leads, or invoices.

**Solution:** Use Zod for schema validation

```typescript
// /lib/schemas/client.ts
import { z } from "zod";

export const ClientSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  status: z.enum(["New Lead", "Contacted", ...]),
  createdAt: z.string().datetime().optional(),
});

// /app/api/crm/route.js
export async function POST(req: NextRequest) {
  const data = await req.json();
  const validated = ClientSchema.parse(data); // Throws if invalid
  // ...
}
```

### Issue 3: Authentication

**Problem:** Hardcoded PINs (`"0320"`, `"1234"`, `"yehor"`) in code.

**Security Issues:**

- Visible in source control
- No per-user permissions
- No audit log
- Limited access control (binary: locked/unlocked)

**Solution:**

```javascript
// /lib/auth.ts
export async function verifyPin(pin: string, hashedPin: string) {
  const hash = await bcrypt.hash(pin, 10);
  return bcrypt.compare(pin, hashedPin);
}

// Environment variables
// CRM_PIN_HASH=bcrypt_hash_here
// CRM_ROLES={"yehor": "limited", "admin": "full"}
```

---

## ⚡ **PERFORMANCE IMPROVEMENTS**

### Issue 1: Bundle Size

**Current:** No optimization for large pages

**Solution:**

- Code split by route (Next.js default, but verify)
- Lazy load components on tabs/modals
- Image optimization in `next.config.mjs`
- Tree-shake unused dependencies

### Issue 2: Re-render Optimization

**Problem:** Pages re-render all clients when filtering/searching due to flat state structure.

**Solution:**

```javascript
// Normalize client data
const [clientsById, setClientsById] = useState({});
const [clientIds, setClientIds] = useState([]);

// Filter doesn't mutate, returns new array
const filteredIds = clientIds.filter((id) =>
  matchesFilter(clientsById[id], filter),
);
```

### Issue 3: Form Input Debouncing

**Problem:** Every keystroke triggers recalculation in estimate builder.

**Solution:**

```javascript
// /hooks/useDebouncedState.ts
export function useDebouncedState(initialValue, delay = 300) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return [debouncedValue, setValue];
}
```

---

## 🛡️ **SECURITY CONCERNS**

1. **Secrets in Code**
   - PINs hardcoded
   - API tokens potentially exposed
   - **Fix:** Use environment variables + `.env.local`

2. **Data Storage**
   - localStorage unencrypted
   - Client sensitive data (phone, email) stored locally
   - **Fix:** Encrypt sensitive fields

3. **API Authentication**
   - Bearer token in OpenAPI schema
   - **Fix:** Use API key rotation, implement rate limiting

4. **XSS Vulnerability**
   - Rich text storage without sanitization
   - **Fix:** Use DOMPurify for user inputs

---

## 📦 **PROJECT STRUCTURE REFACTOR**

**Recommended structure:**

```
epf-toolbox/
├── app/
│   ├── (auth)/
│   │   └── unlock/page.jsx
│   ├── (main)/
│   │   ├── dashboard/
│   │   ├── crm/
│   │   ├── estimates/
│   │   ├── invoices/
│   │   └── layout.jsx
│   ├── api/
│   │   ├── crm/
│   │   ├── estimates/
│   │   └── invoices/
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
├── components/
│   ├── ui/
│   ├── forms/
│   ├── crm/
│   ├── estimates/
│   ├── invoices/
│   ├── layout/
│   └── common/
├── lib/
│   ├── api/
│   ├── schemas/
│   ├── hooks/
│   ├── utils/
│   ├── auth/
│   └── constants.ts
├── public/
└── config/
```

---

## 🎯 **QUICK WINS (Priority 1)**

These are easy to implement and provide immediate value:

1. **Extract Constants to `/lib/constants.ts`** (2h)
2. **Create UI Component Library** (4h)
3. **Add Input Validation with Zod** (3h)
4. **Implement Global Search** (3h)
5. **Add Breadcrumb Navigation** (2h)
6. **Create Reusable Form Components** (3h)

---

## 📋 **MEDIUM-TERM IMPROVEMENTS (Priority 2)**

1. **Refactor State Management with IndexedDB** (8h)
2. **Extract Page Components into Smaller Modules** (12h)
3. **Build Dashboard with Metrics** (6h)
4. **Add Image Optimization in next.config** (1h)
5. **Implement Environment-based Secrets** (2h)
6. **Create E2E Tests for CRM Workflows** (10h)

---

## 🚀 **LONG-TERM ENHANCEMENTS (Priority 3)**

1. **TypeScript Migration** (16h)
2. **Database Integration** (PostgreSQL + Prisma)
3. **Real-time Sync** (WebSockets or Server-Sent Events)
4. **Mobile App** (React Native or PWA)
5. **Advanced Reporting & Analytics**
6. **Integration with External Services** (Stripe, Twilio, Calendar APIs)

---

## Summary Table

| Category    | Issue                | Impact              | Effort | Priority |
| ----------- | -------------------- | ------------------- | ------ | -------- |
| Code Org    | Monolithic files     | Maintenance burden  | Medium | High     |
| Code Org    | Hardcoded constants  | Duplication         | Low    | High     |
| State Mgmt  | localStorage only    | Limited scalability | Medium | Medium   |
| UI/UX       | No component library | Inconsistency       | Medium | High     |
| UX          | No global search     | Discovery friction  | Low    | High     |
| UX          | No reporting         | Business blind spot | High   | Medium   |
| Security    | Hardcoded secrets    | Security risk       | Low    | High     |
| API         | No validation        | Data integrity      | Medium | High     |
| Performance | Large bundles        | Slow load           | Medium | Medium   |

---

## Next Steps

1. Start with **Quick Wins** in Priority 1
2. Set up `/lib` directory structure
3. Create reusable component library in `/components/ui`
4. Migrate state management incrementally
5. Add TypeScript gradually (not a big rewrite)
