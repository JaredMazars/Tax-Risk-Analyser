import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError, AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { UpdateClientSchema } from '@/lib/validation/schemas';
import { successResponse } from '@/lib/utils/apiUtils';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { z } from 'zod';
import { getExternalServiceLinesByMaster } from '@/lib/utils/serviceLineExternal';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const params = await context.params;
    const clientId = Number.parseInt(params.id);

    if (Number.isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination params for tasks
    const taskPage = Number.parseInt(searchParams.get('taskPage') || '1');
    const taskLimit = Math.min(Number.parseInt(searchParams.get('taskLimit') || '20'), 50);
    const serviceLine = searchParams.get('serviceLine') || undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';
    
    const taskSkip = (taskPage - 1) * taskLimit;

    // Get ServLineCodes for the requested service line
    let servLineCodes: string[] | undefined;
    if (serviceLine) {
      const externalServiceLines = await getExternalServiceLinesByMaster(serviceLine);
      servLineCodes = externalServiceLines
        .map(sl => sl.ServLineCode)
        .filter((code): code is string => code !== null);
    }

    // Build task where clause
    interface TaskWhereClause {
      ClientCode: string;
      Active?: string;
      ServLineCode?: { in: string[] };
    }
    const taskWhere: TaskWhereClause = {
      ClientCode: '', // Will be set below after we get the client
    };
    
    if (!includeArchived) {
      taskWhere.Active = 'Yes';
    }
    if (servLineCodes && servLineCodes.length > 0) {
      taskWhere.ServLineCode = { in: servLineCodes };
    }

    // First, get the client to get their ClientCode
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Set the ClientCode in the where clause
    taskWhere.ClientCode = client.clientCode;

    // Get tasks for this client
    const tasks = await prisma.task.findMany({
      where: taskWhere,
      orderBy: { updatedAt: 'desc' },
      skip: taskSkip,
      take: taskLimit,
      select: {
        id: true,
        TaskDesc: true,
        TaskCode: true,
        Active: true,
        createdAt: true,
        updatedAt: true,
        ServLineCode: true, // Include to derive serviceLine
        ExternalTaskID: true,
        TaskDateOpen: true,
        TaskDateTerminate: true,
        _count: {
          select: {
            MappedAccount: true,
            TaxAdjustment: true,
          },
        },
      },
    });

    // Get total task count with filters
    const totalTasks = await prisma.task.count({
      where: taskWhere,
    });

    // Helper function to get ServLineCodes for a master code
    const getServLineCodesForMaster = async (masterCode: string): Promise<string[]> => {
      const externals = await getExternalServiceLinesByMaster(masterCode);
      return externals.map(sl => sl.ServLineCode).filter((code): code is string => code !== null);
    };

    // Get task counts per service line for tab display (all 9 service lines)
    const [taxCodes, auditCodes, accountingCodes, advisoryCodes, qrmCodes, bdCodes, itCodes, financeCodes, hrCodes] = await Promise.all([
      getServLineCodesForMaster('TAX'),
      getServLineCodesForMaster('AUDIT'),
      getServLineCodesForMaster('ACCOUNTING'),
      getServLineCodesForMaster('ADVISORY'),
      getServLineCodesForMaster('QRM'),
      getServLineCodesForMaster('BUSINESS_DEV'),
      getServLineCodesForMaster('IT'),
      getServLineCodesForMaster('FINANCE'),
      getServLineCodesForMaster('HR'),
    ]);

    const taskCountsByServiceLine = await Promise.all([
      prisma.task.count({ where: { ClientCode: client.clientCode, Active: !includeArchived ? 'Yes' : undefined, ServLineCode: taxCodes.length > 0 ? { in: taxCodes } : undefined } }),
      prisma.task.count({ where: { ClientCode: client.clientCode, Active: !includeArchived ? 'Yes' : undefined, ServLineCode: auditCodes.length > 0 ? { in: auditCodes } : undefined } }),
      prisma.task.count({ where: { ClientCode: client.clientCode, Active: !includeArchived ? 'Yes' : undefined, ServLineCode: accountingCodes.length > 0 ? { in: accountingCodes } : undefined } }),
      prisma.task.count({ where: { ClientCode: client.clientCode, Active: !includeArchived ? 'Yes' : undefined, ServLineCode: advisoryCodes.length > 0 ? { in: advisoryCodes } : undefined } }),
      prisma.task.count({ where: { ClientCode: client.clientCode, Active: !includeArchived ? 'Yes' : undefined, ServLineCode: qrmCodes.length > 0 ? { in: qrmCodes } : undefined } }),
      prisma.task.count({ where: { ClientCode: client.clientCode, Active: !includeArchived ? 'Yes' : undefined, ServLineCode: bdCodes.length > 0 ? { in: bdCodes } : undefined } }),
      prisma.task.count({ where: { ClientCode: client.clientCode, Active: !includeArchived ? 'Yes' : undefined, ServLineCode: itCodes.length > 0 ? { in: itCodes } : undefined } }),
      prisma.task.count({ where: { ClientCode: client.clientCode, Active: !includeArchived ? 'Yes' : undefined, ServLineCode: financeCodes.length > 0 ? { in: financeCodes } : undefined } }),
      prisma.task.count({ where: { ClientCode: client.clientCode, Active: !includeArchived ? 'Yes' : undefined, ServLineCode: hrCodes.length > 0 ? { in: hrCodes } : undefined } }),
    ]);

    // Calculate total across all service lines
    const totalAcrossAllServiceLines = taskCountsByServiceLine.reduce((sum, count) => sum + count, 0);

    // Get mapping from ServLineCode to masterCode for deriving serviceLine
    const allServLineCodes = tasks.map(t => t.ServLineCode);
    const serviceLineMapping: Record<string, string> = {};
    if (allServLineCodes.length > 0) {
      const mappings = await prisma.serviceLineExternal.findMany({
        where: { ServLineCode: { in: allServLineCodes } },
        select: { ServLineCode: true, masterCode: true },
      });
      mappings.forEach(m => {
        if (m.ServLineCode && m.masterCode) {
          serviceLineMapping[m.ServLineCode] = m.masterCode;
        }
      });
    }

    // Transform Task to projects for frontend compatibility
    const responseData = {
      ...client,
      tasks, // Also include raw tasks
      projects: tasks.map(task => ({
        ...task,
        serviceLine: serviceLineMapping[task.ServLineCode] || 'UNKNOWN',
        _count: {
          mappings: task._count.MappedAccount,
          taxAdjustments: task._count.TaxAdjustment,
        },
      })),
      _count: {
        Task: totalAcrossAllServiceLines, // Total across all service lines (not filtered by active tab)
      },
      taskPagination: {
        page: taskPage,
        limit: taskLimit,
        total: totalTasks, // Filtered count for pagination
        totalPages: Math.ceil(totalTasks / taskLimit),
      },
      taskCountsByServiceLine: {
        TAX: taskCountsByServiceLine[0],
        AUDIT: taskCountsByServiceLine[1],
        ACCOUNTING: taskCountsByServiceLine[2],
        ADVISORY: taskCountsByServiceLine[3],
        QRM: taskCountsByServiceLine[4],
        BUSINESS_DEV: taskCountsByServiceLine[5],
        IT: taskCountsByServiceLine[6],
        FINANCE: taskCountsByServiceLine[7],
        HR: taskCountsByServiceLine[8],
      },
    };

    return NextResponse.json(successResponse(responseData));
  } catch (error) {
    return handleApiError(error, 'Get Client');
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const params = await context.params;
    const clientId = Number.parseInt(params.id);

    if (Number.isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = UpdateClientSchema.parse(body);

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check for duplicate client code if provided and different from current
    if (validatedData.clientCode && validatedData.clientCode !== existingClient.clientCode) {
      const duplicateClient = await prisma.client.findUnique({
        where: { clientCode: validatedData.clientCode },
      });

      if (duplicateClient) {
        return handleApiError(
          new AppError(400, `Client code '${validatedData.clientCode}' is already in use`, ErrorCodes.VALIDATION_ERROR),
          'Update Client'
        );
      }
    }

    // Update client
    const client = await prisma.client.update({
      where: { id: clientId },
      data: validatedData,
    });

    return NextResponse.json(successResponse(client));
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return handleApiError(
        new AppError(400, message, ErrorCodes.VALIDATION_ERROR),
        'Update Client'
      );
    }
    
    // Handle Prisma unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const meta = 'meta' in error && error.meta && typeof error.meta === 'object' ? error.meta : null;
      const target = meta && 'target' in meta ? meta.target : null;
      if (target && Array.isArray(target) && target.includes('clientCode')) {
        return handleApiError(
          new AppError(400, 'Client code is already in use', ErrorCodes.VALIDATION_ERROR),
          'Update Client'
        );
      }
    }
    
    return handleApiError(error, 'Update Client');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const params = await context.params;
    const clientId = Number.parseInt(params.id);

    if (Number.isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        _count: {
          select: {
            Task: true,
          },
        },
      },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if client has tasks
    if (existingClient._count.Task > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with existing tasks. Please reassign or delete tasks first.' },
        { status: 400 }
      );
    }

    // Delete client
    await prisma.client.delete({
      where: { id: clientId },
    });

    return NextResponse.json(
      successResponse({ message: 'Client deleted successfully' })
    );
  } catch (error) {
    return handleApiError(error, 'Delete Client');
  }
}

