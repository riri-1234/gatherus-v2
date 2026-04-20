export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      event_ratings: {
        Row: {
          attended: boolean | null
          comment: string | null
          created_at: string
          event_id: string
          id: string
          rating: number
          tags: string[] | null
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          comment?: string | null
          created_at?: string
          event_id: string
          id?: string
          rating: number
          tags?: string[] | null
          user_id: string
        }
        Update: {
          attended?: boolean | null
          comment?: string | null
          created_at?: string
          event_id?: string
          id?: string
          rating?: number
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_ratings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_swipes: {
        Row: {
          created_at: string
          event_id: string
          id: string
          swiped_right: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          swiped_right: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          swiped_right?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_swipes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_swipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          access_type: Database["public"]["Enums"]["event_access_type"] | null
          average_rating: number | null
          capacity: number | null
          capacity_status: Database["public"]["Enums"]["capacity_status"] | null
          category: Database["public"]["Enums"]["event_category"]
          cover_image_url: string | null
          created_at: string
          current_attendees: number | null
          date_time: string
          description: string | null
          event_rules: string | null
          external_link: string | null
          host_id: string
          id: string
          invite_code: string | null
          is_free: boolean | null
          is_on_campus: boolean | null
          is_trending: boolean | null
          location: string
          location_details: string | null
          price: number | null
          school_id: string | null
          tags: string[] | null
          title: string
          total_ratings: number | null
          updated_at: string
          visible_to_schools: string[] | null
        }
        Insert: {
          access_type?: Database["public"]["Enums"]["event_access_type"] | null
          average_rating?: number | null
          capacity?: number | null
          capacity_status?:
            | Database["public"]["Enums"]["capacity_status"]
            | null
          category: Database["public"]["Enums"]["event_category"]
          cover_image_url?: string | null
          created_at?: string
          current_attendees?: number | null
          date_time: string
          description?: string | null
          event_rules?: string | null
          external_link?: string | null
          host_id: string
          id?: string
          invite_code?: string | null
          is_free?: boolean | null
          is_on_campus?: boolean | null
          is_trending?: boolean | null
          location: string
          location_details?: string | null
          price?: number | null
          school_id?: string | null
          tags?: string[] | null
          title: string
          total_ratings?: number | null
          updated_at?: string
          visible_to_schools?: string[] | null
        }
        Update: {
          access_type?: Database["public"]["Enums"]["event_access_type"] | null
          average_rating?: number | null
          capacity?: number | null
          capacity_status?:
            | Database["public"]["Enums"]["capacity_status"]
            | null
          category?: Database["public"]["Enums"]["event_category"]
          cover_image_url?: string | null
          created_at?: string
          current_attendees?: number | null
          date_time?: string
          description?: string | null
          event_rules?: string | null
          external_link?: string | null
          host_id?: string
          id?: string
          invite_code?: string | null
          is_free?: boolean | null
          is_on_campus?: boolean | null
          is_trending?: boolean | null
          location?: string
          location_details?: string | null
          price?: number | null
          school_id?: string | null
          tags?: string[] | null
          title?: string
          total_ratings?: number | null
          updated_at?: string
          visible_to_schools?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          availability_weekday: boolean | null
          availability_weekend: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          gender: string | null
          graduation_year: number | null
          id: string
          instagram_handle: string | null
          interests: string[] | null
          is_public: boolean | null
          is_verified: boolean | null
          location: string | null
          name: string | null
          nickname: string | null
          phone_number: string | null
          program: string | null
          school_id: string | null
          sexuality: string | null
          updated_at: string
          user_id: string
          verification_email: string | null
        }
        Insert: {
          age?: number | null
          availability_weekday?: boolean | null
          availability_weekend?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          gender?: string | null
          graduation_year?: number | null
          id?: string
          instagram_handle?: string | null
          interests?: string[] | null
          is_public?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          name?: string | null
          nickname?: string | null
          phone_number?: string | null
          program?: string | null
          school_id?: string | null
          sexuality?: string | null
          updated_at?: string
          user_id: string
          verification_email?: string | null
        }
        Update: {
          age?: number | null
          availability_weekday?: boolean | null
          availability_weekend?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          gender?: string | null
          graduation_year?: number | null
          id?: string
          instagram_handle?: string | null
          interests?: string[] | null
          is_public?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          name?: string | null
          nickname?: string | null
          phone_number?: string | null
          program?: string | null
          school_id?: string | null
          sexuality?: string | null
          updated_at?: string
          user_id?: string
          verification_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["rsvp_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          city: string | null
          created_at: string
          email_domain: string | null
          id: string
          level: Database["public"]["Enums"]["school_level"]
          name: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email_domain?: string | null
          id?: string
          level: Database["public"]["Enums"]["school_level"]
          name: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email_domain?: string | null
          id?: string
          level?: Database["public"]["Enums"]["school_level"]
          name?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_match_percentage: {
        Args: { profile_a: string; profile_b: string }
        Returns: number
      }
      get_my_profile_id: { Args: never; Returns: string }
      is_event_host: { Args: { profile_id: string }; Returns: boolean }
      is_follow_related: {
        Args: { target_profile_id: string }
        Returns: boolean
      }
    }
    Enums: {
      capacity_status: "open" | "filling" | "full"
      event_access_type:
        | "open_rsvp"
        | "limited_spots"
        | "approval_required"
        | "invite_only"
      event_category:
        | "art_exhibition"
        | "book_club"
        | "lecture"
        | "garage_sale"
        | "study_session"
        | "party"
        | "networking"
        | "cooking_class"
        | "food_exploration"
        | "car_meetup"
        | "sports"
        | "creative_workshop"
        | "free_drinks"
        | "cafe_gathering"
        | "club_info_session"
        | "outdoor_activity"
        | "culture"
        | "exchange_community"
        | "speed_dating"
      rsvp_status: "pending" | "confirmed" | "waitlist" | "cancelled"
      school_level: "high_school" | "university"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      capacity_status: ["open", "filling", "full"],
      event_access_type: [
        "open_rsvp",
        "limited_spots",
        "approval_required",
        "invite_only",
      ],
      event_category: [
        "art_exhibition",
        "book_club",
        "lecture",
        "garage_sale",
        "study_session",
        "party",
        "networking",
        "cooking_class",
        "food_exploration",
        "car_meetup",
        "sports",
        "creative_workshop",
        "free_drinks",
        "cafe_gathering",
        "club_info_session",
        "outdoor_activity",
        "culture",
        "exchange_community",
        "speed_dating",
      ],
      rsvp_status: ["pending", "confirmed", "waitlist", "cancelled"],
      school_level: ["high_school", "university"],
    },
  },
} as const
