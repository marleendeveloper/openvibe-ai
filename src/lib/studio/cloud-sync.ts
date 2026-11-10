import { useStudio, uid, type Message, type Project } from "./store";
import {
  deleteCloudProject,
  listCloudProjects,
  loadCloudProject,
  saveCloudProject,
} from "./cloud.functions";

const toCloudMessages = (messages: Message[]) =>
  messages
    .filter((m) => m.content || m.ops?.length)
    .slice(-200)
    .map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      ops: m.ops,
      opsStatus: m.opsStatus,
      error: m.error,
    }));

/** Speichert das lokale Projekt im Konto und verknüpft es per cloudId. */
export async function pushProject(project: Project): Promise<string> {
  const result = await saveCloudProject({
    data: {
      cloudId: project.cloudId,
      name: project.name,
      files: project.files,
      messages: toCloudMessages(project.messages),
    },
  });
  if (project.cloudId !== result.cloudId)
    useStudio.getState().setCloudId(project.id, result.cloudId);
  return result.cloudId;
}

/** Lädt ein Cloud-Projekt inklusive Chat-Verlauf in das Studio. */
export async function pullProject(cloudId: string): Promise<void> {
  const data = await loadCloudProject({ data: { cloudId } });
  const messages: Message[] = data.messages.map((m, i) => {
    const ops = Array.isArray(m.ops) ? (m.ops as Message["ops"]) : undefined;
    const msg: Message = { id: uid() + i, role: m.role as Message["role"], content: m.content };
    if (ops?.length) {
      msg.ops = ops;
      msg.opsStatus = "applied";
    }
    return msg;
  });
  useStudio
    .getState()
    .importCloudProject({
      cloudId: data.id,
      name: data.name,
      files: data.files as Record<string, string>,
      messages,
    });
}

export async function listProjects() {
  return listCloudProjects();
}

export async function removeCloudProject(cloudId: string) {
  await deleteCloudProject({ data: { cloudId } });
  const st = useStudio.getState();
  const local = st.projects.find((p) => p.cloudId === cloudId);
  if (local) st.setCloudId(local.id, undefined);
}
