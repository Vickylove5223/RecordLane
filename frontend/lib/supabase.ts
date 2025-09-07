import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '../config/supabase'

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey)

// Database types
export interface Recording {
  id: string
  title: string
  youtube_video_id: string
  youtube_link: string
  duration: number
  privacy: 'private' | 'unlisted' | 'public'
  thumbnail_url?: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  event_type: string
  recording_id?: string
  session_id?: string
  user_agent?: string
  properties?: Record<string, any>
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      recordings: {
        Row: Recording
        Insert: Omit<Recording, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Recording, 'id' | 'created_at' | 'updated_at'>> & {
          updated_at?: string
        }
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
      }
    }
  }
}
