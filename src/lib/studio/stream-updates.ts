/** Coalesce expensive persisted chat updates; flush at every stream boundary. */
export function streamUpdates(publish: (text: string) => void, interval = 50) {
  let text = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const flush = () => {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
    publish(text);
  };
  return {
    append(token: string) {
      text += token;
      if (timer === undefined) timer = setTimeout(flush, interval);
    },
    flush,
    reset() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      text = "";
      publish(text);
    },
  };
}
