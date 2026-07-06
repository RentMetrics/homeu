/**
 * Rent Prediction API
 *
 * Premium feature for property managers to predict rent collection rates
 * by checking resident bank account balances.
 *
 * This runs balance checks through Straddle to see if residents have
 * sufficient funds to pay their rent.
 */

import { NextResponse } from 'next/server';
import { straddleAPI } from '@/lib/straddle';

interface RenterForPrediction {
  renterId: string;
  renterName: string;
  propertyId: string;
  propertyAddress: string;
  rentAmount: number;
  straddleCustomerId?: string;
  hasLinkedBank: boolean;
}

interface PredictionResult {
  renterId: string;
  renterName: string;
  propertyId: string;
  propertyAddress: string;
  rentAmount: number;
  prediction: 'likely' | 'unlikely' | 'uncertain';
  confidenceScore: number;
  reason: string;
  lastChecked: number;
}

// POST - Generate rent prediction for current month
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { propertyManagerId, organizationId, renters } = data as {
      propertyManagerId: string;
      organizationId: string;
      renters: RenterForPrediction[];
    };

    if (!propertyManagerId || !renters || !Array.isArray(renters)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const predictions: PredictionResult[] = [];
    let totalExpectedRent = 0;
    let predictedCollectionAmount = 0;

    // Process each renter
    for (const renter of renters) {
      totalExpectedRent += renter.rentAmount;
      let prediction: PredictionResult;

      // If renter doesn't have a linked bank account, mark as uncertain
      if (!renter.hasLinkedBank || !renter.straddleCustomerId) {
        prediction = {
          renterId: renter.renterId,
          renterName: renter.renterName,
          propertyId: renter.propertyId,
          propertyAddress: renter.propertyAddress,
          rentAmount: renter.rentAmount,
          prediction: 'uncertain',
          confidenceScore: 0,
          reason: 'no_linked_bank',
          lastChecked: Date.now(),
        };
        predictions.push(prediction);
        continue;
      }

      try {
        // Check balance through Straddle
        const balanceCheck = await straddleAPI.checkBalance(
          renter.straddleCustomerId,
          renter.rentAmount
        );

        if (balanceCheck.accountStatus === 'error' || balanceCheck.accountStatus === 'inactive') {
          prediction = {
            renterId: renter.renterId,
            renterName: renter.renterName,
            propertyId: renter.propertyId,
            propertyAddress: renter.propertyAddress,
            rentAmount: renter.rentAmount,
            prediction: 'uncertain',
            confidenceScore: 20,
            reason: `account_${balanceCheck.accountStatus}`,
            lastChecked: Date.now(),
          };
        } else if (balanceCheck.hasSufficientFunds) {
          // Calculate confidence based on how much buffer they have
          const buffer = balanceCheck.availableBalance - renter.rentAmount;
          const bufferPercentage = (buffer / renter.rentAmount) * 100;

          let confidenceScore = 70; // Base score for sufficient funds
          if (bufferPercentage >= 100) confidenceScore = 95; // 2x or more
          else if (bufferPercentage >= 50) confidenceScore = 90;
          else if (bufferPercentage >= 25) confidenceScore = 85;
          else if (bufferPercentage >= 10) confidenceScore = 80;

          prediction = {
            renterId: renter.renterId,
            renterName: renter.renterName,
            propertyId: renter.propertyId,
            propertyAddress: renter.propertyAddress,
            rentAmount: renter.rentAmount,
            prediction: 'likely',
            confidenceScore,
            reason: 'sufficient_balance',
            lastChecked: Date.now(),
          };
          predictedCollectionAmount += renter.rentAmount;
        } else {
          // Insufficient funds - calculate how short they are
          const shortfall = renter.rentAmount - balanceCheck.availableBalance;
          const shortfallPercentage = (shortfall / renter.rentAmount) * 100;

          let confidenceScore = 30; // Base score for insufficient
          if (shortfallPercentage <= 10) confidenceScore = 50; // Close to having enough
          else if (shortfallPercentage <= 25) confidenceScore = 40;
          else if (shortfallPercentage >= 75) confidenceScore = 10; // Very short

          prediction = {
            renterId: renter.renterId,
            renterName: renter.renterName,
            propertyId: renter.propertyId,
            propertyAddress: renter.propertyAddress,
            rentAmount: renter.rentAmount,
            prediction: 'unlikely',
            confidenceScore,
            reason: 'insufficient_balance',
            lastChecked: Date.now(),
          };
        }
      } catch (error) {
        // If balance check fails, mark as uncertain
        console.error(`Balance check failed for ${renter.renterId}:`, error);

        // For sandbox/development, generate mock predictions
        if (process.env.NODE_ENV !== 'production') {
          const mockLikely = Math.random() > 0.2; // 80% likely to pay in mock
          prediction = {
            renterId: renter.renterId,
            renterName: renter.renterName,
            propertyId: renter.propertyId,
            propertyAddress: renter.propertyAddress,
            rentAmount: renter.rentAmount,
            prediction: mockLikely ? 'likely' : Math.random() > 0.5 ? 'unlikely' : 'uncertain',
            confidenceScore: mockLikely ? 75 + Math.floor(Math.random() * 20) : 20 + Math.floor(Math.random() * 30),
            reason: mockLikely ? 'sufficient_balance' : 'insufficient_balance',
            lastChecked: Date.now(),
          };
          if (mockLikely) {
            predictedCollectionAmount += renter.rentAmount;
          }
        } else {
          prediction = {
            renterId: renter.renterId,
            renterName: renter.renterName,
            propertyId: renter.propertyId,
            propertyAddress: renter.propertyAddress,
            rentAmount: renter.rentAmount,
            prediction: 'uncertain',
            confidenceScore: 0,
            reason: 'check_failed',
            lastChecked: Date.now(),
          };
        }
      }

      predictions.push(prediction);
    }

    // Calculate summary stats
    const likelyCount = predictions.filter(p => p.prediction === 'likely').length;
    const unlikelyCount = predictions.filter(p => p.prediction === 'unlikely').length;
    const uncertainCount = predictions.filter(p => p.prediction === 'uncertain').length;
    const totalResidents = predictions.length;

    const predictedCollectionRate = totalResidents > 0
      ? Math.round((likelyCount / totalResidents) * 100)
      : 0;

    // Determine overall confidence
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidenceScore, 0) / (totalResidents || 1);
    let confidence: 'high' | 'medium' | 'low';
    if (avgConfidence >= 70 && uncertainCount / totalResidents < 0.2) {
      confidence = 'high';
    } else if (avgConfidence >= 50 && uncertainCount / totalResidents < 0.4) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return NextResponse.json({
      success: true,
      prediction: {
        propertyManagerId,
        organizationId,
        month,
        generatedAt: Date.now(),
        totalResidents,
        predictedPayments: likelyCount,
        predictedNonPayments: unlikelyCount,
        uncertainPayments: uncertainCount,
        predictedCollectionRate,
        predictedCollectionAmount,
        totalExpectedRent,
        confidence,
        residentPredictions: predictions,
      },
    });
  } catch (error) {
    console.error('Rent prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate rent prediction' },
      { status: 500 }
    );
  }
}

// GET - Get existing prediction for a month
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const propertyManagerId = searchParams.get('propertyManagerId');
    const month = searchParams.get('month');

    if (!propertyManagerId) {
      return NextResponse.json(
        { error: 'Property manager ID is required' },
        { status: 400 }
      );
    }

    // This would typically fetch from Convex, but we return a placeholder here
    // The actual data fetching happens client-side via Convex hooks
    return NextResponse.json({
      success: true,
      message: 'Use Convex queries to fetch prediction data',
    });
  } catch (error) {
    console.error('Get prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to get prediction' },
      { status: 500 }
    );
  }
}
