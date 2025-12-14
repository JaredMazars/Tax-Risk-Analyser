
import { prisma } from '@/lib/db/prisma';

export interface EmployeeWithUser {
  employee: {
    id: number;
    GSEmployeeID: string | null;
    EmpCode: string;
    EmpName: string;
    EmpNameFull: string;
    OfficeCode: string | null;
    ServLineCode: string | null;
    ServLineDesc: string | null;
    SubServLineCode: string | null;
    SubServLineDesc: string | null;
    EmpCatDesc: string | null;
    EmpCatCode: string | null;
    Active: string | null;
    EmpDateLeft: Date | null;
    WinLogon: string | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

/**
 * Finds users that match the given employees based on WinLogon/Email.
 * Returns a map of Employee ID -> User
 */
export async function mapEmployeesToUsers(employees: { id: number; WinLogon: string | null }[]) {
  // 1. Build email/username lookup arrays for User matching
  const winLogons = employees
    .map(emp => emp.WinLogon)
    .filter((logon): logon is string => !!logon);
  
  if (winLogons.length === 0) {
    return new Map<number, NonNullable<EmployeeWithUser['user']>>();
  }

  // Try both full email and username prefix
  const emailVariants = winLogons.flatMap(logon => {
    const lower = logon.toLowerCase();
    const prefix = lower.split('@')[0];
    return [lower, prefix].filter((v): v is string => !!v);
  });

  // 2. LEFT JOIN with User table to find registered users
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: emailVariants } },
        { id: { in: winLogons } } // Sometimes ID matches WinLogon
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true
    }
  });

  // 3. Create user lookup map
  const userMap = new Map<string, typeof users[0]>();
  users.forEach(u => {
    const lowerEmail = u.email.toLowerCase();
    const emailPrefix = lowerEmail.split('@')[0];
    userMap.set(lowerEmail, u);
    if (emailPrefix) {
      userMap.set(emailPrefix, u);
    }
    userMap.set(u.id, u);
  });

  // 4. Map back to Employee ID
  const employeeUserMap = new Map<number, typeof users[0]>();
  
  employees.forEach(emp => {
    if (!emp.WinLogon) return;
    
    const winLogon = emp.WinLogon.toLowerCase();
    const winLogonPrefix = winLogon.split('@')[0];
    
    const matchedUser = userMap.get(winLogon) || 
                       (winLogonPrefix ? userMap.get(winLogonPrefix) : undefined);
    
    if (matchedUser) {
      employeeUserMap.set(emp.id, matchedUser);
    }
  });

  return employeeUserMap;
}

/**
 * Finds employees that match the given user IDs (WinLogon).
 * Returns a map of User ID (or WinLogon prefix) -> Employee
 */
export async function mapUsersToEmployees(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, any>();
  }

  // Fetch employees
  const employees = await prisma.employee.findMany({
    where: {
      OR: [
        { WinLogon: { in: userIds } },
        // Also try email prefixes
        ...userIds.map(userId => ({
          WinLogon: { startsWith: `${userId}@` }
        }))
      ]
    },
    select: {
      id: true,
      GSEmployeeID: true,
      EmpCode: true,
      EmpNameFull: true,
      EmpCatCode: true,
      OfficeCode: true,
      WinLogon: true
    }
  });

  // Build map
  const employeeMap = new Map<string, typeof employees[0]>();
  employees.forEach(emp => {
    if (emp.WinLogon) {
      const lowerLogon = emp.WinLogon.toLowerCase();
      const prefix = lowerLogon.split('@')[0];
      employeeMap.set(lowerLogon, emp);
      if (prefix) {
        employeeMap.set(prefix, emp);
      }
    }
  });

  return employeeMap;
}


