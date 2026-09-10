export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          age: number
          gender: 'F' | 'M' | 'X'
          region: string
          avatar_url: string | null
          instagram: string | null
          facebook: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          age: number
          gender: 'F' | 'M' | 'X'
          region: string
          avatar_url?: string | null
          instagram?: string | null
          facebook?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          age?: number
          gender?: 'F' | 'M' | 'X'
          region?: string
          avatar_url?: string | null
          instagram?: string | null
          facebook?: string | null
          created_at?: string
        }
        Relationships: []
      }
      interests: {
        Row: { id: string, name: string }
        Insert: { id?: string, name: string }
        Update: { id?: string, name?: string }; Relationships: []
      }
      user_interests: {
        Row: { user_id: string, interest_id: string }
        Insert: { user_id: string, interest_id: string }
        Update: { user_id?: string, interest_id?: string }; Relationships: []
      }
      regions: {
        Row: { id: string, name: string }
        Insert: { id?: string, name: string }
        Update: { id?: string, name?: string }; Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          creator_id: string
          region_id: string
          category_id: string
          event_datetime: string
          address: string | null
          max_attendees: number | null
          min_age: number | null
          max_age: number | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          creator_id: string
          region_id: string
          category_id: string
          event_datetime: string
          address?: string | null
          max_attendees?: number | null
          min_age?: number | null
          max_age?: number | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          creator_id?: string
          region_id?: string
          category_id?: string
          event_datetime?: string
          address?: string | null
          max_attendees?: number | null
          min_age?: number | null
          max_age?: number | null
          image_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      event_attendees: {
        Row: { event_id: string, user_id: string, created_at: string }
        Insert: { event_id: string, user_id: string, created_at?: string }
        Update: { event_id?: string, user_id?: string, created_at?: string }; Relationships: []
      }
      dm_channels: {
        Row: { id: string, user1_id: string, user2_id: string, created_at: string }
        Insert: { id?: string, user1_id: string, user2_id: string, created_at?: string }
        Update: { id?: string, user1_id?: string, user2_id?: string, created_at?: string }; Relationships: []
      }
      rooms: {
        Row: { id: string, type: 'region' | 'event' | 'dm', reference_id: string }
        Insert: { id?: string, type: 'region' | 'event' | 'dm', reference_id: string }
        Update: { id?: string, type?: 'region' | 'event' | 'dm', reference_id?: string }; Relationships: []
      }
      messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string | null
          text: string | null
          type: 'text' | 'system_event_created'
          event_reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id?: string | null
          text?: string | null
          type?: 'text' | 'system_event_created'
          event_reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string | null
          text?: string | null
          type?: 'text' | 'system_event_created'
          event_reference_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      gender_type: 'F' | 'M' | 'X'
      room_type: 'region' | 'event' | 'dm'
      message_type: 'text' | 'system_event_created'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
