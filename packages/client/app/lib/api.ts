export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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

  const headers: Record<string, string> = {};

  // Merge custom headers if provided
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  // Only set Content-Type for requests with a JSON body
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const config: RequestInit = {
    ...rest,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    credentials: "include",
  };

  if (json !== undefined) {
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
export const resumeApi = {
  getMasterData: () => fetchApi<ResumeData | null>("/resumes/master/data"),
  updateMasterData: (data: UpdateResumeData) =>
    fetchApi<ResumeData>("/resumes/master/data", {
      method: "PUT",
      json: data,
    }),
};

// Job Postings API
import type {   
  JobPostingStatus,
  ResumeData,
  UpdateResumeData,
  JobPostingData,
  CreateJobPostingData,
  UpdateJobPostingData,
  RefactorDataRequest,
  RefactorDataResponse,
  SkillGapAnalysisRequest,
  SkillGapAnalysisResponse,
  ResumeProfile,
  IngestTextRequest,
  IngestResponse
} from "@app/shared";

export type { 
  JobPostingStatus,
  ResumeData,
  UpdateResumeData,
  JobPostingData,
  CreateJobPostingData,
  UpdateJobPostingData,
  RefactorDataRequest,
  RefactorDataResponse,
  SkillGapAnalysisRequest,
  SkillGapAnalysisResponse,
  ResumeProfile,
  IngestTextRequest,
  IngestResponse,
};

export interface CreateJobPostingInput {
  title: string;
  jobDescription: string;
  content: string;
}

export interface UpdateJobPostingInput {
  title?: string;
  content?: string;
  status?: JobPostingStatus;
}

export const jobPostingsApi = {
  list: () => fetchApi<JobPostingData[]>("/job-postings"),
  get: (id: string) => fetchApi<JobPostingData>(`/job-postings/${id}`),
  create: (data: CreateJobPostingData) =>
    fetchApi<JobPostingData>("/job-postings", {
      method: "POST",
      json: data,
    }),
  update: (id: string, data: UpdateJobPostingData) =>
    fetchApi<JobPostingData>(`/job-postings/${id}`, {
      method: "PATCH",
      json: data,
    }),
  delete: (id: string) =>
    fetchApi<null>(`/job-postings/${id}`, {
      method: "DELETE",
    }),
  deleteFolder: (name: string) =>
    fetchApi<{ deletedCount: number }>(`/job-postings/folder/${name}`, {
      method: "DELETE",
    }),
};

// Refactor API
export const refactorApi = {
  refactorData: (data: RefactorDataRequest) =>
    fetchApi<RefactorDataResponse>("/refactor/data", {
      method: "POST",
      json: data,
    }),
};

// Skill Gap Analysis API
export const skillGapApi = {
  analyze: (data: SkillGapAnalysisRequest) =>
    fetchApi<SkillGapAnalysisResponse>("/skill-gap/analyze", {
      method: "POST",
      json: data,
    }),
};


// Ingest API
export const ingestApi = {
  ingestFile: async (file: File): Promise<IngestResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/ingest/file`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }
      throw new ApiError(response.status, response.statusText, data);
    }

    return response.json() as Promise<IngestResponse>;
  },

  ingestText: (data: IngestTextRequest) =>
    fetchApi<IngestResponse>("/ingest/text", {
      method: "POST",
      json: data,
    }),
};

// Auth API
export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
};

export const authApi = {
  me: () => fetchApi<SessionUser>("/api/me"),
};

export { ApiError };
