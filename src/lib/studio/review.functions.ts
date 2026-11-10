import { createServerFn } from "@tanstack/react-start";
import { requireOwner } from "./owner-middleware";
import { reviewInput } from "./review";

export const reviewCode = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .inputValidator((input: unknown) => reviewInput.parse(input))
  .handler(async ({ data }) => {
    const { performReview } = await import("./review.server");
    return performReview(data);
  });
