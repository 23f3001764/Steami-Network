export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export const apiAssetUrl = (value?: string) => {
  if (!value) return "";
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;
  return `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
  formData?: FormData;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const getStoredToken = () => {
  try {
    const raw = localStorage.getItem("steami-auth-user");
    return raw ? JSON.parse(raw).token ?? null : null;
  } catch {
    return null;
  }
};

const buildQuery = (params?: Record<string, unknown>) => {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) value.forEach((v) => search.append(key, String(v)));
    else search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

export async function apiRequest<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = options.token ?? getStoredToken();
  const headers = new Headers(options.headers);
  if (!options.formData) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.formData ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "detail" in data
        ? JSON.stringify((data as { detail: unknown }).detail)
        : `Request failed with ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const api = {
  health: () => apiRequest("/health"),

  auth: {
    signup: (body: { full_name: string; email: string; password: string; profession?: string; subscribe_email?: boolean }) =>
      apiRequest("/api/auth/signup", { method: "POST", body }),
    login: (body: { email: string; password: string }) => apiRequest("/api/auth/login", { method: "POST", body }),
    google: (id_token: string) => apiRequest("/api/auth/google", { method: "POST", body: { id_token } }),
    me: () => apiRequest("/api/auth/me"),
    profile: () => apiRequest("/api/auth/profile"),
    updateProfile: (body: Record<string, unknown>) => apiRequest("/api/auth/profile", { method: "PUT", body }),
    patchProfile: (body: Record<string, unknown>) => apiRequest("/api/auth/profile", { method: "PATCH", body }),
    getInterests: () => apiRequest("/api/auth/interests"),
    saveInterests: (topics: string[]) => apiRequest("/api/auth/interests", { method: "POST", body: { topics } }),
    subscribe: (subscribe: boolean) => apiRequest("/api/auth/subscribe", { method: "POST", body: { subscribe } }),
    toggleSubscription: () => apiRequest("/api/auth/subscribe/toggle", { method: "PATCH" }),
    users: () => apiRequest("/api/auth/users"),
    user: (uid: string) => apiRequest(`/api/auth/users/${encodeURIComponent(uid)}`),
    updateUser: (uid: string, body: Record<string, unknown>) => apiRequest(`/api/auth/users/${encodeURIComponent(uid)}`, { method: "PUT", body }),
    updateRole: (uid: string, role: string) => apiRequest(`/api/auth/users/${encodeURIComponent(uid)}/role`, { method: "PUT", body: { role } }),
    deleteUser: (uid: string) => apiRequest(`/api/auth/users/${encodeURIComponent(uid)}`, { method: "DELETE" }),
    toggleUserSubscription: (uid: string) => apiRequest(`/api/auth/users/${encodeURIComponent(uid)}/subscribe/toggle`, { method: "PATCH" }),
    newsletterRecipients: () => apiRequest("/api/auth/newsletter/recipients"),
  },

  newsletter: {
    recipients: () => apiRequest("/api/newsletter/recipients"),
    subscribe: (email: string, name = "") => apiRequest("/api/newsletter/subscribe", { method: "POST", body: { email, name } }),
    unsubscribe: (email: string) => apiRequest("/api/newsletter/unsubscribe", { method: "POST", body: { email } }),
    preview: (limit = 5) => apiRequest(`/api/newsletter/preview${buildQuery({ limit })}`),
    sendDaily: (limit = 5) => apiRequest(`/api/newsletter/send-daily${buildQuery({ limit })}`, { method: "POST" }),
    test: (to_email: string, subject?: string) => apiRequest("/api/newsletter/test", { method: "POST", body: { to_email, subject } }),
    aiSubscribe: (body: { email: string; name?: string; source?: string; metadata?: Record<string, unknown> }) =>
      apiRequest("/api/newsletter/ai-subscribe", { method: "POST", body }),
  },

  public: {
    aiContext: () => apiRequest("/api/public/ai-context"),
    siteInfo: () => apiRequest("/api/public/site-info"),
  },

  articles: {
    sources: () => apiRequest("/api/sources"),
    list: (params?: Record<string, unknown>) => apiRequest(`/api/articles${buildQuery(params)}`),
    forMe: () => apiRequest("/api/articles/for-me"),
    get: (id: string) => apiRequest(`/api/articles/${encodeURIComponent(id)}`),
    create: (body: { title: string; content: string; url?: string; source?: string; topic?: string }) =>
      apiRequest("/api/articles", { method: "POST", body }),
    refresh: (body: { domains?: string[]; target?: number }) => apiRequest("/api/articles/refresh", { method: "POST", body }),
    refreshCheck: (since_hours = 24) => apiRequest(`/api/articles/refresh/check${buildQuery({ since_hours })}`),
    fetch: (body: { topic?: string; keywords?: string[]; limit?: number }) => apiRequest("/api/articles/fetch", { method: "POST", body }),
    fetchSource: (body: { url: string; limit?: number }) => apiRequest("/api/articles/fetch-source", { method: "POST", body }),
    pipeline: (body: { topic?: string; keywords?: string[]; limit?: number }) => apiRequest("/api/pipeline", { method: "POST", body }),
    generateInsight: (articleId: string, force = false) =>
      apiRequest(`/api/articles/${encodeURIComponent(articleId)}/generate-insight${buildQuery({ force })}`, { method: "POST" }),
  },

  insights: {
    status: () => apiRequest("/api/articles/insights/status"),
    list: () => apiRequest("/api/insights"),
    get: (articleId: string) => apiRequest(`/api/insights/${encodeURIComponent(articleId)}`),
    clear: (articleId: string) => apiRequest(`/api/articles/${encodeURIComponent(articleId)}/insight`, { method: "DELETE" }),
    process: (batch_size = 2) => apiRequest("/api/articles/insights/process", { method: "POST", body: { batch_size } }),
    queue: () => apiRequest("/api/articles/insights/queue"),
    clearQueue: () => apiRequest("/api/articles/insights/queue", { method: "DELETE" }),
  },

  feed: {
    fromSelection: (body: { selected_text: string; uid?: string; source_article_id?: string }) =>
      apiRequest("/api/feed/from-selection", { method: "POST", body }),
    items: () => apiRequest("/api/feed/items"),
    get: (id: string) => apiRequest(`/api/feed/items/${encodeURIComponent(id)}`),
    delete: (id: string) => apiRequest(`/api/feed/items/${encodeURIComponent(id)}`, { method: "DELETE" }),
    insight: (id: string) => apiRequest(`/api/feed/items/${encodeURIComponent(id)}/insight`, { method: "POST" }),
  },

  content: {
    uploadImage: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiRequest("/api/images/upload", { method: "POST", formData });
    },
    explainers: () => apiRequest("/api/explainers"),
    explainer: (id: string) => apiRequest(`/api/explainers/${encodeURIComponent(id)}`),
    createExplainer: (body: Record<string, unknown>) => apiRequest("/api/explainers", { method: "POST", body }),
    createExplainerWithImage: (body: Record<string, string>, file: File) => {
      const formData = new FormData();
      Object.entries(body).forEach(([key, value]) => formData.append(key, value));
      formData.append("image", file);
      return apiRequest("/api/explainers/create-with-image", { method: "POST", formData });
    },
    updateExplainer: (id: string, body: Record<string, unknown>) => apiRequest(`/api/explainers/${encodeURIComponent(id)}`, { method: "PUT", body }),
    deleteExplainer: (id: string) => apiRequest(`/api/explainers/${encodeURIComponent(id)}`, { method: "DELETE" }),
    uploadExplainerImage: (id: string, file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return apiRequest(`/api/explainers/${encodeURIComponent(id)}/image`, { method: "POST", formData });
    },
    researchFields: () => apiRequest("/api/research/fields"),
    researchImages: () => apiRequest("/api/research/images"),
    researchArticles: () => apiRequest("/api/research/articles"),
    researchArticle: (id: string) => apiRequest(`/api/research/articles/${encodeURIComponent(id)}`),
    createResearch: (body: Record<string, unknown>) => apiRequest("/api/research/articles", { method: "POST", body }),
    createResearchWithImage: (body: Record<string, string>, file: File) => {
      const formData = new FormData();
      Object.entries(body).forEach(([key, value]) => formData.append(key, value));
      formData.append("image", file);
      return apiRequest("/api/research/articles/create-with-image", { method: "POST", formData });
    },
    updateResearch: (id: string, body: Record<string, unknown>) => apiRequest(`/api/research/articles/${encodeURIComponent(id)}`, { method: "PUT", body }),
    deleteResearch: (id: string) => apiRequest(`/api/research/articles/${encodeURIComponent(id)}`, { method: "DELETE" }),
    uploadResearchImage: (id: string, file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return apiRequest(`/api/research/articles/${encodeURIComponent(id)}/image`, { method: "POST", formData });
    },
    blogPosts: () => apiRequest("/api/blog"),
    blogPost: (id: string) => apiRequest(`/api/blog/${encodeURIComponent(id)}`),
    createBlogPost: (body: Record<string, unknown>) => apiRequest("/api/blog", { method: "POST", body }),
    updateBlogPost: (id: string, body: Record<string, unknown>) => apiRequest(`/api/blog/${encodeURIComponent(id)}`, { method: "PUT", body }),
    deleteBlogPost: (id: string) => apiRequest(`/api/blog/${encodeURIComponent(id)}`, { method: "DELETE" }),
    uploadBlogCover: (id: string, file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return apiRequest(`/api/blog/${encodeURIComponent(id)}/cover-image`, { method: "POST", formData });
    },
    cmsExplainers: () => apiRequest("/api/cms/explainers"),
    cmsExplainer: (id: string) => apiRequest(`/api/cms/explainers/${encodeURIComponent(id)}`),
    cmsResearch: () => apiRequest("/api/cms/research"),
    cmsResearchArticle: (id: string) => apiRequest(`/api/cms/research/${encodeURIComponent(id)}`),
    cmsBlog: () => apiRequest("/api/cms/blog"),
    cmsBlogPost: (id: string) => apiRequest(`/api/cms/blog/${encodeURIComponent(id)}`),
  },

  diary: {
    create: (body: { popup_type: string; popup_id: string; title: string; selected_text: string; note?: string }) =>
      apiRequest("/api/diary", { method: "POST", body }),
    list: () => apiRequest("/api/diary"),
    get: (id: string) => apiRequest(`/api/diary/${encodeURIComponent(id)}`),
    update: (id: string, body: { title?: string; note?: string }) => apiRequest(`/api/diary/${encodeURIComponent(id)}`, { method: "PUT", body }),
    delete: (id: string) => apiRequest(`/api/diary/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },

  dashboard: {
    event: (body: { popup_type: string; popup_id: string; popup_title?: string }) => apiRequest("/api/dashboard/event", { method: "POST", body }),
    me: () => apiRequest("/api/dashboard/me"),
    admin: () => apiRequest("/api/dashboard/admin"),
    events: () => apiRequest("/api/dashboard/admin/events"),
  },

  security: {
    stats: () => apiRequest("/api/security/stats"),
    ban: (ip: string) => apiRequest(`/api/security/ban/${encodeURIComponent(ip)}`, { method: "POST" }),
    unban: (ip: string) => apiRequest(`/api/security/ban/${encodeURIComponent(ip)}`, { method: "DELETE" }),
    clearTempBans: () => apiRequest("/api/security/temp-bans", { method: "DELETE" }),
  },

  chat: {
    upsertUser: (body: { id: string; username: string; avatar?: string; email?: string }) => apiRequest("/api/chat/users", { method: "POST", body }),
    users: () => apiRequest("/api/chat/users"),
    discoverUsers: (params: { uid: string; q?: string }) => apiRequest(`/users/discover${buildQuery(params)}`),
    user: (uid: string) => apiRequest(`/api/chat/users/${encodeURIComponent(uid)}`),
    sendMessage: (body: { senderId: string; receiverId: string; text: string }) => apiRequest("/api/chat/messages", { method: "POST", body }),
    messages: (params?: Record<string, unknown>) => apiRequest(`/api/chat/messages${buildQuery(params)}`),
    markSeen: (body: { receiverId: string; senderId: string }) => apiRequest("/api/chat/messages/seen", { method: "PATCH", body }),
    conversations: (params?: Record<string, unknown>) => apiRequest(`/api/chat/conversations${buildQuery(params)}`),
    unread: (params?: Record<string, unknown>) => apiRequest(`/api/chat/unread${buildQuery(params)}`),
  },
};
