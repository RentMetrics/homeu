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
    const { amount, currency, txHash } = data;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        currency,
        status: 'PENDING',
        type: 'CRYPTO',
        userId: session.user.id,
        propertyId: session.user.propertyId, // Assuming this is stored in the session
        cryptoDetails: {
          create: {
            txHash,
            amount: parseFloat(amount),
            currency,
            status: 'PENDING',
          },
        },
      },
      include: {
        cryptoDetails: true,
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Crypto payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process crypto payment' },
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

    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        type: 'CRYPTO',
      },
      include: {
        cryptoDetails: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Crypto payments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crypto payments' },
      { status: 500 }
    );
  }
} 