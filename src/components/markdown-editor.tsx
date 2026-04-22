"use client";

import { useEffect, useRef, useState } from "react";
import {
  handleKeyDown,
  shortcuts,
  TextAreaCommandOrchestrator,
  bold,
  italic,
  link,
  quote,
  code,
  unorderedListCommand,
  orderedListCommand,
  checkedListCommand,
  heading3,
  type ICommand,
} from "@uiw/react-md-editor";
import {
  Heading,
  Bold,
  Italic,
  Quote,
  Code,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
} from "lucide-react";
import { Markdown } from "@/components/markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Tab = "write" | "preview";

type ToolbarButton = {
  label: string;
  shortcut?: string;
  Icon: typeof Bold;
  command: ICommand;
};

const TOOLBAR: ToolbarButton[] = [
  { label: "Heading", Icon: Heading, command: heading3 },
  { label: "Bold", shortcut: "Ctrl+B", Icon: Bold, command: bold },
  { label: "Italic", shortcut: "Ctrl+I", Icon: Italic, command: italic },
  { label: "Quote", Icon: Quote, command: quote },
  { label: "Code", Icon: Code, command: code },
  { label: "Link", shortcut: "Ctrl+K", Icon: LinkIcon, command: link },
  { label: "Bulleted list", Icon: List, command: unorderedListCommand },
  { label: "Numbered list", Icon: ListOrdered, command: orderedListCommand },
  { label: "Task list", Icon: ListTodo, command: checkedListCommand },
];

const SHORTCUT_COMMANDS: ICommand[] = [bold, italic, link];

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  autoFocus?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  disabled,
  minHeight = 140,
  autoFocus,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<Tab>("write");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const orchestratorRef = useRef<TextAreaCommandOrchestrator | null>(null);

  useEffect(() => {
    if (tab === "write" && textareaRef.current) {
      orchestratorRef.current = new TextAreaCommandOrchestrator(
        textareaRef.current
      );
    }
  }, [tab]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      const target = e.currentTarget;
      const { selectionStart, value: current } = target;
      const before = current.slice(0, selectionStart);
      const after = current.slice(selectionStart);
      const currentLine = before.split("\n").pop() ?? "";
      const atEndOfLine = after.length === 0 || after.startsWith("\n");
      const emptyListMarker =
        /^\s*(?:- \[[ xX]\] |[-*] |\d+\. )$/.test(currentLine);

      if (atEndOfLine && emptyListMarker) {
        e.preventDefault();
        e.stopPropagation();
        target.setSelectionRange(
          selectionStart - currentLine.length,
          selectionStart
        );
        document.execCommand("delete");
        return;
      }
    }

    handleKeyDown(e, 2, false);
    if (orchestratorRef.current) {
      shortcuts(e, SHORTCUT_COMMANDS, orchestratorRef.current);
    }
  }

  function execute(command: ICommand) {
    if (!orchestratorRef.current || !textareaRef.current) return;
    orchestratorRef.current.executeCommand(command);
    onChange(textareaRef.current.value);
    textareaRef.current.focus();
  }

  return (
    <div className="overflow-hidden rounded-md border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 transition-colors">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-2">
        <div role="tablist" aria-label="Editor mode" className="flex">
          <TabButton active={tab === "write"} onClick={() => setTab("write")}>
            Write
          </TabButton>
          <TabButton
            active={tab === "preview"}
            onClick={() => setTab("preview")}
          >
            Preview
          </TabButton>
        </div>
        {tab === "write" && (
          <TooltipProvider>
            <div className="flex items-center gap-0.5 py-1">
              {TOOLBAR.map(({ label, shortcut, Icon, command }) => (
                <Tooltip key={label}>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        aria-label={label}
                        onClick={() => execute(command)}
                        disabled={disabled}
                        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                      >
                        <Icon className="size-4" />
                      </button>
                    }
                  />
                  <TooltipContent>
                    {label}
                    {shortcut && (
                      <span className="ml-1.5 opacity-60">{shortcut}</span>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        )}
      </div>
      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          style={{ minHeight }}
          className="block w-full resize-y bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      ) : (
        <div
          role="tabpanel"
          aria-label="Preview"
          className="overflow-auto px-3 py-2"
          style={{ minHeight }}
        >
          {value.trim().length > 0 ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview.</p>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
