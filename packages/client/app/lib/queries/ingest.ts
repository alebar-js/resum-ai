import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { ingestApi, type IngestTextRequest, type IngestResponse } from "~/lib/api";

export function useIngestFile(): UseMutationResult<IngestResponse, Error, File> {
  return useMutation({
    mutationFn: (file: File) => ingestApi.ingestFile(file),
  });
}

export function useIngestText(): UseMutationResult<IngestResponse, Error, IngestTextRequest> {
  return useMutation({
    mutationFn: (data: IngestTextRequest) => ingestApi.ingestText(data),
  });
}

