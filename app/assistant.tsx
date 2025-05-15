"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import {
  useExternalMessageConverter,
  useExternalStoreRuntime,
} from "@assistant-ui/react";

import {
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { VoiceInput } from "@/components/voice-input";

const MyModelAdapter: ChatModelAdapter = {
  async run({ messages, abortSignal }) {
    // get the last 2 messages from messages, be careful because it can have 0,1,2, or more messages
    const lastTwoMessages = messages.slice(-2);
    
    const response = await fetch("http://localhost:8001/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: lastTwoMessages, model: "round_robin_group_chat" }),
      signal: abortSignal,
    });

    const data = await response.json();
    // // loop through data.choices, and for each message convert the content from a string to an boh (text,type)
    const content = data.choices.filter(f=>{
      if (f.message.content === lastTwoMessages[0].content[0].text) {
        return false;
      }
      return true;
    }).map((choice: any, index: number) => {
      // if it ends with TERMINATE, remove it from string, it can have a perio at the end or not
      if (choice.message.content.toLowerCase().endsWith("terminate")) {
        choice.message.content = choice.message.content.slice(0, -9);
      }
      if (choice.message.content.toLowerCase().endsWith("terminate.")) {
        choice.message.content = choice.message.content.slice(0, -10);
      }
     return {
        text: choice.message.content,
        type: "text",
      };
    });
    
    return {
      content
    };
  },
};

export const Assistant = () => {
  const runtime = useLocalRuntime(MyModelAdapter);

  const handleVoiceTranscript = (text: string) => {
    // Here you can handle the transcribed text
    // For example, you could send it directly to the chat
    console.log("Voice transcript:", text);
  };

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Build Your Own ChatGPT UX
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    Starter Template
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-2">
              <VoiceInput onTranscript={handleVoiceTranscript} />
            </div>
          </header>
          <Thread />
        </SidebarInset>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
