import { useEffect, useRef } from "react";
import { basicSetup } from "codemirror";
import { sql } from "@codemirror/lang-sql";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";

type SqlEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SqlEditor({ value, onChange }: SqlEditorProps) {
  const editorHost = useRef<HTMLDivElement>(null);
  const editorView = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editorHost.current) {
      return undefined;
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: initialValueRef.current,
      extensions: [
        basicSetup,
        sql(),
        oneDark,
        keymap.of([...defaultKeymap, indentWithTab]),
        updateListener,
        EditorView.theme({
          "&": { minHeight: "220px" },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": { minHeight: "220px", padding: "16px" },
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorHost.current });
    editorView.current = view;

    return () => {
      view.destroy();
      editorView.current = null;
    };
  }, []);

  useEffect(() => {
    const view = editorView.current;
    if (!view || view.state.doc.toString() === value) {
      return;
    }

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  }, [value]);

  return <div className="sql-editor" ref={editorHost} />;
}




