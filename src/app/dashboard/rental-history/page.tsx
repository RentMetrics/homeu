"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Plus,
  Home,
  TrendingUp,
  Star
} from "lucide-react";
import { format, differenceInMonths } from "date-fns";

interface RentalHistory {
  id?: string;
  _id?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  monthlyRent: number;
  moveInDate: number;
  moveOutDate?: number;
  landlordName?: string;
  paymentHistory: {
    onTimePayments: number;
    latePayments: number;
    totalPayments: number;
  };
  status: string; // 'current' | 'past'
  verified: boolean;
}

export default function RentalHistoryPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const rentalHistory = useQuery(
    api.rentalHistory.getUserRentalHistory,
    user?.id ? { userId: user.id } : "skip"
  );

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  const sampleHistory: RentalHistory[] = [
    {
      id: '1',
      address: '123 Main Street, Apt 4B',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      propertyType: 'Apartment',
      monthlyRent: 2500,
      moveInDate: Date.now() - (18 * 30 * 24 * 60 * 60 * 1000),
      landlordName: 'Bay Property Management',
      paymentHistory: { onTimePayments: 18, latePayments: 0, totalPayments: 18 },
      status: 'current',
      verified: true
    },
    {
      id: '2',
      address: '456 Oak Avenue, Unit 2',
      city: 'Oakland',
      state: 'CA',
      zipCode: '94612',
      propertyType: 'Condo',
      monthlyRent: 2200,
      moveInDate: Date.now() - (42 * 30 * 24 * 60 * 60 * 1000),
      moveOutDate: Date.now() - (18 * 30 * 24 * 60 * 60 * 1000),
      landlordName: 'East Bay Rentals',
      paymentHistory: { onTimePayments: 22, latePayments: 2, totalPayments: 24 },
      status: 'past',
      verified: true
    },
  ];

  const displayHistory: RentalHistory[] =
    rentalHistory && rentalHistory.length > 0 ? rentalHistory : sampleHistory;
  const currentResidence = displayHistory.find((h: RentalHistory) => h.status === 'current');
  const pastResidences = displayHistory.filter((h: RentalHistory) => h.status === 'past');

  const totalMonths = displayHistory.reduce((sum: number, h: RentalHistory) => {
    const moveOut = h.moveOutDate || Date.now();
    return sum + differenceInMonths(new Date(moveOut), new Date(h.moveInDate));
  }, 0);

  const totalOnTime = displayHistory.reduce((sum: number, h: RentalHistory) => sum + h.paymentHistory.onTimePayments, 0);
  const totalPayments = displayHistory.reduce((sum: number, h: RentalHistory) => sum + h.paymentHistory.totalPayments, 0);
  const onTimeRate = totalPayments > 0 ? Math.round((totalOnTime / totalPayments) * 100) : 0;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Rental History</h1>
            <p className="text-muted-foreground">Track your rental history and build your renter profile</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Past Residence
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-muted-foreground">Properties</p>
              </div>
              <p className="text-2xl font-bold">{displayHistory.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <p className="text-sm text-muted-foreground">Total Months</p>
              </div>
              <p className="text-2xl font-bold">{totalMonths}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <p className="text-sm text-muted-foreground">On-Time Rate</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{onTimeRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
              <p className="text-2xl font-bold">
                {displayHistory.filter((h: RentalHistory) => h.verified).length}/{displayHistory.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {currentResidence && (
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-green-600" />
                    Current Residence
                  </CardTitle>
                  <CardDescription>
                    Living here since {format(new Date(currentResidence.moveInDate), "MMMM yyyy")}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {currentResidence.verified && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-start gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{currentResidence.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentResidence.city}, {currentResidence.state} {currentResidence.zipCode}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{currentResidence.propertyType}</Badge>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Monthly Rent</span>
                  </div>
                  <p className="text-2xl font-bold">${currentResidence.monthlyRent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment Record</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{currentResidence.paymentHistory.onTimePayments}</p>
                      <p className="text-xs text-muted-foreground">On-Time</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{currentResidence.paymentHistory.latePayments}</p>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Past Residences
            </CardTitle>
            <CardDescription>Your rental history across previous properties</CardDescription>
          </CardHeader>
          <CardContent>
            {pastResidences.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No past residences recorded</p>
                <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Past Residence
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Monthly Rent</TableHead>
                    <TableHead>Payment Record</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastResidences.map((residence: RentalHistory) => {
                    const months = differenceInMonths(
                      new Date(residence.moveOutDate || Date.now()),
                      new Date(residence.moveInDate)
                    );
                    const rate = Math.round(
                      (residence.paymentHistory.onTimePayments / residence.paymentHistory.totalPayments) * 100
                    );

                    return (
                      <TableRow key={residence._id ?? residence.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{residence.address}</p>
                            <p className="text-sm text-muted-foreground">{residence.city}, {residence.state}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{months} months</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(residence.moveInDate), "MMM yyyy")} - {format(new Date(residence.moveOutDate!), "MMM yyyy")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>${residence.monthlyRent.toLocaleString()}/mo</TableCell>
                        <TableCell>
                          <span className={`font-medium ${rate >= 90 ? 'text-green-600' : rate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {rate}%
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">
                            ({residence.paymentHistory.onTimePayments}/{residence.paymentHistory.totalPayments})
                          </span>
                        </TableCell>
                        <TableCell>
                          {residence.verified ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Past Residence</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground text-center mb-4">
                Adding past residences helps build your renter profile and credit history.
              </p>
              <p className="text-sm text-center text-muted-foreground">
                Coming soon: Upload lease documents and verify your rental history automatically.
              </p>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
