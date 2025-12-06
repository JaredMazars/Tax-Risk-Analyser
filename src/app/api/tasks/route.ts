import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError, AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { CreateTaskSchema } from '@/lib/validation/schemas';
import { successResponse } from '@/lib/utils/apiUtils';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { getUserServiceLines } from '@/lib/services/service-lines/serviceLineService';
import { getTasksWithCounts } from '@/lib/services/tasks/taskService';
import { getServLineCodesBySubGroup, getExternalServiceLinesByMaster } from '@/lib/utils/serviceLineExternal';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { sanitizeObject } from '@/lib/utils/sanitization';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const { checkUserPermission } = await import('@/lib/services/permissions/permissionService');
    const hasPermission = await checkUserPermission(user.id, 'tasks', 'READ');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '50'), 100);
    const search = searchParams.get('search') || '';
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const serviceLine = searchParams.get('serviceLine');
    const subServiceLineGroup = searchParams.get('subServiceLineGroup');
    const internalOnly = searchParams.get('internalOnly') === 'true';
    const clientTasksOnly = searchParams.get('clientTasksOnly') === 'true';
    const myTasksOnly = searchParams.get('myTasksOnly') === 'true';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const skip = (page - 1) * limit;

    // Get user's accessible service lines (returns master codes like 'TAX', 'ACCOUNTING')
    const userServiceLines = await getUserServiceLines(user.id);
    const accessibleMasterCodes = userServiceLines.map(sl => sl.serviceLine);

    // Map master codes to actual ServLineCodes from ServiceLineExternal
    const servLineCodesPromises = accessibleMasterCodes.map(masterCode =>
      getExternalServiceLinesByMaster(masterCode)
    );
    const servLineCodesArrays = await Promise.all(servLineCodesPromises);
    
    // Flatten and extract ServLineCodes
    const accessibleServLineCodes = Array.from(
      new Set(
        servLineCodesArrays
          .flat()
          .map(sl => sl.ServLineCode)
          .filter((code): code is string => code !== null)
      )
    );

    // If user has no accessible ServLineCodes, return empty
    if (accessibleServLineCodes.length === 0) {
      return NextResponse.json(
        successResponse({
          tasks: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        })
      );
    }

    // Build where clause for database-level filtering with actual ServLineCodes
    const where: Prisma.TaskWhereInput = {
      ServLineCode: {
        in: accessibleServLineCodes,
      },
    };

    // Filter by team membership if myTasksOnly is true
    if (myTasksOnly) {
      where.TaskTeam = {
        some: {
          userId: user.id,
        },
      };
    }

    // Filter by archived status (Active field)
    if (!includeArchived) {
      where.Active = 'Yes';
    }

    // Filter for internal projects only (no client assigned)
    if (internalOnly) {
      where.ClientCode = null;
    }

    // Filter for client tasks only (has client assigned)
    if (clientTasksOnly) {
      where.ClientCode = { not: null };
    }

    // Filter by SubServiceLineGroup - this takes priority over serviceLine
    if (subServiceLineGroup) {
      const servLineCodes = await getServLineCodesBySubGroup(
        subServiceLineGroup,
        serviceLine || undefined
      );
      
      if (servLineCodes.length > 0) {
        // Intersect with accessible ServLineCodes for security
        const allowedCodes = servLineCodes.filter(code => 
          accessibleServLineCodes.includes(code)
        );
        
        if (allowedCodes.length > 0) {
          where.ServLineCode = { in: allowedCodes };
        } else {
          // No accessible codes, return empty
          return NextResponse.json(
            successResponse({
              tasks: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
              },
            })
          );
        }
      } else {
        // No ServLineCodes found, return empty result
        return NextResponse.json(
          successResponse({
            tasks: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          })
        );
      }
    } else if (serviceLine) {
      // Only filter by serviceLine (master code) if no subServiceLineGroup
      // Get ServLineCodes for this master code and intersect with accessible codes
      const masterCodeServLines = await getExternalServiceLinesByMaster(serviceLine);
      const masterServLineCodes = masterCodeServLines
        .map(sl => sl.ServLineCode)
        .filter((code): code is string => code !== null);
      
      const allowedCodes = masterServLineCodes.filter(code =>
        accessibleServLineCodes.includes(code)
      );
      
      if (allowedCodes.length > 0) {
        where.ServLineCode = { in: allowedCodes };
      } else {
        // User doesn't have access to this service line
        return NextResponse.json(
          successResponse({
            tasks: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          })
        );
      }
    }

    // Add search filter
    if (search) {
      where.OR = [
        { TaskDesc: { contains: search } },
        { TaskCode: { contains: search } },
        { Client: { clientNameFull: { contains: search } } },
        { Client: { clientCode: { contains: search } } },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.TaskOrderByWithRelationInput = {};
    const validSortFields = ['TaskDesc', 'updatedAt', 'createdAt'] as const;
    type ValidSortField = typeof validSortFields[number];
    if (validSortFields.includes(sortBy as ValidSortField)) {
      orderBy[sortBy as ValidSortField] = sortOrder;
    } else {
      orderBy.updatedAt = 'desc';
    }

    // Run count and data queries in parallel for better performance
    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          TaskCode: true,
          TaskDesc: true,
          ClientCode: true,
          ServLineCode: true,
          ServLineDesc: true,
          Active: true,
          TaskDateOpen: true,
          TaskDateTerminate: true,
          createdAt: true,
          updatedAt: true,
          Client: {
            select: {
              id: true,
              clientNameFull: true,
              clientCode: true,
            },
          },
          TaskTeam: {
            where: {
              userId: user.id,
            },
            select: {
              role: true,
            },
          },
        },
      }),
    ]);

    // Transform tasks to match expected format
    const tasksWithCounts = tasks.map(task => {
      const isTeamMember = task.TaskTeam.length > 0;

      return {
        id: task.id,
        name: task.TaskDesc,
        description: null,
        projectType: task.ServLineDesc,
        serviceLine: task.ServLineCode,
        status: task.Active === 'Yes' ? 'ACTIVE' : 'INACTIVE',
        archived: task.Active !== 'Yes',
        clientId: task.Client?.id || null,
        taxYear: null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        client: task.Client ? {
          id: task.Client.id,
          clientNameFull: task.Client.clientNameFull,
          clientCode: task.Client.clientCode,
        } : null,
        userRole: task.TaskTeam[0]?.role || null,
        canAccess: true,
      };
    });
    
    return NextResponse.json(
      successResponse({
        tasks: tasksWithCounts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    return handleApiError(error, 'Get Tasks');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const { checkUserPermission } = await import('@/lib/services/permissions/permissionService');
    const hasPermission = await checkUserPermission(user.id, 'projects.create', 'CREATE');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions to create projects' }, { status: 403 });
    }
    
    // Check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    
    if (!dbUser) {
      return NextResponse.json({ 
        error: 'User not found in database. Please log out and log back in.' 
      }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Sanitize input before validation
    const sanitizedBody = sanitizeObject(body, { maxLength: 1000 });
    
    // Validate request body
    const validatedData = CreateTaskSchema.parse(sanitizedBody);

    // Check if user has access to the service line
    const userServiceLines = await getUserServiceLines(user.id);
    const hasAccess = userServiceLines.some(
      sl => sl.serviceLine === validatedData.serviceLine
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this service line' },
        { status: 403 }
      );
    }

    // Create project with user as admin
    const task = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        projectType: validatedData.projectType || 'TAX_CALCULATION',
        serviceLine: validatedData.serviceLine || 'TAX',
        taxYear: validatedData.taxYear,
        taxPeriodStart: validatedData.taxPeriodStart,
        taxPeriodEnd: validatedData.taxPeriodEnd,
        assessmentYear: validatedData.assessmentYear,
        submissionDeadline: validatedData.submissionDeadline,
        clientId: validatedData.clientId,
        createdBy: user.id,
        status: 'ACTIVE',
        TaskTeam: {
          create: {
            userId: user.id,
            role: 'ADMIN',
          },
        },
      },
      include: {
        Client: true,
        TaskTeam: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            MappedAccount: true,
            TaxAdjustment: true,
          },
        },
      },
    });

    // Transform data to match expected format
    const transformedProject = {
      ...project,
      client: project.Client, // Transform Client → client for consistency
      Client: undefined, // Remove original Client field
      _count: {
        mappings: project._count.MappedAccount,
        taxAdjustments: project._count.TaxAdjustment,
      },
    };

    return NextResponse.json(successResponse(transformedProject), { status: 201 });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return handleApiError(
        new AppError(400, message, ErrorCodes.VALIDATION_ERROR),
        'Create Project'
      );
    }
    
    return handleApiError(error, 'Create Project');
  }
}

