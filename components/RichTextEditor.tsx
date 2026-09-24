"use client";

import { useEffect, useRef, useCallback } from "react";

import { useEditor, EditorContent } from "@tiptap/react";
import { Mark, mergeAttributes, type RawCommands } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { ResizableImage } from "./editor/ResizableImageExtension";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Quote,
  Strikethrough,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  Table as TableIcon,
  Trash2,
  ArrowDownToLine,
  ArrowUpToLine,
  ArrowRightToLine,
  ArrowLeftToLine,
  RemoveFormatting,
  Merge,
  SplitSquareHorizontal,
  ToggleLeft,
  RowsIcon,
  ColumnsIcon,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minimize2,
  Indent,
  Outdent,
} from "lucide-react";

// ─── Custom inline mark: TextSize ─────────────────────────────────────────────
// Wraps selected text in <span data-text-size="h1|h2|h3"> so headings apply
// only to the selected range, not the whole block.

const TextSize = Mark.create({
  name: "textSize",

  addAttributes() {
    return {
      level: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-text-size]",
        getAttrs: (el: HTMLElement) => ({ level: el.dataset.textSize }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      "span",
      mergeAttributes({ "data-text-size": HTMLAttributes.level }),
      0,
    ];
  },

  addCommands() {
    return {
      setTextSize:
        (level: string) =>
        ({ commands }: { commands: RawCommands }) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (commands as any).setMark(this.name, { level }),
      unsetTextSize:
        () =>
        ({ commands }: { commands: RawCommands }) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (commands as any).unsetMark(this.name),
      toggleTextSize:
        (level: string) =>
        ({
          editor,
          commands,
        }: {
          editor: ReturnType<typeof useEditor>;
          commands: RawCommands;
        }) =>
          editor?.isActive(this.name, { level })
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (commands as any).unsetMark(this.name)
            : // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (commands as any).setMark(this.name, { level }),
    } as Partial<RawCommands>;
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onChangeJson?: (json: object) => void;
  placeholder?: string;
  error?: string;
  /** Bump this to imperatively replace editor content with the current `value` */
  externalContentVersion?: number;
  /** Whether the editor is interactive. If false, toolbars are hidden and content is read-only. Defaults to true. */
  editable?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  onChangeJson,
  placeholder = "Write your content here...",
  error,
  externalContentVersion,
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // prevents SSR/hydration mismatch in Next.js
    editable,
    extensions: [
      StarterKit.configure({
        heading: false, // disable block headings — using inline marks instead
        link: {
          // configure the built-in StarterKit link: open links on click when read-only
          openOnClick: !editable,
          autolink: true,
        },
      }),
      TextSize,
      Table.configure({ resizable: editable }),
      TableRow,
      TableCell,
      TableHeader,
      ResizableImage,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      onChangeJson?.(editor.getJSON());
    },
  });

  // Sync editable property if changed dynamically
  useEffect(() => {
    if (editor && editable !== undefined) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // When externalContentVersion bumps, force-set the editor content
  // (e.g. after a file import)
  useEffect(() => {
    if (
      !editor ||
      externalContentVersion === undefined ||
      externalContentVersion === 0
    )
      return;
    editor.commands.setContent(value, { emitUpdate: false });
    onChange(editor.getHTML());
    onChangeJson?.(editor.getJSON());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalContentVersion]);

  if (!editor) return null;

  // Hidden file input for image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for inline embedding
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      editor.chain().focus().insertContent({ type: "image", attrs: { src: base64, alt: file.name } }).run();
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const addImageFromUrl = () => {
    const url = prompt("Enter image URL");
    if (url) {
      editor.chain().focus().insertContent({ type: "image", attrs: { src: url } }).run();
    }
  };

  const addLink = () => {
    const url = prompt("Enter URL");
    if (url)
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
  };

  return (
    <div
      className={`rounded-lg border ${error ? "border-red-500" : "border-border"} overflow-hidden  bg-white`}
    >
      {/* ProseMirror scoped styles — no Tailwind Typography plugin required */}
      <style>{`
        .ProseMirror {
          outline: none;
          min-height: 320px;
          padding: 1rem 1.25rem;
          font-size: 0.9375rem;
          line-height: 1.75;
          color: var(--foreground);
        }
        .ProseMirror > * + * { margin-top: 0.6em; }
        .ProseMirror p { margin: 0; }

        /* Inline text-size marks — applies only to selected/marked text */
        .ProseMirror [data-text-size="h1"] { font-size: 1.75rem;  font-weight: 700; line-height: 1.2; }
        .ProseMirror [data-text-size="h2"] { font-size: 1.35rem;  font-weight: 600; line-height: 1.3; }
        .ProseMirror [data-text-size="h3"] { font-size: 1.125rem; font-weight: 600; line-height: 1.4; }

        .ProseMirror ul { list-style: disc;    padding-left: 1.6em; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.6em; }
        /* Nested list markers — disc → circle → square */
        .ProseMirror ul ul   { list-style: circle; }
        .ProseMirror ul ul ul { list-style: square; }
        /* Nested ordered lists */
        .ProseMirror ol ol   { list-style: lower-alpha; }
        .ProseMirror ol ol ol { list-style: lower-roman; }
        /* Prevent spacing bleed from the > * + * rule into nested lists */
        .ProseMirror li > ul,
        .ProseMirror li > ol { margin-top: 0.25em; margin-bottom: 0; }
        .ProseMirror li > p { margin: 0; }

        .ProseMirror blockquote {
          border-left: 3px solid var(--primary);
          padding: 0.5em 1em;
          background: color-mix(in srgb, var(--primary) 6%, white);
          border-radius: 0 6px 6px 0;
          color: var(--muted-foreground);
          font-style: italic;
        }

        .ProseMirror code {
          background: var(--muted);
          border-radius: 4px;
          padding: 0.15em 0.4em;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 0.875em;
          color: #c026d3;
        }
        .ProseMirror pre {
          background: #1e293b;
          border-radius: 8px;
          padding: 1em 1.25em;
          overflow-x: auto;
        }
        .ProseMirror pre code {
          background: none;
          color: #e2e8f0;
          padding: 0;
        }

        .ProseMirror hr {
          border: none;
          border-top: 2px solid var(--border);
          margin: 1.25em 0;
        }

        .ProseMirror a {
          color: var(--primary);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .ProseMirror strong { font-weight: 700; }
        .ProseMirror em     { font-style: italic; }
        .ProseMirror s      { text-decoration: line-through; }

        .ProseMirror .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--muted-foreground);
          pointer-events: none;
          float: left;
          height: 0;
        }

        /* Table styles */
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.75em 0;
          overflow: hidden;
          table-layout: fixed;
        }
        .ProseMirror table td,
        .ProseMirror table th {
          border: 1px solid var(--border);
          padding: 0.5em 0.75em;
          vertical-align: top;
          position: relative;
          min-width: 80px;
        }
        .ProseMirror table th {
          background: var(--muted);
          font-weight: 600;
          font-size: 0.875em;
          text-align: left;
        }
        .ProseMirror table td p,
        .ProseMirror table th p {
          margin: 0;
        }
        .ProseMirror table .selectedCell {
          background: color-mix(in srgb, var(--primary) 12%, white);
        }
        .ProseMirror .tableWrapper {
          overflow-x: auto;
          margin: 0.75em 0;
        }
        .ProseMirror .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background: var(--primary);
          pointer-events: none;
        }
        .ProseMirror.resize-cursor { cursor: col-resize; }

        /* Image styles — handled by ResizableImage NodeView */
        .ProseMirror [data-node-view-wrapper] {
          margin: 0;
        }
        .ProseMirror img {
          max-width: 100%;
          border-radius: 8px;
          display: block;
          cursor: default;
        }
      `}</style>

      {/* Toolbar - rendered only in edit mode */}
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 bg-secondary/60 px-2.5 py-2 border-b border-border">
        {/* Inline size marks — apply only to selected text */}
        <Btn
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick={() =>
            (editor.chain().focus() as any).toggleTextSize("h1").run()
          }
          active={editor.isActive("textSize", { level: "h1" })}
          title="Large heading (selected text only)"
        >
          <Heading1 className="w-4 h-4" />
        </Btn>
        <Btn
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick={() =>
            (editor.chain().focus() as any).toggleTextSize("h2").run()
          }
          active={editor.isActive("textSize", { level: "h2" })}
          title="Medium heading (selected text only)"
        >
          <Heading2 className="w-4 h-4" />
        </Btn>
        <Btn
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick={() =>
            (editor.chain().focus() as any).toggleTextSize("h3").run()
          }
          active={editor.isActive("textSize", { level: "h3" })}
          title="Small heading (selected text only)"
        >
          <Heading3 className="w-4 h-4" />
        </Btn>

        <Sep />

        <Btn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </Btn>

        <Sep />

        <Btn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Btn>

        {/* Indent / Outdent — visible when inside any list */}
        {(editor.isActive("bulletList") || editor.isActive("orderedList")) && (
          <>
            <Btn
              onClick={() =>
                editor.chain().focus().sinkListItem("listItem").run()
              }
              active={false}
              title="Indent (Tab)"
            >
              <Indent className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() =>
                editor.chain().focus().liftListItem("listItem").run()
              }
              active={false}
              title="Outdent (Shift+Tab)"
            >
              <Outdent className="w-4 h-4" />
            </Btn>
          </>
        )}

        <Sep />

        <Btn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          active={false}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </Btn>

        <Sep />

        <Btn onClick={addLink} active={editor.isActive("link")} title="Link">
          <LinkIcon className="w-4 h-4" />
        </Btn>

        {/* Image controls */}
        <Btn onClick={addImageFromUrl} active={false} title="Image from URL">
          <ImageIcon className="w-4 h-4" />
        </Btn>
        <label
          className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          title="Upload Image"
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImageUpload}
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </label>

        {/* Image alignment/size — visible when image selected */}
        {editor.isActive("image") && (
          <>
            <Sep />
            <Btn
              onClick={() => editor.chain().focus().updateAttributes("image", { alignment: "left" }).run()}
              active={editor.getAttributes("image").alignment === "left"}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().updateAttributes("image", { alignment: "center" }).run()}
              active={editor.getAttributes("image").alignment === "center"}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().updateAttributes("image", { alignment: "right" }).run()}
              active={editor.getAttributes("image").alignment === "right"}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </Btn>
            <Sep />
            <Btn
              onClick={() => editor.chain().focus().updateAttributes("image", { width: "50%", height: null }).run()}
              active={false}
              title="50% Size"
            >
              <Minimize2 className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().updateAttributes("image", { width: null, height: null }).run()}
              active={false}
              title="Full Size"
            >
              <Maximize2 className="w-4 h-4" />
            </Btn>
            <Sep />
            <Btn
              onClick={() => editor.chain().focus().deleteSelection().run()}
              active={false}
              title="Delete Image"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Btn>
          </>
        )}

        <Sep />

        {/* Table controls */}
        <Btn
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          active={editor.isActive("table")}
          title="Insert Table"
        >
          <TableIcon className="w-4 h-4" />
        </Btn>

        {editor.isActive("table") && (
          <>
            <Sep />

            {/* Row operations */}
            <Btn
              onClick={() => editor.chain().focus().addRowBefore().run()}
              active={false}
              title="Add Row Above"
            >
              <ArrowUpToLine className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().addRowAfter().run()}
              active={false}
              title="Add Row Below"
            >
              <ArrowDownToLine className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().deleteRow().run()}
              active={false}
              title="Delete Row"
            >
              <RowsIcon className="w-4 h-4 text-red-500" />
            </Btn>

            <Sep />

            {/* Column operations */}
            <Btn
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              active={false}
              title="Add Column Left"
            >
              <ArrowLeftToLine className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              active={false}
              title="Add Column Right"
            >
              <ArrowRightToLine className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().deleteColumn().run()}
              active={false}
              title="Delete Column"
            >
              <ColumnsIcon className="w-4 h-4 text-red-500" />
            </Btn>

            <Sep />

            {/* Cell operations */}
            <Btn
              onClick={() => editor.chain().focus().mergeCells().run()}
              active={false}
              title="Merge Cells"
            >
              <Merge className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().splitCell().run()}
              active={false}
              title="Split Cell"
            >
              <SplitSquareHorizontal className="w-4 h-4" />
            </Btn>

            <Sep />

            {/* Header toggles */}
            <Btn
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              active={false}
              title="Toggle Header Row"
            >
              <ToggleLeft className="w-4 h-4" />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().fixTables().run()}
              active={false}
              title="Fix Table"
            >
              <RemoveFormatting className="w-4 h-4" />
            </Btn>

            <Sep />

            {/* Delete table */}
            <Btn
              onClick={() => editor.chain().focus().deleteTable().run()}
              active={false}
              title="Delete Table"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Btn>
          </>
        )}
      </div>
      )}

      {/* Editor */}
      <div className="overflow-y-auto max-h-[70vh]">
        <EditorContent editor={editor} />
      </div>

      {error && (
        <p className="text-sm text-red-600 px-4 py-2.5 bg-red-50 border-t border-red-200">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Shared toolbar helpers ────────────────────────────────────────────────────

function Sep() {
  return <div className="w-px h-5 bg-border mx-1 self-center shrink-0" />;
}

function Btn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focus
        onClick();
      }}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/70 hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
