import { useMemo, useContext } from "react";
import {
  CopilotContext,
  CopilotContextParams,
} from "../context/copilot-context";
import { useChat } from "ai/react";
import { ChatRequestOptions, CreateMessage, Message } from "ai";
import { UseChatOptions } from "ai";

export interface UseCopilotChatOptions extends UseChatOptions {
  makeSystemMessage?: (contextString: string) => string;
}

export interface UseCopilotChatReturn {
  visibleMessages: Message[];
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  reload: (
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  stop: () => void;
  isLoading: boolean;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
}

export function useCopilotChat({
  makeSystemMessage,
  ...options
}: UseCopilotChatOptions): UseCopilotChatReturn {
  const {
    getContextString,
    getChatCompletionFunctions,
    getFunctionCallHandler,
  } = useContext(CopilotContext);

  const systemMessage: Message = useMemo(() => {
    const systemMessageMaker = makeSystemMessage || defaultSystemMessage;
    const contextString = getContextString();

    return {
      id: "system",
      content: systemMessageMaker(contextString),
      role: "system",
    };
  }, [getContextString, makeSystemMessage]);

  const initialMessagesWithContext = [systemMessage].concat(
    options.initialMessages || []
  );

  const functions = useMemo(() => {
    return getChatCompletionFunctions();
  }, [getChatCompletionFunctions]);

  const { messages, append, reload, stop, isLoading, input, setInput } =
    useChat({
      id: options.id,
      initialMessages: initialMessagesWithContext,
      experimental_onFunctionCall: getFunctionCallHandler(),
      body: {
        id: options.id,
        previewToken,
        functions,
      },
    });

  const visibleMessages = messages.filter(
    (message) => message.role === "user" || message.role === "assistant"
  );

  return {
    visibleMessages,
    append,
    reload,
    stop,
    isLoading,
    input,
    setInput,
  };
}

const previewToken = "TODO123";

export function defaultSystemMessage(contextString: string): string {
  return `
Please act as a efficient, competent, and conscientious professional assistant.
You help the user achieve their goals, and you do so in a way that is as efficient as possible, without unnecessary fluff, but also without sacrificing professionalism.
Always be polite and respectful, and prefer brevity over verbosity.

The user has provided you with the following context:
\`\`\`
${contextString}
\`\`\`

They have also provided you with functions you can call to initiate actions on their behalf, or functions you can call to receive more information.

Please assist them as best you can.
If you are not sure how to proceed to best fulfill their requests, please ask them for more information.
`;
}