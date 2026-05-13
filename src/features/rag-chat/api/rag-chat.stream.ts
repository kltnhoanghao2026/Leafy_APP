import { apiClient, getAccessToken } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import { getDeviceId } from "@/src/utils/device";

import {
  type RagChatRequest,
  type RagChatResponse,
} from "../schema/ragChat.schema";

type JsonRecord = Record<string, unknown>;

export type RagChatStreamState = {
  ragState?: string;
  step?: number;
  currentNode?: string;
  updatedFields?: string[];
};

export type RagChatStreamChunk = {
  ragState?: string;
  step?: number;
  currentNode?: string;
  chunkIndex?: number;
};

export type RagChatStreamHandlers = {
  onState?: (payload: RagChatStreamState) => void;
  onChunk?: (chunk: string, payload: RagChatStreamChunk) => void;
  onCompleted?: (result: RagChatResponse) => void;
};

export type RagChatStreamOptions = {
  signal?: AbortSignal;
};

const asRecord = (value: unknown): JsonRecord => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }

  return {};
};

const asString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  return undefined;
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const asStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const values = value
    .map((item) => asString(item))
    .filter((item): item is string => Boolean(item));

  return values.length > 0 ? values : undefined;
};

const toAbsoluteUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = apiClient.defaults.baseURL ?? "";
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const parseMaybeJson = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

const mapCompletedResult = (raw: JsonRecord): RagChatResponse => {
  const mapped: RagChatResponse = {
    answer: asString(raw.answer) ?? "",
    threadId: asString(raw.thread_id ?? raw.threadId) ?? "",
    documents: (raw.documents ?? []) as RagChatResponse["documents"],
    plan: raw.plan ?? raw.treatment_plan ?? raw.treatmentPlan,
    plantId: asString(raw.plant_id ?? raw.plantId),
    webSearchResults: (raw.web_search_results ??
      raw.webSearchResults ??
      []) as RagChatResponse["webSearchResults"],
    savedPlanId: asString(raw.saved_plan_id ?? raw.savedPlanId),
  };

  return mapped;
};

const parseEventBlock = (
  rawBlock: string,
): { eventName: string; payload: JsonRecord | undefined } | undefined => {
  const lines = rawBlock
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return undefined;
  }

  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
      continue;
    }

    // fallback when chunks miss the exact prefix but still belongs to the same block
    if (dataLines.length > 0) {
      dataLines.push(line);
    }
  }

  if (dataLines.length === 0) {
    return undefined;
  }

  const dataString = dataLines.join("\n");
  const parsed = parseMaybeJson(dataString);
  return {
    eventName,
    payload: parsed ? asRecord(parsed) : undefined,
  };
};

export const streamRagChat = async (
  request: RagChatRequest,
  handlers: RagChatStreamHandlers,
  options: RagChatStreamOptions = {},
): Promise<RagChatResponse> => {
  const url = toAbsoluteUrl(API_ENDPOINTS.RAG.CHAT_STREAM);
  const token = await getAccessToken();
  const deviceId = await getDeviceId();

  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    "Content-Type": "application/json",
    "X-Device-ID": deviceId,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      question: request.question,
      thread_id: request.threadId,
      threadId: request.threadId,
      language: request.language,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const fallbackMessage = `RAG streaming request failed (${response.status}).`;
    const bodyText = await response.text();
    const parsedBody = parseMaybeJson(bodyText);
    const parsedMessage = asString(asRecord(parsedBody).message);
    throw new Error(parsedMessage ?? fallbackMessage);
  }

  let finalResult: RagChatResponse | null = null;
  let buffer = "";

  const dispatchEvent = (eventName: string, payload: JsonRecord): void => {
    if (eventName === "state") {
      handlers.onState?.({
        ragState: asString(payload.rag_state ?? payload.ragState),
        step: asNumber(payload.step),
        currentNode: asString(payload.current_node ?? payload.currentNode),
        updatedFields: asStringArray(
          payload.updated_fields ?? payload.updatedFields,
        ),
      });
      return;
    }

    if (eventName === "response_chunk") {
      const chunk = asString(payload.chunk) ?? "";
      handlers.onChunk?.(chunk, {
        ragState: asString(payload.rag_state ?? payload.ragState),
        step: asNumber(payload.step),
        currentNode: asString(payload.current_node ?? payload.currentNode),
        chunkIndex: asNumber(payload.chunk_index ?? payload.chunkIndex),
      });
      return;
    }

    if (eventName === "completed") {
      const rawResult = asRecord(payload.result);
      finalResult = mapCompletedResult(rawResult);
      handlers.onCompleted?.(finalResult);
      return;
    }

    if (eventName === "error") {
      const message =
        asString(payload.message) ?? "RAG streaming request returned an error.";
      throw new Error(message);
    }
  };

  const flushBuffer = (flushAll = false): void => {
    let separatorIndex = buffer.indexOf("\n\n");

    while (separatorIndex >= 0) {
      const block = buffer.slice(0, separatorIndex).trim();
      buffer = buffer.slice(separatorIndex + 2);

      if (block.length > 0) {
        const parsed = parseEventBlock(block);
        if (parsed?.payload) {
          dispatchEvent(parsed.eventName, parsed.payload);
        }
      }

      separatorIndex = buffer.indexOf("\n\n");
    }

    if (flushAll) {
      const trailing = buffer.trim();
      if (trailing.length > 0) {
        const parsed = parseEventBlock(trailing);
        if (parsed?.payload) {
          dispatchEvent(parsed.eventName, parsed.payload);
        }
      }
      buffer = "";
    }
  };

  if (response.body && typeof response.body.getReader === "function") {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder
          .decode(value, { stream: true })
          .replace(/\r\n/g, "\n");
        flushBuffer(false);
      }

      buffer += decoder.decode();
      flushBuffer(true);
    } finally {
      reader.releaseLock();
    }
  } else {
    const fullText = (await response.text()).replace(/\r\n/g, "\n");
    buffer += fullText;
    flushBuffer(true);
  }

  if (!finalResult) {
    throw new Error("RAG streaming completed without a final payload.");
  }

  return finalResult;
};
