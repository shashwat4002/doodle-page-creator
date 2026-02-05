import { useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./use-auth";

export type Notification = {
  id: string;
  type: string;
  message: string;
  payload?: Record<string, unknown>;
  created_at: string;
  read_at?: string | null;
};

export const useRealtimeNotifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data } = useCurrentUser();

  const handleNotification = useCallback(
    (payload: { new: Notification }) => {
      const notification = payload.new;
      
      queryClient.setQueryData(
        ["notifications"],
        (existing: { notifications: Notification[] } | undefined | null) => {
          if (!existing) {
            return { notifications: [notification] };
          }
          return {
            notifications: [notification, ...existing.notifications],
          };
        }
      );

      toast({
        title: "New Notification",
        description: notification.message,
      });
    },
    [queryClient, toast]
  );

  useEffect(() => {
    if (!data?.user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${data.user.id}`,
        },
        handleNotification
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data?.user, handleNotification]);
};
