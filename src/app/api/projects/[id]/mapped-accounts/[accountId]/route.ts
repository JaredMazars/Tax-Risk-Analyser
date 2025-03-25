import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; accountId: string } }
) {
  try {
    const data = await request.json();
    const mappedAccount = await prisma.mappedAccount.update({
      where: {
        id: parseInt(params.accountId),
        projectId: parseInt(params.id),
      },
      data,
    });

    return NextResponse.json(mappedAccount);
  } catch (error) {
    console.error('Error updating mapped account:', error);
    return NextResponse.json(
      { error: 'Failed to update mapped account' },
      { status: 500 }
    );
  }
} 