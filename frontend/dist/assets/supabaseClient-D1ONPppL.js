const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/supabase-aC0e6cYW.js","assets/index-Bw6xhQI4.js","assets/index-OnCZvb9u.css"])))=>i.map(i=>d[i]);
import { _ as __vitePreload } from "./index-Bw6xhQI4.js";
import { supabase } from "./supabase-aC0e6cYW.js";
function generateId$1() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
async function createRecording(data) {
  const id = generateId$1();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const recordingData = {
    id,
    title: data.title,
    youtube_video_id: data.youtubeVideoId,
    youtube_link: data.youtubeLink,
    duration: data.duration,
    privacy: data.privacy,
    thumbnail_url: data.thumbnailUrl || null,
    created_at: now,
    updated_at: now
  };
  const { data: recording, error } = await supabase.from("recordings").insert(recordingData).select().single();
  if (error) {
    throw new Error(`Failed to create recording: ${error.message}`);
  }
  return recording;
}
async function getRecording(id) {
  const { data: recording, error } = await supabase.from("recordings").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get recording: ${error.message}`);
  }
  return recording;
}
async function listRecordings(params = {}) {
  const { limit = 20, offset = 0, search } = params;
  let query = supabase.from("recordings").select("*", { count: "exact" });
  if (search == null ? void 0 : search.trim()) {
    query = query.ilike("title", `%${search.trim()}%`);
  }
  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  const { data: recordings, error, count } = await query;
  if (error) {
    throw new Error(`Failed to list recordings: ${error.message}`);
  }
  const total = count || 0;
  const hasMore = offset + ((recordings == null ? void 0 : recordings.length) || 0) < total;
  return {
    recordings: recordings || [],
    total,
    hasMore
  };
}
async function updateRecording(data) {
  const updateData = {
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (data.title !== void 0) updateData.title = data.title;
  if (data.privacy !== void 0) updateData.privacy = data.privacy;
  if (data.thumbnailUrl !== void 0) updateData.thumbnail_url = data.thumbnailUrl;
  const { data: recording, error } = await supabase.from("recordings").update(updateData).eq("id", data.id).select().single();
  if (error) {
    throw new Error(`Failed to update recording: ${error.message}`);
  }
  return recording;
}
async function deleteRecording(id) {
  const { error } = await supabase.from("recordings").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete recording: ${error.message}`);
  }
}
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
async function trackEvent(data) {
  const eventId = generateId();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const eventData = {
    id: eventId,
    event_type: data.eventType,
    recording_id: data.recordingId || null,
    session_id: data.sessionId || null,
    user_agent: data.userAgent || null,
    properties: data.properties || {},
    created_at: now
  };
  const { error } = await supabase.from("events").insert(eventData);
  if (error) {
    throw new Error(`Failed to track event: ${error.message}`);
  }
  return { success: true };
}
async function getStats(params = {}) {
  const { startDate, endDate, eventType, recordingId } = params;
  let query = supabase.from("events").select("*");
  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }
  if (eventType) {
    query = query.eq("event_type", eventType);
  }
  if (recordingId) {
    query = query.eq("recording_id", recordingId);
  }
  const { data: events, error } = await query;
  if (error) {
    throw new Error(`Failed to get stats: ${error.message}`);
  }
  const eventsList = events || [];
  const totalEvents = eventsList.length;
  const eventsByType = {};
  eventsList.forEach((event) => {
    eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
  });
  const eventsByDateMap = {};
  eventsList.forEach((event) => {
    const date = event.created_at.split("T")[0];
    eventsByDateMap[date] = (eventsByDateMap[date] || 0) + 1;
  });
  const eventsByDate = Object.entries(eventsByDateMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  const recordingCounts = {};
  eventsList.forEach((event) => {
    if (event.recording_id) {
      recordingCounts[event.recording_id] = (recordingCounts[event.recording_id] || 0) + 1;
    }
  });
  const topRecordings = Object.entries(recordingCounts).map(([recording_id, count]) => ({ recording_id, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  return {
    totalEvents,
    eventsByType,
    eventsByDate,
    topRecordings
  };
}
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting current user:", error.message);
    return null;
  }
  return user ? {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
    app_metadata: user.app_metadata
  } : null;
}
async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting current session:", error.message);
    return null;
  }
  return session;
}
async function signUp({ email, password, metadata }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  return {
    user: data.user ? {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata,
      app_metadata: data.user.app_metadata
    } : null,
    session: data.session,
    error
  };
}
async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return {
    user: data.user ? {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata,
      app_metadata: data.user.app_metadata
    } : null,
    session: data.session,
    error
  };
}
async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  return { error };
}
async function signInWithGitHub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  return { error };
}
async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  });
  return { error };
}
async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({
    password
  });
  return { error };
}
function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
class AnalyticsServiceClient {
  /**
   * Retrieves anonymous usage statistics for the application.
   */
  async getStats(params) {
    return getStats(params);
  }
  /**
   * Tracks an analytics event for privacy-respecting usage insights.
   */
  async trackEvent(params) {
    return trackEvent(params);
  }
}
class AuthServiceClient {
  /**
   * Exchanges an authorization code for an access token.
   */
  async exchangeCode(params) {
    throw new Error("Use signInWithGoogle or signInWithGitHub instead of exchangeCode");
  }
  /**
   * Retrieves the public configuration for the auth service.
   */
  async getConfig() {
    return {
      googleClientId: "your-google-client-id"
      // This should be configured in Supabase
    };
  }
  /**
   * Refreshes an access token using a refresh token.
   */
  async refreshToken(params) {
    const session = await getCurrentSession();
    return {
      user: (session == null ? void 0 : session.user) ? {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata,
        app_metadata: session.user.app_metadata
      } : null,
      session,
      error: null
    };
  }
  // Additional Supabase-specific methods
  async getCurrentUser() {
    return getCurrentUser();
  }
  async getCurrentSession() {
    return getCurrentSession();
  }
  async signUp(params) {
    return signUp(params);
  }
  async signIn(params) {
    return signIn(params);
  }
  async signOut() {
    return signOut();
  }
  async signInWithGoogle() {
    return signInWithGoogle();
  }
  async signInWithGitHub() {
    return signInWithGitHub();
  }
  async resetPassword(email) {
    return resetPassword(email);
  }
  async updatePassword(password) {
    return updatePassword(password);
  }
  onAuthStateChange(callback) {
    return onAuthStateChange(callback);
  }
}
class HealthServiceClient {
  /**
   * Returns the health status of the RecordLane backend services.
   */
  async check() {
    try {
      const { data, error } = await __vitePreload(async () => {
        const { data: data2, error: error2 } = await import("./supabase-aC0e6cYW.js");
        return { data: data2, error: error2 };
      }, true ? __vite__mapDeps([0,1,2]) : void 0).then(
        (m) => m.supabase.from("recordings").select("count", { count: "exact", head: true })
      );
      if (error) {
        return {
          status: "unhealthy",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      return {
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
}
class MetadataServiceClient {
  /**
   * Creates a new recording metadata entry.
   */
  async create(params) {
    return createRecording(params);
  }
  /**
   * Deletes a recording metadata entry.
   */
  async deleteRecording(params) {
    return deleteRecording(params.id);
  }
  /**
   * Retrieves a recording by its ID.
   */
  async get(params) {
    return getRecording(params.id);
  }
  /**
   * Retrieves all recordings, ordered by creation date (latest first).
   */
  async list(params) {
    return listRecordings(params);
  }
  /**
   * Updates a recording's metadata.
   */
  async update(params) {
    return updateRecording(params);
  }
}
class Client {
  constructor() {
    this.analytics = new AnalyticsServiceClient();
    this.auth = new AuthServiceClient();
    this.health = new HealthServiceClient();
    this.metadata = new MetadataServiceClient();
  }
  /**
   * Creates a new client with the given options (for compatibility)
   */
  with(options) {
    return new Client();
  }
}
const supabaseClient = new Client();
export {
  AnalyticsServiceClient,
  AuthServiceClient,
  Client,
  HealthServiceClient,
  MetadataServiceClient,
  supabaseClient as default
};
