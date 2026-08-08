import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTerminal } from "@/hooks/useTerminal";

const samplePost = (slug: string, title = "Sample") => ({
  id: slug,
  slug,
  title,
  subtitle: "",
  content: "",
  image: "",
  featured: false,
  status: "published",
  created_at: "",
  published_at: "",
  tags: [],
});

function renderTerminal(overrides: Partial<Parameters<typeof useTerminal>[0]> = {}) {
  const onNavigate = vi.fn();
  const onClose = vi.fn();
  const onThemeToggle = vi.fn();
  const r = renderHook(() =>
    useTerminal({
      posts: [samplePost("first")],
      onNavigate,
      onClose,
      onThemeToggle,
      ...overrides,
    }),
  );
  return { ...r, onNavigate, onClose, onThemeToggle };
}

function pressEnter(hook: ReturnType<typeof renderTerminal>, cmd: string) {
  act(() => hook.result.current.setInput(cmd));
  act(() => {
    hook.result.current.handleKeyDown({ key: "Enter", preventDefault: () => {} } as any);
  });
}

function pressKey(hook: ReturnType<typeof renderTerminal>, key: string) {
  act(() => {
    hook.result.current.handleKeyDown({
      key,
      preventDefault: () => {},
    } as any);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useTerminal · welcome", () => {
  it("starts with 3 welcome lines", () => {
    const hook = renderTerminal();
    expect(hook.result.current.lines).toHaveLength(3);
    expect(hook.result.current.lines[0].type).toBe("welcome");
  });

  it("welcome text does not contain personal name when no ownerInfo", () => {
    const hook = renderTerminal();
    const welcome = hook.result.current.lines[0].text;
    expect(welcome).not.toContain("matheus");
    expect(welcome).not.toContain("mierzwa");
    expect(welcome).toContain("portfolio");
  });

  it("welcome text uses ownerInfo.slug when provided", () => {
    const hook = renderTerminal({
      ownerInfo: { name: "Ana Lima", slug: "ana-lima", role: "Designer UX" },
    });
    const welcome = hook.result.current.lines[0].text;
    expect(welcome).toContain("ana-lima");
  });
});

describe("useTerminal · commands", () => {
  it("help prints available commands", () => {
    const hook = renderTerminal();
    pressEnter(hook, "help");
    const texts = hook.result.current.lines.map((l) => l.text).join("\n");
    expect(texts).toContain("Available commands");
    expect(texts).toContain("home");
    expect(texts).toContain("projects");
  });

  it("home command navigates after delay", () => {
    const hook = renderTerminal();
    pressEnter(hook, "home");
    expect(hook.onNavigate).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(hook.onNavigate).toHaveBeenCalledWith("/");
    expect(hook.onClose).toHaveBeenCalled();
  });

  it("projects → /portfolio, blog → /blog, about → /sobre, resume → /curriculo", () => {
    const hook = renderTerminal();
    pressEnter(hook, "projects");
    act(() => vi.advanceTimersByTime(400));
    expect(hook.onNavigate).toHaveBeenLastCalledWith("/portfolio");

    pressEnter(hook, "blog");
    act(() => vi.advanceTimersByTime(400));
    expect(hook.onNavigate).toHaveBeenLastCalledWith("/blog");

    pressEnter(hook, "about");
    act(() => vi.advanceTimersByTime(400));
    expect(hook.onNavigate).toHaveBeenLastCalledWith("/sobre");

    pressEnter(hook, "resume");
    act(() => vi.advanceTimersByTime(400));
    expect(hook.onNavigate).toHaveBeenLastCalledWith("/curriculo");
  });

  it("posts lists published posts", () => {
    const hook = renderTerminal();
    pressEnter(hook, "posts");
    const text = hook.result.current.lines.map((l) => l.text).join("\n");
    expect(text).toContain("Published posts:");
    expect(text).toContain("first");
  });

  it("posts shows 'No published posts found' for empty list", () => {
    const hook = renderTerminal({ posts: [] });
    pressEnter(hook, "posts");
    expect(
      hook.result.current.lines.some((l) =>
        l.text.includes("No published posts"),
      ),
    ).toBe(true);
  });

  it("open <slug> with valid slug navigates", () => {
    const hook = renderTerminal();
    pressEnter(hook, "open first");
    act(() => vi.advanceTimersByTime(400));
    expect(hook.onNavigate).toHaveBeenCalledWith("/blog/first");
  });

  it("open without args prints usage", () => {
    const hook = renderTerminal();
    pressEnter(hook, "open");
    const last = hook.result.current.lines[hook.result.current.lines.length - 1];
    expect(last.type).toBe("error");
    expect(last.text).toContain("usage:");
  });

  it("open with unknown slug prints error", () => {
    const hook = renderTerminal();
    pressEnter(hook, "open ghost");
    const last = hook.result.current.lines[hook.result.current.lines.length - 1];
    expect(last.type).toBe("error");
    expect(last.text).toContain("post not found");
  });

  it("contact without ownerInfo prints no contact info message", () => {
    const hook = renderTerminal();
    pressEnter(hook, "contact");
    const text = hook.result.current.lines.map((l) => l.text).join("\n");
    expect(text).toContain("Contact:");
    expect(text).not.toContain("mierzwa");
    expect(text).toContain("No contact info configured");
  });

  it("contact with ownerInfo prints email, github and linkedin", () => {
    const hook = renderTerminal({
      ownerInfo: {
        name: "Ana Lima",
        slug: "ana-lima",
        role: "Designer UX",
        email: "ana@example.com",
        githubUrl: "https://github.com/ana",
        linkedinUrl: "https://linkedin.com/in/ana",
      },
    });
    pressEnter(hook, "contact");
    const text = hook.result.current.lines.map((l) => l.text).join("\n");
    expect(text).toContain("ana@example.com");
    expect(text).toContain("github.com/ana");
    expect(text).toContain("linkedin.com/in/ana");
  });

  it("ls prints pages list", () => {
    const hook = renderTerminal();
    pressEnter(hook, "ls");
    expect(
      hook.result.current.lines.some((l) => l.text.includes("Pages:")),
    ).toBe(true);
  });

  it("whoami without ownerInfo prints generic fallback", () => {
    const hook = renderTerminal();
    pressEnter(hook, "whoami");
    const text = hook.result.current.lines.map((l) => l.text).join("\n");
    expect(text).not.toContain("matheus");
    expect(text).not.toContain("mierzwa");
    expect(text).toContain("portfolio owner");
  });

  it("whoami with ownerInfo prints name and role", () => {
    const hook = renderTerminal({
      ownerInfo: { name: "Ana Lima", slug: "ana-lima", role: "Designer UX", email: "ana@example.com" },
    });
    pressEnter(hook, "whoami");
    const text = hook.result.current.lines.map((l) => l.text).join("\n");
    expect(text).toContain("Ana Lima");
    expect(text).toContain("Designer UX");
  });

  it("theme calls onThemeToggle", () => {
    const hook = renderTerminal();
    pressEnter(hook, "theme");
    expect(hook.onThemeToggle).toHaveBeenCalled();
  });

  it("theme without callback prints error", () => {
    const hook = renderTerminal({ onThemeToggle: undefined });
    pressEnter(hook, "theme");
    const last = hook.result.current.lines[hook.result.current.lines.length - 1];
    expect(last.type).toBe("error");
  });

  it("clear resets to welcome lines", () => {
    const hook = renderTerminal();
    pressEnter(hook, "help");
    expect(hook.result.current.lines.length).toBeGreaterThan(3);
    pressEnter(hook, "clear");
    expect(hook.result.current.lines).toHaveLength(3);
  });

  it("exit calls onClose", () => {
    const hook = renderTerminal();
    pressEnter(hook, "exit");
    expect(hook.onClose).toHaveBeenCalled();
  });

  it("unknown command prints error", () => {
    const hook = renderTerminal();
    pressEnter(hook, "garbage");
    const last = hook.result.current.lines[hook.result.current.lines.length - 1];
    expect(last.type).toBe("error");
    expect(last.text).toContain("command not found");
  });
});

describe("useTerminal · history & autocomplete", () => {
  it("ArrowUp navigates command history backwards", () => {
    const hook = renderTerminal();
    pressEnter(hook, "help");
    pressEnter(hook, "ls");
    pressKey(hook, "ArrowUp");
    expect(hook.result.current.input).toBe("ls");
    pressKey(hook, "ArrowUp");
    expect(hook.result.current.input).toBe("help");
  });

  it("ArrowDown returns to empty input after going up", () => {
    const hook = renderTerminal();
    pressEnter(hook, "help");
    pressKey(hook, "ArrowUp");
    pressKey(hook, "ArrowDown");
    expect(hook.result.current.input).toBe("");
  });

  it("Tab autocompletes a unique prefix", () => {
    const hook = renderTerminal();
    act(() => hook.result.current.setInput("he"));
    pressKey(hook, "Tab");
    expect(hook.result.current.input).toBe("help");
  });

  it("Escape closes the terminal", () => {
    const hook = renderTerminal();
    pressKey(hook, "Escape");
    expect(hook.onClose).toHaveBeenCalled();
  });
});
