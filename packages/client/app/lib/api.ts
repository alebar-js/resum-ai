const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface FetchOptions extends RequestInit {
  json?: unknown;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { json, headers: customHeaders, ...rest } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const config: RequestInit = {
    ...rest,
    headers,
  };

  if (json) {
    config.body = JSON.stringify(json);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    throw new ApiError(response.status, response.statusText, data);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

// Resume API
export interface Resume {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const resumeApi = {
  getMaster: () => fetchApi<Resume | null>("/resumes/master"),
  updateMaster: (content: string) =>
    fetchApi<Resume>("/resumes/master", {
      method: "PUT",
      json: { content },
    }),
};

// Forks API
export type ForkStatus = "DRAFT" | "MERGED" | "EXPORTED";

export interface JobFork {
  id: string;
  title: string;
  jobDescription: string;
  content: string;
  status: ForkStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateForkInput {
  title: string;
  jobDescription: string;
  content: string;
}

export interface UpdateForkInput {
  title?: string;
  content?: string;
  status?: ForkStatus;
}

export const forksApi = {
  list: () => fetchApi<JobFork[]>("/forks"),
  get: (id: string) => fetchApi<JobFork>(`/forks/${id}`),
  create: (data: CreateForkInput) =>
    fetchApi<JobFork>("/forks", {
      method: "POST",
      json: data,
    }),
  update: (id: string, data: UpdateForkInput) =>
    fetchApi<JobFork>(`/forks/${id}`, {
      method: "PATCH",
      json: data,
    }),
  delete: (id: string) =>
    fetchApi<null>(`/forks/${id}`, {
      method: "DELETE",
    }),
};

// Refactor API
export interface RefactorRequest {
  jobDescription: string;
}

export interface RefactorResponse {
  original: string;
  refactored: string;
}

export const refactorApi = {
  refactor: (data: RefactorRequest) =>
    fetchApi<RefactorResponse>("/refactor", {
      method: "POST",
      json: data,
    }),
};

// Cleanup API
export interface CleanupRequest {
  text: string;
}

export interface CleanupResponse {
  cleaned: string;
}

export const cleanupApi = {
  cleanup: (data: CleanupRequest) =>
    fetchApi<CleanupResponse>("/cleanup", {
      method: "POST",
      json: data,
    }),
};

export { ApiError };
