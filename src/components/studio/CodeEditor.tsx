import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import { useMemo } from "react";
import { useProject, useStudio } from "@/lib/studio/store";

export function CodeEditor() {
  const project = useProject();
  const activeFile = useStudio((s) => s.activeFile);
  const writeFile = useStudio((s) => s.writeFile);
  const value = project.files[activeFile];
  const ext = useMemo(() => {
    if (/\.(html?)$/.test(activeFile)) return [html()];
    if (/\.css$/.test(activeFile)) return [css()];
    return [javascript({ jsx: true, typescript: /\.tsx?$/.test(activeFile) })];
  }, [activeFile]);

  if (value === undefined) return <div className="grid h-full place-items-center text-sm text-muted-foreground">Keine Datei geöffnet</div>;
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-3 py-2 font-mono text-xs text-muted-foreground">{activeFile}</div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeMirror key={project.id + activeFile} value={value} height="100%" theme={oneDark} extensions={ext} onChange={(v) => writeFile(activeFile, v)} basicSetup={{ foldGutter: true }} className="h-full" />
      </div>
    </div>
  );
}
