import { useMemo, useRef, useState } from "react";
import { FilePlus, FileCode2, Trash2, Pencil, FolderPlus, Download, Upload, Plus } from "lucide-react";
import { useProject, useStudio } from "@/lib/studio/store";
import { normalizePath } from "@/lib/studio/parse";
import { Btn } from "./ui";
import { cn } from "@/lib/utils";

export function FileTree({ onOpen }: { onOpen?: () => void }) {
  const project = useProject();
  const { projects, currentId, activeFile, selectProject, createProject, deleteProject, renameProject, setActiveFile, writeFile, deleteFile, renameFile } =
    useStudio();
  const [q, setQ] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const paths = useMemo(() => Object.keys(project.files).sort(), [project.files]);

  const newFile = () => {
    const p = prompt("Dateipfad, z. B. /components/Button.tsx");
    if (p) { const n = normalizePath(p); writeFile(n, ""); setActiveFile(n); onOpen?.(); }
  };

  const exportProject = () => {
    const blob = new Blob([JSON.stringify({ name: project.name, files: project.files }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/\W+/g, "-")}.openvibe.json`;
    a.click();
  };

  const importFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    if (list.length === 1 && list[0].name.endsWith(".json")) {
      try {
        const j = JSON.parse(await list[0].text());
        if (j.files) { createProject(j.name ?? "Import", j.files); return; }
      } catch { /* treat as normal file */ }
    }
    const files: Record<string, string> = {};
    for (const f of Array.from(list)) {
      const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
      if (/node_modules|\.git\/|dist\//.test(rel) || f.size > 500_000) continue;
      const path = normalizePath(rel.split("/").slice(list.length > 1 && rel.includes("/") ? 1 : 0).join("/"));
      files[path] = await f.text();
    }
    if (Object.keys(files).length) createProject("Import", files);
  };

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="border-b p-3 space-y-2">
        <div className="flex items-center gap-1">
          <select className="field flex-1 !py-1.5" value={currentId} onChange={(e) => selectProject(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Btn title="Neues Projekt" onClick={() => { const n = prompt("Projektname"); if (n) createProject(n); }}><Plus size={16} /></Btn>
        </div>
        <div className="flex gap-1">
          <Btn title="Umbenennen" onClick={() => { const n = prompt("Projektname", project.name); if (n) renameProject(project.id, n); }}><Pencil size={14} /></Btn>
          <Btn title="Export" onClick={exportProject}><Download size={14} /></Btn>
          <Btn title="Import (Dateien oder .openvibe.json)" onClick={() => importRef.current?.click()}><Upload size={14} /></Btn>
          <Btn title="Projekt löschen" className="ml-auto hover:text-destructive" onClick={() => confirm(`"${project.name}" löschen?`) && deleteProject(project.id)}><Trash2 size={14} /></Btn>
          <input ref={importRef} type="file" multiple hidden onChange={(e) => importFiles(e.target.files)} />
        </div>
      </div>
      <div className="flex items-center gap-1 px-3 pt-3">
        <span className="text-xs uppercase tracking-widest text-muted-foreground flex-1">Dateien</span>
        <Btn title="Neue Datei" onClick={newFile}><FilePlus size={15} /></Btn>
        <Btn title="Neuer Ordner" onClick={() => { const d = prompt("Ordnername, z. B. components"); if (d) { const n = normalizePath(d.replace(/\/$/, "") + "/index.ts"); writeFile(n, ""); setActiveFile(n); } }}><FolderPlus size={15} /></Btn>
      </div>
      <div className="px-3 py-2"><input className="field !py-1" placeholder="Filtern…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <ul className="flex-1 overflow-auto px-1.5 pb-3 font-mono text-[13px]">
        {paths.filter((p) => p.toLowerCase().includes(q.toLowerCase())).map((p) => {
          const depth = p.split("/").length - 2;
          return (
            <li key={p} className="group flex items-center">
              <button
                onClick={() => { setActiveFile(p); onOpen?.(); }}
                className={cn("flex flex-1 items-center gap-1.5 truncate rounded px-2 py-1.5 text-left", p === activeFile ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")}
                style={{ paddingLeft: 8 + depth * 12 }}
              >
                <FileCode2 size={13} className="shrink-0" />
                <span className="truncate">{depth > 0 ? <span className="opacity-50">{p.split("/").slice(1, -1).join("/")}/</span> : null}{p.split("/").pop()}</span>
              </button>
              <Btn className="h-7 px-1.5 md:opacity-0 group-hover:opacity-100" title="Umbenennen" onClick={() => { const n = prompt("Neuer Pfad", p); if (n && normalizePath(n) !== p) renameFile(p, normalizePath(n)); }}><Pencil size={12} /></Btn>
              <Btn className="h-7 px-1.5 md:opacity-0 group-hover:opacity-100 hover:text-destructive" title="Löschen" onClick={() => confirm(`${p} löschen?`) && deleteFile(p)}><Trash2 size={12} /></Btn>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
