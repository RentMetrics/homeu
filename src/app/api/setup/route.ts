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
    const {
      propertyName,
      propertyAddress,
      unitNumber,
      leaseStartDate,
      monthlyRent,
      paymentMethod,
      walletAddress,
    } = data;

    // Create or update property
    const property = await prisma.property.upsert({
      where: {
        address_unit: {
          address: propertyAddress,
          unitNumber: unitNumber || '',
        },
      },
      create: {
        name: propertyName,
        address: propertyAddress,
        unitNumber,
        propertyManager: {
          connect: {
            id: session.user.id, // Assuming the user is the property manager
          },
        },
      },
      update: {
        name: propertyName,
      },
    });

    // Create rental history
    const rentalHistory = await prisma.rentalHistory.create({
      data: {
        startDate: new Date(leaseStartDate),
        status: 'ACTIVE',
        userId: session.user.id,
        notes: `Monthly rent: ${monthlyRent}, Payment method: ${paymentMethod}`,
      },
    });

    // Update user preferences
    const user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        properties: {
          connect: {
            id: property.id,
          },
        },
        // Add any additional user preferences here
      },
    });

    return NextResponse.json({
      property,
      rentalHistory,
      user,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Failed to complete setup' },
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

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        properties: true,
        rentalHistory: {
          orderBy: {
            startDate: 'desc',
          },
          take: 1,
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Setup fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setup information' },
      { status: 500 }
    );
  }
} 