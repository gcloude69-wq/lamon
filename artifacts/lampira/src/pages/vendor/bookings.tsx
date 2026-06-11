import React from "react";
import { useGetVendorBookings, useUpdateBookingStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function VendorBookings() {
  const { data: bookings, isLoading, refetch } = useGetVendorBookings();
  const updateStatus = useUpdateBookingStatus();
  const { toast } = useToast();

  const handleUpdateStatus = (id: number, status: 'confirmed' | 'cancelled' | 'completed') => {
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: "Booking updated", description: `Booking status changed to ${status}` });
        refetch();
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Update failed", description: err.message });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
      case 'completed': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatIDR = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="container py-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Booking Management</h1>
        <p className="text-muted-foreground">Review and manage reservations for your listings.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : bookings?.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No bookings found</h3>
          <p className="text-muted-foreground">You don't have any bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings?.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{booking.listingName}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          Booked by {booking.userName} ({booking.userEmail})
                        </p>
                      </div>
                      <Badge variant="outline" className={`${getStatusColor(booking.status)} border-none`}>
                        {booking.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Date</div>
                        <div className="font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-primary" />
                          {format(new Date(booking.checkInDate), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Guests</div>
                        <div className="font-medium flex items-center gap-1">
                          <Users className="w-4 h-4 text-primary" />
                          {booking.guests || 1}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Total Value</div>
                        <div className="font-medium text-primary">{formatIDR(booking.totalPrice)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Your Earnings</div>
                        <div className="font-medium text-emerald-600">
                          {formatIDR(booking.totalPrice - (booking.commissionAmount || 0))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-end gap-2 md:w-32 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                    {booking.status === 'pending' && (
                      <>
                        <Button 
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                          onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                          disabled={updateStatus.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Accept
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="w-full"
                          onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                          disabled={updateStatus.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <Button 
                        variant="outline" 
                        className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={() => handleUpdateStatus(booking.id, 'completed')}
                        disabled={updateStatus.isPending}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
