import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { idDocument, proofOfIncome, rentalHistory, additionalNotes } = data;

    // Create verification record
    const verification = await prisma.verification.create({
      data: {
        status: 'PENDING',
        documents: {
          idDocument,
          proofOfIncome,
          rentalHistory,
        },
        notes: additionalNotes,
        userId: session.user.id,
      },
    });

    return NextResponse.json(verification);
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to submit verification' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const verification = await prisma.verification.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json(verification);
  } catch (error) {
    console.error('Verification fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification status' },
      { status: 500 }
    );
  }
} 