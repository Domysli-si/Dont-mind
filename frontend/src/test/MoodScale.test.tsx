import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MoodScale from "../components/MoodScale";

describe("MoodScale", () => {
  it("renders 10 mood buttons", () => {
    render(<MoodScale value={null} onChange={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(10);
  });

  it("calls onChange when a mood is clicked", () => {
    const handleChange = vi.fn();
    render(<MoodScale value={null} onChange={handleChange} />);

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[4]); // 5th button = value 5

    expect(handleChange).toHaveBeenCalledWith(5);
  });

  it("highlights the selected mood", () => {
    render(<MoodScale value={7} onChange={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[6].className).toContain("border-primary");
  });

  it("displays numbers 1 through 10", () => {
    render(<MoodScale value={null} onChange={() => {}} />);
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(String(i))).toBeDefined();
    }
  });
});
