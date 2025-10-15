import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, AppError, ErrorCodes } from '@/lib/errorHandler';
import { createProjectSchema } from '@/lib/validation';
import { successResponse } from '@/lib/apiUtils';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const projects = await prisma.project.findMany({
      where: {
        status: 'ACTIVE',
        archived: includeArchived ? undefined : false,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        _count: {
          select: {
            mappings: true,
            taxAdjustments: true,
          },
        },
      },
    });
    
    return NextResponse.json(successResponse(projects));
  } catch (error) {
    return handleApiError(error, 'Get Projects');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json(successResponse(project), { status: 201 });
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
