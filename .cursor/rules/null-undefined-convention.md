# Null vs Undefined Convention

## Standard Convention

This project follows a consistent approach to handling optional values and absence:

- **Use `undefined`** for optional/missing values
- **Use `null`** for intentional absence or database nulls (Prisma returns null)

## Examples

### Optional Parameters

```typescript
// ✅ GOOD - Optional parameter
function getProject(id: number, options?: ProjectOptions) {
  // options is undefined if not provided
}

// ✅ GOOD - Optional with default
function fetchProjects(includeArchived = false) {
  // Uses default value when undefined
}
```

### Database Fields

```typescript
// ✅ GOOD - Database null
interface Project {
  clientId: number | null; // null when no client assigned
  description: string | null; // null when not provided
  taxYear: number | null; // null for non-tax projects
}
```

### Intentional Absence

```typescript
// ✅ GOOD - Intentional absence
const config = {
  maxRetries: 3,
  timeout: null, // null means no timeout (infinite)
};

// ✅ GOOD - Clearing a value
user.profileImage = null; // Explicitly removing the image
```

### Return Types

```typescript
// ✅ GOOD - Not found returns undefined
function findUserByEmail(email: string): User | undefined {
  const user = users.find(u => u.email === email);
  return user; // Returns undefined if not found
}

// ✅ GOOD - Database returns null
async function getUserImage(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  return user?.image ?? null; // Returns null if no image
}
```

### Function Signatures

```typescript
// ✅ GOOD - Optional properties use ?:
interface CreateProjectDTO {
  name: string;
  description?: string; // undefined if not provided
  clientId?: number; // undefined if not provided
}

// ✅ GOOD - Nullable fields use | null
interface Project {
  id: number;
  name: string;
  description: string | null; // null from database
  clientId: number | null; // null from database
}
```

## Handling Optional Values

### Checking for Undefined

```typescript
// ✅ GOOD - Check for undefined
if (options !== undefined) {
  // Use options
}

// ✅ GOOD - Optional chaining
const value = options?.setting;

// ✅ GOOD - Nullish coalescing
const timeout = config.timeout ?? 5000;
```

### Checking for Null

```typescript
// ✅ GOOD - Check for null
if (user.image !== null) {
  displayImage(user.image);
}

// ✅ GOOD - Nullish coalescing
const displayName = user.name ?? user.email;
```

### Checking for Both

```typescript
// ✅ GOOD - Check for null or undefined (nullish)
if (value != null) {
  // value is neither null nor undefined
}

// ✅ GOOD - Nullish coalescing handles both
const name = user.name ?? 'Anonymous';
```

## Common Patterns

### API Responses

```typescript
// ✅ GOOD - Optional fields in response
interface ApiResponse<T> {
  success: boolean;
  data?: T; // undefined if error
  error?: string; // undefined if success
  meta?: PaginationMeta; // undefined if not paginated
}
```

### Database Queries

```typescript
// ✅ GOOD - Prisma nullable fields
const project = await prisma.project.create({
  data: {
    name: 'New Project',
    description: null, // Explicitly null
    clientId: null, // Explicitly null
  },
});
```

### Default Values

```typescript
// ✅ GOOD - Default for undefined
function processOptions(options?: ProcessOptions) {
  const timeout = options?.timeout ?? 5000;
  const retries = options?.retries ?? 3;
}

// ✅ GOOD - Database default for null
const displayName = user.name || 'Anonymous'; // Handles null and empty string
```

## TypeScript Configuration

Ensure strict null checks are enabled in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

## Summary

| Scenario | Use | Example |
|----------|-----|---------|
| Optional parameter | `undefined` | `function(x?: number)` |
| Optional property | `undefined` | `interface { x?: string }` |
| Database nullable | `null` | `clientId: number \| null` |
| Intentional absence | `null` | `timeout: null // infinite` |
| Not found | `undefined` | `array.find()` |
| Clearing value | `null` | `user.image = null` |
| Default values | `??` operator | `value ?? defaultValue` |

## Migration Guide

When encountering mixed null/undefined usage:

1. **Function parameters**: Change to optional (`?:`) instead of `| null`
2. **Database fields**: Keep as `| null` (Prisma convention)
3. **Return types**: Use `| undefined` for "not found", `| null` for database values
4. **Object properties**: Use optional (`?:`) for optional, `| null` for nullable

## Benefits

- **Consistency**: Clear convention across codebase
- **Type Safety**: TypeScript can catch errors
- **Readability**: Intention is clear from type signature
- **Prisma Alignment**: Matches Prisma's null handling
- **Modern JavaScript**: Leverages nullish coalescing and optional chaining

