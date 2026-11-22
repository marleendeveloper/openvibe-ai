import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";

export default function PublishedSandpack({
  files,
  customSetup,
}: {
  files: Record<string, string>;
  customSetup: { dependencies: Record<string, string> };
}) {
  return (
    <SandpackProvider
      template="react-ts"
      files={files}
      customSetup={customSetup}
      theme="dark"
      options={{ initMode: "immediate", recompileMode: "delayed", recompileDelay: 400 }}
    >
      <SandpackPreview
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
        style={{ height: "100%" }}
      />
    </SandpackProvider>
  );
}
