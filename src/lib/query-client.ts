import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

function expireSession(error: Error) {
  if (error instanceof ApiError && error.status === 401) {
    window.dispatchEvent(new Event("session-expired"));
  }
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: expireSession }),
    mutationCache: new MutationCache({ onError: expireSession }),
    defaultOptions: {
      queries: { staleTime: 30_000, retry: false },
      mutations: { retry: false },
    },
  });
}
