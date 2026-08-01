import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "@/components/commerce/states";

describe("<ErrorState />", () => {
  it("announces the failure and offers a retry", async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Could not load products" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Could not load products")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
